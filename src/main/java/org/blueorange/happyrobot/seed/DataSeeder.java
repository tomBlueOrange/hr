package org.blueorange.happyrobot.seed;

import com.blueorange.commons.config.OrangeLogger;
import com.blueorange.commons.config.SafeLogParam;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.blueorange.happyrobot.entities.InboundCall;
import org.blueorange.happyrobot.entities.Negotiation;
import org.blueorange.happyrobot.services.CallService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Seeds a realistic demo history of inbound carrier calls (and their negotiation rounds) into the
 * database at startup, so the metrics dashboard has data to show without any live calls.
 *
 * <p>The dataset lives in {@code data/seed_calls.json} and {@code data/seed_negotiations.json}. Each
 * call's timing is stored <em>relative</em> to the present ({@link CallSeed#daysAgo} plus a wall-clock
 * time), so however far in the future the application is started the seeded calls always fall within
 * the past two months. Negotiations are linked to their call via {@link CallSeed#ref}.
 *
 * <p>Seeding is idempotent: it is skipped when the call table is already populated, so a persistent
 * datastore is not re-seeded on every restart (the default in-memory H2 store starts empty each run).
 */
@Component
public class DataSeeder {

    private static final OrangeLogger logger = new OrangeLogger(DataSeeder.class);

    /** Calls are dated within this many days of now, matching the "past two months" requirement. */
    private static final int MAX_DAYS_AGO = 60;
    private static final ZoneId ZONE = ZoneId.systemDefault();

    private final ObjectMapper objectMapper;
    private final CallService callService;
    private final Resource callsData;
    private final Resource negotiationsData;

    @Autowired
    public DataSeeder(
            ObjectMapper objectMapper,
            CallService callService,
            @Value("${application.fde-interview.seed.calls:classpath:data/seed_calls.json}") Resource callsData,
            @Value("${application.fde-interview.seed.negotiations:classpath:data/seed_negotiations.json}") Resource negotiationsData) {
        this.objectMapper = objectMapper;
        this.callService = callService;
        this.callsData = callsData;
        this.negotiationsData = negotiationsData;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void seedOnStartup() {
        try {
            if (!callService.findAllCalls().isEmpty()) {
                logger.info("Call data already present; skipping demo seed");
                return;
            }
            if (!callsData.exists()) {
                logger.warn("No seed file at {}; skipping demo seed", SafeLogParam.of(describe(callsData)));
                return;
            }

            Instant now = Instant.now();
            List<CallSeed> callSeeds = read(callsData, CallSeed.class);
            Map<String, String> idByRef = new HashMap<>();
            int calls = 0;
            for (CallSeed seed : callSeeds) {
                InboundCall saved = callService.createCall(toCall(seed, now));
                if (seed.ref != null) {
                    idByRef.put(seed.ref, saved.getId());
                }
                calls++;
            }

            int negotiations = 0;
            int unlinked = 0;
            if (negotiationsData.exists()) {
                for (NegotiationSeed seed : read(negotiationsData, NegotiationSeed.class)) {
                    String callId = idByRef.get(seed.callRef);
                    if (callId == null) {
                        unlinked++;
                        continue;
                    }
                    callService.createNegotiation(new Negotiation(
                            callId, seed.proposedOffer, seed.accepted, seed.counter, seed.acceptedAmount));
                    negotiations++;
                }
            }

            logger.info("Seeded {} demo call(s) and {} negotiation(s) across the past {} days ({} unlinked skipped)",
                    SafeLogParam.of(calls), SafeLogParam.of(negotiations),
                    SafeLogParam.of(MAX_DAYS_AGO), SafeLogParam.of(unlinked));
        } catch (Exception e) {
            // Demo data is best-effort: a failure here must never stop the application from serving.
            logger.error(e, "Failed to seed demo call data");
        }
    }

    /** Maps a seed row to a persisted call, dating it relative to {@code now} so it lands in the recent past. */
    InboundCall toCall(CallSeed seed, Instant now) {
        int daysAgo = Math.min(MAX_DAYS_AGO, Math.max(1, seed.daysAgo));
        int hour = Math.floorMod(seed.hour, 24);
        int minute = Math.floorMod(seed.minute, 60);

        LocalDateTime startLocal = LocalDate.now(ZONE).minusDays(daysAgo).atTime(hour, minute);
        Instant start = startLocal.atZone(ZONE).toInstant();
        if (!start.isBefore(now)) {
            // Defensive: a same-day seed should never land in the future.
            start = now.minusSeconds(3600);
        }
        Instant end = start.plusSeconds(Math.max(0, seed.durationSeconds));
        if (end.isAfter(now)) {
            end = now;
        }

        InboundCall call = new InboundCall();
        call.setStarted(Date.from(start));
        call.setEnded(Date.from(end));
        call.setSentiment(seed.sentiment);
        call.setCarrierId(seed.carrierId);
        call.setCarrierLocation(seed.carrierLocation);
        call.setCarrierEquipment(seed.carrierEquipment);
        call.setBooked(seed.booked);
        call.setAmount(seed.amount);
        call.setLoadId(seed.loadId);
        call.setBackAndForths(seed.backAndForths);
        return call;
    }

    private <T> List<T> read(Resource resource, Class<T> type) throws IOException {
        try (InputStream in = resource.getInputStream()) {
            List<T> values = objectMapper.readValue(in,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, type));
            return values == null ? new ArrayList<>() : values;
        }
    }

    private static String describe(Resource resource) {
        try {
            return resource.getDescription();
        } catch (Exception e) {
            return String.valueOf(resource);
        }
    }
}
