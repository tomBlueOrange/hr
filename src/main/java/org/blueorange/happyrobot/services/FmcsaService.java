package org.blueorange.happyrobot.services;

import com.blueorange.commons.config.OrangeLogger;
import com.blueorange.commons.config.SafeLogParam;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.blueorange.happyrobot.entities.fmcsa.Carrier;
import org.blueorange.happyrobot.entities.fmcsa.CarrierResult;
import org.blueorange.happyrobot.entities.fmcsa.CarrierValidationResponse;
import org.blueorange.happyrobot.entities.fmcsa.FmcsaCarrierListResponse;
import org.blueorange.happyrobot.entities.fmcsa.FmcsaCarrierResponse;
import org.blueorange.happyrobot.entities.fmcsa.MockCarrier;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.util.UriBuilder;

import java.io.InputStream;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.function.Function;

/**
 * Client for the FMCSA QCMobile API, which exposes the safety and authority data of US DOT-registered
 * motor carriers. Every live call authenticates with a {@code webKey} query parameter appended to
 * the request URL.
 *
 * <p>The base URL and web key are injected from configuration (see {@code application.yml}) so they
 * can be overridden at launch &mdash; e.g. to route through a static-IP proxy when the live host
 * ({@code mobile.fmcsa.dot.gov}) is unreachable from the current network.
 *
 * <p>The service also has a <strong>mock state</strong> (mirroring {@code passport.state}). When
 * {@code application.fde-interview.fmcsa.state} is {@code mock}, lookups are served from a bundled
 * set of mock carriers loaded from {@code mock-data} and the network is never touched &mdash; useful
 * for developing offline or behind a slow VPN.
 *
 * <p>All lookups are best-effort: a missing carrier or a failed call yields an empty result rather
 * than an exception, so callers can treat "not found" and "unavailable" uniformly.
 */
@Service
public class FmcsaService {

    private static final OrangeLogger logger = new OrangeLogger(FmcsaService.class);

    private static final String STATE_MOCK = "mock";

    private final RestClient restClient;
    private final String webKey;

    private final boolean mockEnabled;
    private final List<MockCarrier> mockCarriers;

    @Autowired
    public FmcsaService(
            RestClient.Builder restClientBuilder,
            ObjectMapper objectMapper,
            @Value("${application.fde-interview.fmcsa.state:live}") String state,
            @Value("${application.fde-interview.fmcsa.base-url:https://mobile.fmcsa.dot.gov/qc/services}") String baseUrl,
            @Value("${application.fde-interview.fmcsa.web-key:}") String webKey,
            @Value("${application.fde-interview.fmcsa.mock-data:classpath:data/mock_carriers.json}") Resource mockData
    ) {
        this.webKey = webKey;
        this.restClient = restClientBuilder.baseUrl(baseUrl).build();
        this.mockEnabled = STATE_MOCK.equalsIgnoreCase(state);
        this.mockCarriers = mockEnabled ? loadMockCarriers(objectMapper, mockData) : List.of();

        if (mockEnabled) {
            logger.info("Creating FMCSA Service in MOCK state with {} mock carrier(s); no network calls will be made",
                    SafeLogParam.of(mockCarriers.size()));
        } else {
            logger.info("Creating FMCSA Service in LIVE state against base URL {} (web key configured: {})",
                    SafeLogParam.of(baseUrl), SafeLogParam.of(webKey != null && !webKey.isBlank()));
        }
    }

    /**
     * Looks up a single carrier by its USDOT number.
     *
     * @return the carrier, or empty if no carrier has that number or the call failed
     */
    public Optional<Carrier> getCarrierByDotNumber(String dotNumber) {
        if (mockEnabled) {
            logger.info("[mock] Looking up carrier by USDOT number {}", SafeLogParam.of(dotNumber));
            return mockCarriers.stream()
                    .map(MockCarrier::getCarrier)
                    .filter(Objects::nonNull)
                    .filter(c -> c.getDotNumber() != null && String.valueOf(c.getDotNumber()).equals(trim(dotNumber)))
                    .findFirst();
        }
        logger.info("Looking up FMCSA carrier by USDOT number {}", SafeLogParam.of(dotNumber));
        FmcsaCarrierResponse response = get(
                builder -> builder.path("/carriers/{dotNumber}")
                        .queryParam("webKey", webKey)
                        .build(dotNumber),
                FmcsaCarrierResponse.class);
        if (response == null || response.getContent() == null) {
            return Optional.empty();
        }
        return Optional.ofNullable(response.getContent().getCarrier());
    }

    /**
     * Looks up carriers by their motor-carrier docket number (the MC/MX/FF number a carrier rep
     * typically quotes on a call). A docket number can map to more than one carrier record.
     */
    public List<Carrier> getCarriersByDocketNumber(String docketNumber) {
        if (mockEnabled) {
            logger.info("[mock] Looking up carrier(s) by docket number {}", SafeLogParam.of(docketNumber));
            return mockCarriers.stream()
                    .filter(m -> m.getDocketNumbers() != null && m.getDocketNumbers().contains(trim(docketNumber)))
                    .map(MockCarrier::getCarrier)
                    .filter(Objects::nonNull)
                    .toList();
        }
        logger.info("Looking up FMCSA carrier(s) by docket number {}", SafeLogParam.of(docketNumber));
        return carriers(get(
                builder -> builder.path("/carriers/docket-number/{docketNumber}")
                        .queryParam("webKey", webKey)
                        .build(docketNumber),
                FmcsaCarrierListResponse.class));
    }

