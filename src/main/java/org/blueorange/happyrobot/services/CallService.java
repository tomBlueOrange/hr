package org.blueorange.happyrobot.services;

import com.blueorange.commons.config.OrangeLogger;
import com.blueorange.commons.config.SafeLogParam;
import org.blueorange.happyrobot.entities.InboundCall;
import org.blueorange.happyrobot.entities.Negotiation;
import org.blueorange.happyrobot.repositories.InboundCallRepository;
import org.blueorange.happyrobot.repositories.NegotiationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * CRUD operations over the two persisted call entities: {@link InboundCall} records (one per carrier
 * call) and the {@link Negotiation} rounds attached to them. The inbound agent writes these as calls
 * happen; the metrics layer ({@link MetricsService}) reads them back to build the dashboard.
 *
 * <p>Updates are id-checked: {@link #updateCall}/{@link #updateNegotiation} return empty when no row
 * has the given id, so the controller can answer {@code 404} rather than silently inserting a new row.
 */
@Service
public class CallService {

    private static final OrangeLogger logger = new OrangeLogger(CallService.class);

    private final InboundCallRepository inboundCallRepo;
    private final NegotiationRepository negotiationRepo;

    @Autowired
    public CallService(InboundCallRepository inboundCallRepo, NegotiationRepository negotiationRepo) {
        this.inboundCallRepo = inboundCallRepo;
        this.negotiationRepo = negotiationRepo;
    }

    // --- InboundCall ----------------------------------------------------------

    public InboundCall createCall(InboundCall call) {
        call.setId(null); // ids are generated; never trust a client-supplied id on create
        InboundCall saved = inboundCallRepo.save(call);
        logger.info("Created inbound call {}", SafeLogParam.of(saved.getId()));
        return saved;
    }

    public List<InboundCall> findAllCalls() {
        List<InboundCall> calls = (List<InboundCall>) inboundCallRepo.findAll();
        return calls;
    }

    public Optional<InboundCall> findCall(String id) {
        return inboundCallRepo.findById(id);
    }

    public Optional<InboundCall> updateCall(String id, InboundCall update) {
        if (!inboundCallRepo.existsById(id)) {
            return Optional.empty();
        }
        update.setId(id);
        InboundCall saved = inboundCallRepo.save(update);
        logger.info("Updated inbound call {}", SafeLogParam.of(id));
        return Optional.of(saved);
    }

    public boolean deleteCall(String id) {
        if (!inboundCallRepo.existsById(id)) {
            return false;
        }
        inboundCallRepo.deleteById(id);
        logger.info("Deleted inbound call {}", SafeLogParam.of(id));
        return true;
    }

    // --- Negotiation ----------------------------------------------------------

    public Negotiation createNegotiation(Negotiation negotiation) {
        negotiation.setId(null);
        Negotiation saved = negotiationRepo.save(negotiation);
        logger.info("Created negotiation {} for call {}",
                SafeLogParam.of(saved.getId()), SafeLogParam.of(saved.getInBoundCallId()));
        return saved;
    }

    public List<Negotiation> findAllNegotiations() {
        return (List<Negotiation>) negotiationRepo.findAll();
    }

    public Optional<Negotiation> findNegotiation(String id) {
        return negotiationRepo.findById(id);
    }

    public Optional<Negotiation> updateNegotiation(String id, Negotiation update) {
        if (!negotiationRepo.existsById(id)) {
            return Optional.empty();
        }
        update.setId(id);
        Negotiation saved = negotiationRepo.save(update);
        logger.info("Updated negotiation {}", SafeLogParam.of(id));
        return Optional.of(saved);
    }

    public boolean deleteNegotiation(String id) {
        if (!negotiationRepo.existsById(id)) {
            return false;
        }
        negotiationRepo.deleteById(id);
        logger.info("Deleted negotiation {}", SafeLogParam.of(id));
        return true;
    }
}
