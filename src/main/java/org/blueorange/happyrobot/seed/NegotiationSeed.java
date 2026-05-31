package org.blueorange.happyrobot.seed;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * One negotiation round of the demo dataset in {@code data/seed_negotiations.json}, loaded at startup
 * by {@link DataSeeder}. {@link #callRef} links the round back to the {@link CallSeed} it belongs to
 * (resolved to the generated call id at load time); it is not persisted.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class NegotiationSeed {

    public String callRef;
    public Double proposedOffer;
    public Double counter;
    public Boolean accepted;
    public Double acceptedAmount;
}