    /** Searches carriers by (partial) legal or DBA name. */
    public List<Carrier> searchCarriersByName(String name) {
        if (mockEnabled) {
            logger.info("[mock] Searching carriers by name {}", SafeLogParam.of(name));
            String needle = trim(name).toLowerCase();
            return mockCarriers.stream()
                    .map(MockCarrier::getCarrier)
                    .filter(Objects::nonNull)
                    .filter(c -> containsIgnoreCase(c.getLegalName(), needle)
                            || containsIgnoreCase(c.getDbaName(), needle))
                    .toList();
        }
        logger.info("Searching FMCSA carriers by name {}", SafeLogParam.of(name));
        return carriers(get(
                builder -> builder.path("/carriers/name/{name}")
                        .queryParam("webKey", webKey)
                        .build(name),
                FmcsaCarrierListResponse.class));
    }

    /**
     * Validates a carrier for the inbound carrier-sales flow: given the MC/docket number a carrier
     * rep quotes, this resolves the carrier with FMCSA and decides whether they are eligible to be
     * worked with. A carrier is eligible only if it is found and {@code allowedToOperate == "Y"}.
     *
     * <p>The input is normalised to digits, so {@code "MC-44110"}, {@code "MC 44110"} and
     * {@code "44110"} all resolve to docket {@code 44110}.
     *
     * @param mcNumber the carrier's motor-carrier (MC/MX/FF) docket number, in any common format
     * @return the eligibility decision, including the matched carrier when one is found
     */
    public CarrierValidationResponse validateCarrier(String mcNumber) {
        String docket = normaliseDocket(mcNumber);
        if (docket.isEmpty()) {
            return CarrierValidationResponse.ineligible(mcNumber, null, "No MC number was provided");
        }

        List<Carrier> carriers = getCarriersByDocketNumber(docket);
        if (carriers.isEmpty()) {
            return CarrierValidationResponse.ineligible(mcNumber, null,
                    "No carrier was found for MC number " + mcNumber);
        }

        Carrier carrier = carriers.get(0);
        String label = describe(carrier);
        if (!"Y".equalsIgnoreCase(carrier.getAllowedToOperate())) {
            return CarrierValidationResponse.ineligible(mcNumber, carrier,
                    label + " is not authorized to operate and is not eligible");
        }
        return CarrierValidationResponse.eligible(mcNumber, carrier, label + " is authorized to operate");
    }

    /** @return whether the service is running in mock state (no network calls). */
    public boolean isMockEnabled() {
        return mockEnabled;
    }

    /** Reduces an MC/docket input ("MC-44110", "MC 44110", "44110") to its digits. */
    private static String normaliseDocket(String mcNumber) {
        return mcNumber == null ? "" : mcNumber.replaceAll("[^0-9]", "");
    }

    /** A short carrier label for validation messages, e.g. {@code ACME TRUCKING LLC (USDOT 3537472)}. */
    private static String describe(Carrier carrier) {
        String name = carrier.getLegalName() != null ? carrier.getLegalName() : "Carrier";
        return carrier.getDotNumber() != null ? name + " (USDOT " + carrier.getDotNumber() + ")" : name;
    }

    // --- Mock helpers ---------------------------------------------------------

    private List<MockCarrier> loadMockCarriers(ObjectMapper objectMapper, Resource mockData) {
        try (InputStream in = mockData.getInputStream()) {
            List<MockCarrier> loaded = objectMapper.readValue(
                    in,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, MockCarrier.class));
            return loaded == null ? List.of() : loaded;
        } catch (Exception e) {
            logger.error(e, "Failed to load FMCSA mock carriers from {}; mock lookups will return nothing",
                    SafeLogParam.of(String.valueOf(mockData)));
            return List.of();
        }
    }

    private static String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private static boolean containsIgnoreCase(String haystack, String lowerNeedle) {
        return haystack != null && !lowerNeedle.isEmpty() && haystack.toLowerCase().contains(lowerNeedle);
    }

    // --- Live helpers ---------------------------------------------------------

    private List<Carrier> carriers(FmcsaCarrierListResponse response) {
        if (response == null || response.getContent() == null) {
            return new ArrayList<>();
        }
        return response.getContent().stream()
                .map(CarrierResult::getCarrier)
                .filter(Objects::nonNull)
                .toList();
    }

    /** Issues a GET against the FMCSA API, returning {@code null} (logged) on any transport error. */
    private <T> T get(Function<UriBuilder, URI> uriFunction, Class<T> responseType) {
        try {
            return restClient.get()
                    .uri(uriFunction)
                    .retrieve()
                    .body(responseType);
        } catch (RestClientException e) {
            logger.error(e, "FMCSA API request failed");
            return null;
        }
    }
}
