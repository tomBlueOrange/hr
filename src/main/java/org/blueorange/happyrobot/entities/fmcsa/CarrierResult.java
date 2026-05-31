package org.blueorange.happyrobot.entities.fmcsa;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * A single entry in an FMCSA response's {@code content}. Each entry wraps a {@link Carrier} under
 * the {@code carrier} key alongside a {@code _links} object (HATEOAS links to sub-resources such as
 * basics and authority), which is ignored here.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class CarrierResult {

    private Carrier carrier;

    public Carrier getCarrier() {
        return carrier;
    }

    public void setCarrier(Carrier carrier) {
        this.carrier = carrier;
    }
}
