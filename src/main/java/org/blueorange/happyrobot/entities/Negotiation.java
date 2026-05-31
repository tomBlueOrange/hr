package org.blueorange.happyrobot.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import org.hibernate.annotations.UuidGenerator;

@Entity
public class Negotiation {

    @Id
    @UuidGenerator
    private String id;

    private String inBoundCallId;

    private Double proposedOffer;

    private Boolean accepted;

    private Double counter;

    private Double acceptedAmount;

    public Negotiation() {
    }

    public Negotiation(
            String inBoundCallId,
            Double proposedOffer,
            Boolean accepted,
            Double counter,
            Double acceptedAmount) {
        this.inBoundCallId = inBoundCallId;
        this.proposedOffer = proposedOffer;
        this.accepted = accepted;
        this.counter = counter;
        this.acceptedAmount = acceptedAmount;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getInBoundCallId() {
        return inBoundCallId;
    }

    public void setInBoundCallId(String inBoundCallId) {
        this.inBoundCallId = inBoundCallId;
    }

    public Double getProposedOffer() {
        return proposedOffer;
    }

    public void setProposedOffer(Double proposedOffer) {
        this.proposedOffer = proposedOffer;
    }

    public Boolean getAccepted() {
        return accepted;
    }

    public void setAccepted(Boolean accepted) {
        this.accepted = accepted;
    }

    public Double getCounter() {
        return counter;
    }

    public void setCounter(Double counter) {
        this.counter = counter;
    }

    public Double getAcceptedAmount() {
        return acceptedAmount;
    }

    public void setAcceptedAmount(Double acceptedAmount) {
        this.acceptedAmount = acceptedAmount;
    }
}
