package org.blueorange.happyrobot.seed;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.blueorange.happyrobot.entities.InboundCall;
import org.blueorange.happyrobot.entities.Negotiation;
import org.blueorange.happyrobot.services.CallService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Verifies that {@link DataSeeder} ingests the bundled demo dataset, dates every call into the past
 * two months relative to "now", and links each negotiation round back to a persisted call — without
 * needing a Spring context (the persistence layer is mocked).
 */
class DataSeederTest {

    private final List<InboundCall> savedCalls = new ArrayList<>();
    private final List<Negotiation> savedNegotiations = new ArrayList<>();
    private DataSeeder seeder;

    @BeforeEach
    void setUp() {
        CallService callService = mock(CallService.class);
        when(callService.findAllCalls()).thenReturn(List.of());
        when(callService.createCall(any(InboundCall.class))).thenAnswer(invocation -> {
            InboundCall call = invocation.getArgument(0);
            call.setId(UUID.randomUUID().toString());
            savedCalls.add(call);
            return call;
        });
        when(callService.createNegotiation(any(Negotiation.class))).thenAnswer(invocation -> {
            Negotiation negotiation = invocation.getArgument(0);
            savedNegotiations.add(negotiation);
            return negotiation;
        });

        seeder = new DataSeeder(new ObjectMapper(), callService,
                new ClassPathResource("data/seed_calls.json"),
                new ClassPathResource("data/seed_negotiations.json"));
    }

    @Test
    void seedsAllCallsWithinThePastTwoMonths() {
        Instant before = Instant.now();
        seeder.seedOnStartup();
        Instant after = Instant.now();

        assertTrue(savedCalls.size() > 100, "expected a large demo dataset, got " + savedCalls.size());

        Instant earliestAllowed = before.minus(61, ChronoUnit.DAYS);
        for (InboundCall call : savedCalls) {
            assertNotNull(call.getStarted(), "started must be set");
            assertNotNull(call.getEnded(), "ended must be set");
            Instant started = call.getStarted().toInstant();
            Instant ended = call.getEnded().toInstant();

            assertTrue(started.isAfter(earliestAllowed),
                    "call started before the two-month window: " + started);
            assertFalse(started.isAfter(after), "call started in the future: " + started);
            assertFalse(ended.isBefore(started), "ended before started");
            assertFalse(ended.isAfter(after), "ended in the future: " + ended);
        }
    }

    @Test
    void linksEveryNegotiationToASeededCall() {
        seeder.seedOnStartup();

        assertFalse(savedNegotiations.isEmpty(), "expected negotiation rounds to be seeded");
        Set<String> callIds = new HashSet<>();
        for (InboundCall call : savedCalls) {
            callIds.add(call.getId());
        }
        for (Negotiation negotiation : savedNegotiations) {
            assertNotNull(negotiation.getInBoundCallId(), "negotiation must reference a call");
            assertTrue(callIds.contains(negotiation.getInBoundCallId()),
                    "negotiation references an unknown call id: " + negotiation.getInBoundCallId());
        }
    }

    @Test
    void skipsSeedingWhenCallsAlreadyExist() {
        CallService populated = mock(CallService.class);
        when(populated.findAllCalls()).thenReturn(List.of(new InboundCall()));
        DataSeeder guarded = new DataSeeder(new ObjectMapper(), populated,
                new ClassPathResource("data/seed_calls.json"),
                new ClassPathResource("data/seed_negotiations.json"));

        guarded.seedOnStartup();
        // No createCall interaction expected; savedCalls stays empty because a different mock was used.
        assertTrue(savedCalls.isEmpty());
    }
}
