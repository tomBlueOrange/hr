package org.blueorange.happyrobot.entities.fmcsa;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * The result of validating a carrier against FMCSA, as returned by the carrier-validation endpoint.
 * It answers the one question the inbound agent needs before pitching a load: is this carrier
 * (identified by their MC/docket number) eligible to be worked with?
 *
 * <ul>
 *   <li>{@link #eligible} &mdash; {@code true} only if a carrier was found and is authorised to operate.</li>
 *   <li>{@link #reason} &mdash; a human-readable explanation suitable for the agent to read back.</li>
 *   <li>{@link #carrier} &mdash; the matched carrier, or {@code null} when none was found.</li>
 * </ul>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class CarrierValidationResponse {

    private String mcNumber;
    private boolean eligible;
    private String reason;
    private Carrier carrier;

    public CarrierValidationResponse() {
    }

    public static CarrierValidationResponse eligible(String mcNumber, Carrier carrier, String reason) {
        CarrierValidationResponse r = new CarrierValidationResponse();
        r.mcNumber = mcNumber;
        r.eligible = true;
        r.carrier = carrier;
        r.reason = reason;
        return r;
    }

    public static CarrierValidationResponse ineligible(String mcNumber, Carrier carrier, String reason) {
        CarrierValidationResponse r = new CarrierValidationResponse();
        r.mcNumber = mcNumber;
        r.eligible = false;
        r.carrier = carrier;
        r.reason = reason;
        return r;
    }

    public String getMcNumber() {
        return mcNumber;
    }

    public void setMcNumber(String mcNumber) {
        this.mcNumber = mcNumber;
    }

    public boolean isEligible() {
        return eligible;
    }

    public void setEligible(boolean eligible) {
        this.eligible = eligible;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public Carrier getCarrier() {
        return carrier;
    }

    public void setCarrier(Carrier carrier) {
        this.carrier = carrier;
    }
}
