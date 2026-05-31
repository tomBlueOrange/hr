package org.blueorange.happyrobot.repositories;

import org.blueorange.happyrobot.entities.InboundCall;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Confirms an {@link InboundCall} is assigned a generated id on persist, so the CRUD
 * endpoints can create records without the client supplying one.
 */
@SpringBootTest
class InboundCallRepositoryTest {

    @Autowired
    private InboundCallRepository repository;

    @Test
    void persistGeneratesId() {
        InboundCall call = new InboundCall(new Date(), new Date(), true, "carrier-1",
                "Dallas, TX", "Reefer", true, 1500.0, "L-1", 1);
        InboundCall saved = repository.save(call);
        assertNotNull(saved.getId(), "id should be generated on save");
        assertTrue(repository.findById(saved.getId()).isPresent());
    }
}
