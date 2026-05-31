package org.blueorange.happyrobot.controllers;

import com.blueorange.commons.config.OrangeLogger;
import com.blueorange.commons.config.SafeLogParam;
import com.blueorange.passportsdk.annotation.Authentication;
import org.blueorange.happyrobot.entities.InboundCall;
import org.blueorange.happyrobot.entities.Negotiation;
import org.blueorange.happyrobot.services.CallService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * CRUD endpoints for the two persisted call entities the inbound agent records as calls happen:
 * {@link InboundCall} (one per carrier call) under {@code /api/v1/calls}, and the {@link Negotiation}
 * rounds attached to a call under {@code /api/v1/negotiations}. These rows are what the metrics
 * dashboard ({@link MetricsController}) is computed from.
 *
 * <p>Ids are server-generated, so {@code POST} ignores any client-supplied id and returns the created
 * record (with its id) and {@code 201}. {@code PUT}/{@code DELETE} against an unknown id return
 * {@code 404}. All endpoints require authentication.
 */
@RestController
@CrossOrigin
@RequestMapping("/api/v1")
public class CallController {

    private static final OrangeLogger logger = new OrangeLogger(CallController.class);

    private final CallService callService;

    @Autowired
    public CallController(CallService callService) {
        this.callService = callService;
    }

    // --- InboundCall ----------------------------------------------------------

    @Authentication()
    @PostMapping("/calls")
    public ResponseEntity<InboundCall> createCall(@RequestBody InboundCall call) {
        logger.info("Create inbound call request received");
        return new ResponseEntity<>(callService.createCall(call), HttpStatus.CREATED);
    }

    @Authentication()
    @GetMapping("/calls")
    public List<InboundCall> listCalls() {
        return callService.findAllCalls();
    }

    @Authentication()
    @GetMapping("/calls/{id}")
    public ResponseEntity<InboundCall> getCall(@PathVariable String id) {
        return callService.findCall(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Authentication()
    @PutMapping("/calls/{id}")
    public ResponseEntity<InboundCall> updateCall(@PathVariable String id, @RequestBody InboundCall call) {
        logger.info("Update inbound call request received for {}", SafeLogParam.of(id));
        return callService.updateCall(id, call)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Authentication()
    @DeleteMapping("/calls/{id}")
    public ResponseEntity<Void> deleteCall(@PathVariable String id) {
        logger.info("Delete inbound call request received for {}", SafeLogParam.of(id));
        return callService.deleteCall(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }

    // --- Negotiation ----------------------------------------------------------

    @Authentication()
    @PostMapping("/negotiations")
    public ResponseEntity<Negotiation> createNegotiation(@RequestBody Negotiation negotiation) {
        logger.info("Create negotiation request received");
        return new ResponseEntity<>(callService.createNegotiation(negotiation), HttpStatus.CREATED);
    }

    @Authentication()
    @GetMapping("/negotiations")
    public List<Negotiation> listNegotiations() {
        return callService.findAllNegotiations();
    }

    @Authentication()
    @GetMapping("/negotiations/{id}")
    public ResponseEntity<Negotiation> getNegotiation(@PathVariable String id) {
        return callService.findNegotiation(id)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Authentication()
    @PutMapping("/negotiations/{id}")
    public ResponseEntity<Negotiation> updateNegotiation(@PathVariable String id, @RequestBody Negotiation negotiation) {
        logger.info("Update negotiation request received for {}", SafeLogParam.of(id));
        return callService.updateNegotiation(id, negotiation)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @Authentication()
    @DeleteMapping("/negotiations/{id}")
    public ResponseEntity<Void> deleteNegotiation(@PathVariable String id) {
        logger.info("Delete negotiation request received for {}", SafeLogParam.of(id));
        return callService.deleteNegotiation(id)
                ? ResponseEntity.noContent().build()
                : ResponseEntity.notFound().build();
    }
}
