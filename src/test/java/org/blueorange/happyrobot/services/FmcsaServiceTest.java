package org.blueorange.happyrobot.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.blueorange.happyrobot.entities.fmcsa.Carrier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.queryParam;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;
import static org.hamcrest.Matchers.containsString;

/**
 * Exercises {@link FmcsaService} against a mocked FMCSA API, asserting it hits the right paths with
 * the configured web key and maps the real response envelopes onto {@link Carrier} objects. The
 * sample bodies mirror live QCMobile responses.
 */
class FmcsaServiceTest {

    private static final String BASE_URL = "https://mobile.fmcsa.dot.gov/qc/services";
    private static final String WEB_KEY = "test-web-key";

    private RestClient.Builder builder;
    private MockRestServiceServer server;
    private FmcsaService service;

    @BeforeEach
    void setUp() {
        builder = RestClient.builder();
        server = MockRestServiceServer.bindTo(builder).build();
        service = new FmcsaService(builder, new ObjectMapper(), "live", BASE_URL, WEB_KEY,
                new ClassPathResource("data/mock_carriers.json"));
    }

    @Test
    void getCarrierByDotNumberHitsCarrierPathAndMapsCarrier() {
        String body = """
                {
                  "content": {
                    "_links": { "self": { "href": "x" } },
                    "carrier": {
                      "allowedToOperate": "Y",
                      "statusCode": "A",
                      "dotNumber": 2071774,
                      "legalName": "BOC'S GREYHOUNDS INC",
                      "dbaName": "BGR",
                      "carrierOperation": { "carrierOperationCode": "A", "carrierOperationDesc": "Interstate" },
                      "phyState": "IA",
                      "totalDrivers": 3,
                      "totalPowerUnits": 2
                    }
                  },
                  "retrievalDate": "2026-05-31T04:07:52.261+0000"
                }
                """;
        server.expect(requestTo(containsString(BASE_URL + "/carriers/2071774")))
                .andExpect(method(org.springframework.http.HttpMethod.GET))
                .andExpect(queryParam("webKey", WEB_KEY))
                .andRespond(withSuccess(body, MediaType.APPLICATION_JSON));

        Optional<Carrier> carrier = service.getCarrierByDotNumber("2071774");

        server.verify();
        assertTrue(carrier.isPresent());
        assertEquals(2071774L, carrier.get().getDotNumber());
        assertEquals("BOC'S GREYHOUNDS INC", carrier.get().getLegalName());
        assertEquals("Y", carrier.get().getAllowedToOperate());
        assertEquals("Interstate", carrier.get().getCarrierOperation().getCarrierOperationDesc());
    }

    @Test
    void getCarrierByDotNumberReturnsEmptyWhenContentNull() {
        server.expect(requestTo(containsString("/carriers/76830")))
                .andRespond(withSuccess(
                        "{\"content\":null,\"retrievalDate\":\"2026-05-31T04:07:52.261+0000\"}",
                        MediaType.APPLICATION_JSON));

        assertTrue(service.getCarrierByDotNumber("76830").isEmpty());
        server.verify();
    }

    @Test
    void getCarriersByDocketNumberMapsListContent() {
        String body = """
                {
                  "content": [
                    { "carrier": { "dotNumber": 3537472, "legalName": "ACME TRUCKING LLC", "allowedToOperate": "Y" } }
                  ],
                  "retrievalDate": "2026-05-31T04:07:52.261+0000"
                }
                """;
        server.expect(requestTo(containsString(BASE_URL + "/carriers/docket-number/44110")))
                .andExpect(queryParam("webKey", WEB_KEY))
                .andRespond(withSuccess(body, MediaType.APPLICATION_JSON));

        List<Carrier> carriers = service.getCarriersByDocketNumber("44110");

        server.verify();
        assertEquals(1, carriers.size());
        assertEquals(3537472L, carriers.get(0).getDotNumber());
        assertEquals("ACME TRUCKING LLC", carriers.get(0).getLegalName());
    }

    @Test
    void searchCarriersByNameHitsNamePath() {
        server.expect(requestTo(containsString(BASE_URL + "/carriers/name/greyhound")))
                .andExpect(queryParam("webKey", WEB_KEY))
                .andRespond(withSuccess(
                        "{\"content\":[{\"carrier\":{\"dotNumber\":2071774}}],\"retrievalDate\":\"x\"}",
                        MediaType.APPLICATION_JSON));

        List<Carrier> carriers = service.searchCarriersByName("greyhound");

        server.verify();
        assertEquals(1, carriers.size());
    }

    @Test
    void serverErrorIsSwallowedAsEmptyResult() {
        server.expect(requestTo(containsString("/carriers/1")))
                .andRespond(withServerError());

        // A transport/5xx failure must not propagate; callers see an empty result.
        assertTrue(service.getCarrierByDotNumber("1").isEmpty());
        server.verify();
    }
}
