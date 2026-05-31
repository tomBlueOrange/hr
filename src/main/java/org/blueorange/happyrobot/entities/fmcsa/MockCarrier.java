package org.blueorange.happyrobot.entities.fmcsa;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * A mock carrier record used when {@code FmcsaService} runs in its mock state. It pairs a
 * {@link Carrier} with the docket (MC/MX/FF) numbers that should resolve to it, since the docket
 * number is not part of the live {@code carrier} payload but is needed to mock the
 * lookup-by-docket-number endpoint.
 *
 * <p>These are loaded from the configured mock-data resource (see {@code application.yml}).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class MockCarrier {

    private List<String> docketNumbers;
    private Carrier carrier;

    public List<String> getDocketNumbers() {
        return docketNumbers;
    }

    public void setDocketNumbers(List<String> docketNumbers) {
        this.docketNumbers = docketNumbers;
    }

    public Carrier getCarrier() {
        return carrier;
    }

    public void setCarrier(Carrier carrier) {
        this.carrier = carrier;
    }
}
