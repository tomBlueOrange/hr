package org.blueorange.happyrobot.entities.fmcsa;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * The interstate/intrastate operating classification of a carrier, as returned nested inside the
 * FMCSA QCMobile {@code carrier} object (e.g. {@code {"carrierOperationCode":"A",
 * "carrierOperationDesc":"Interstate"}}).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class CarrierOperation {

    private String carrierOperationCode;
    private String carrierOperationDesc;

    public String getCarrierOperationCode() {
        return carrierOperationCode;
    }

    public void setCarrierOperationCode(String carrierOperationCode) {
        this.carrierOperationCode = carrierOperationCode;
    }

    public String getCarrierOperationDesc() {
        return carrierOperationDesc;
    }

    public void setCarrierOperationDesc(String carrierOperationDesc) {
        this.carrierOperationDesc = carrierOperationDesc;
    }
}
