package org.blueorange.happyrobot.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.blueorange.happyrobot.entities.fmcsa.Carrier;
import org.blueorange.happyrobot.entities.fmcsa.CarrierValidationResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Verifies the mock state of {@link FmcsaService}: lookups are answered from the bundled
 * {@code mock_carriers.json} and no HTTP call is made. The bound {@link MockRestServiceServer}
 * expects zero requests, so any accidental network call would fail {@link MockRestServiceServer#verify()}.
 */
class FmcsaServiceMockTest {

    private MockRestServiceServer server;
    private FmcsaService service;

    @BeforeEach
    void setUp() {
        RestClient.Builder builder = RestClient.builder();
        // No expectations registered: the server fails if any request is issued.
        server = MockRestServiceServer.bindTo(builder).build();
        service = new FmcsaService(builder, new ObjectMapper(), "mock",
                "https://unused.example", "unused-key",
                new ClassPathResource("data/mock_carriers.json"));
    }

    @Test
    void reportsMockEnabled() {
        assertTrue(service.isMockEnabled());
    }

    @Test
    void findsMockCarrierByDotNumber() {
        Optional<Carrier> carrier = service.getCarrierByDotNumber("2071774");
        assertTrue(carrier.isPresent());
        assertEquals("BOC'S GREYHOUNDS INC", carrier.get().getLegalName());
        assertEquals("Y", carrier.get().getAllowedToOperate());
        server.verify(); // no HTTP performed
    }

    @Test
    void unknownDotNumberIsEmpty() {
        assertTrue(service.getCarrierByDotNumber("999999").isEmpty());
        server.verify();
    }

    @Test
    void findsMockCarrierByDocketNumber() {
        List<Carrier> carriers = service.getCarriersByDocketNumber("987654");
        assertEquals(1, carriers.size());
        assertEquals(3537472L, carriers.get(0).getDotNumber());
        server.verify();
    }

    @Test
    void searchByNameIsCaseInsensitiveAndPartial() {
        List<Carrier> carriers = service.searchCarriersByName("freight");
        // Matches "RELIABLE FREIGHT CARRIERS INC" (legal name) by partial, case-insensitive match.
        assertFalse(carriers.isEmpty());
        assertTrue(carriers.stream().anyMatch(c -> c.getDotNumber() == 1000001L));
        server.verify();
    }

    @Test
    void exposesAnOutOfServiceCarrierForRejectionTesting() {
        Optional<Carrier> carrier = service.getCarrierByDotNumber("2000002");
        assertTrue(carrier.isPresent());
        assertEquals("N", carrier.get().getAllowedToOperate());
        assertEquals("I", carrier.get().getStatusCode());
    }

    @Test
    void validateEligibleCarrier() {
        CarrierValidationResponse result = service.validateCarrier("987654");
        assertTrue(result.isEligible());
        assertEquals("987654", result.getMcNumber());
        assertEquals(3537472L, result.getCarrier().getDotNumber());
        assertTrue(result.getReason().contains("authorized to operate"));
    }

    @Test
    void validateNormalisesMcPrefixedInput() {
        CarrierValidationResponse result = service.validateCarrier("MC-44110");
        assertTrue(result.isEligible());
        assertEquals("BOC'S GREYHOUNDS INC", result.getCarrier().getLegalName());
        server.verify();
    }

    @Test
    void validateRejectsCarrierNotAllowedToOperate() {
        // Docket 222222 -> OUT OF SERVICE HAULERS LLC, allowedToOperate = "N".
        CarrierValidationResponse result = service.validateCarrier("222222");
        assertFalse(result.isEligible());
        assertEquals(2000002L, result.getCarrier().getDotNumber());
        assertTrue(result.getReason().contains("not authorized"));
    }

    @Test
    void validateUnknownCarrierIsIneligibleWithNoCarrier() {
        CarrierValidationResponse result = service.validateCarrier("000000");
        assertFalse(result.isEligible());
        assertNull(result.getCarrier());
        assertTrue(result.getReason().contains("No carrier"));
    }

    @Test
    void validateBlankMcNumberIsIneligible() {
        CarrierValidationResponse result = service.validateCarrier("   ");
        assertFalse(result.isEligible());
        assertNull(result.getCarrier());
    }
}
