package org.blueorange.happyrobot.entities.fmcsa;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * A motor carrier as returned by the FMCSA QCMobile API. The live {@code carrier} object carries
 * ~50 fields; this models the subset relevant to carrier verification (identity, authority,
 * location, size and safety). Unknown fields are ignored so the model is resilient to API additions.
 *
 * <p>The two fields that matter most for "is this carrier allowed to haul this load":
 * {@link #allowedToOperate} ({@code "Y"}/{@code "N"}) and {@link #statusCode}
 * ({@code "A"} active / {@code "I"} inactive).
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class Carrier {

    private Long dotNumber;
    private String legalName;
    private String dbaName;

    /** {@code "Y"} if the carrier is currently authorised to operate, otherwise {@code "N"}. */
    private String allowedToOperate;
    /** {@code "A"} (active) or {@code "I"} (inactive). */
    private String statusCode;
    private CarrierOperation carrierOperation;

    private String phyStreet;
    private String phyCity;
    private String phyState;
    private String phyZipcode;
    private String phyCountry;

    private Integer totalDrivers;
    private Integer totalPowerUnits;

    private String safetyRating;
    private String safetyRatingDate;

    private Long ein;
    private Integer crashTotal;
    private Integer fatalCrash;
    private Integer injCrash;
    private Integer towawayCrash;

    public Long getDotNumber() {
        return dotNumber;
    }

    public void setDotNumber(Long dotNumber) {
        this.dotNumber = dotNumber;
    }

    public String getLegalName() {
        return legalName;
    }

    public void setLegalName(String legalName) {
        this.legalName = legalName;
    }

    public String getDbaName() {
        return dbaName;
    }

    public void setDbaName(String dbaName) {
        this.dbaName = dbaName;
    }

    public String getAllowedToOperate() {
        return allowedToOperate;
    }

    public void setAllowedToOperate(String allowedToOperate) {
        this.allowedToOperate = allowedToOperate;
    }

    public String getStatusCode() {
        return statusCode;
    }

    public void setStatusCode(String statusCode) {
        this.statusCode = statusCode;
    }

    public CarrierOperation getCarrierOperation() {
        return carrierOperation;
    }

    public void setCarrierOperation(CarrierOperation carrierOperation) {
        this.carrierOperation = carrierOperation;
    }

    public String getPhyStreet() {
        return phyStreet;
    }

    public void setPhyStreet(String phyStreet) {
        this.phyStreet = phyStreet;
    }

    public String getPhyCity() {
        return phyCity;
    }

    public void setPhyCity(String phyCity) {
        this.phyCity = phyCity;
    }

    public String getPhyState() {
        return phyState;
    }

    public void setPhyState(String phyState) {
        this.phyState = phyState;
    }

    public String getPhyZipcode() {
        return phyZipcode;
    }

    public void setPhyZipcode(String phyZipcode) {
        this.phyZipcode = phyZipcode;
    }

    public String getPhyCountry() {
        return phyCountry;
    }

    public void setPhyCountry(String phyCountry) {
        this.phyCountry = phyCountry;
    }

    public Integer getTotalDrivers() {
        return totalDrivers;
    }

    public void setTotalDrivers(Integer totalDrivers) {
        this.totalDrivers = totalDrivers;
    }

    public Integer getTotalPowerUnits() {
        return totalPowerUnits;
    }

    public void setTotalPowerUnits(Integer totalPowerUnits) {
        this.totalPowerUnits = totalPowerUnits;
    }

    public String getSafetyRating() {
        return safetyRating;
    }

    public void setSafetyRating(String safetyRating) {
        this.safetyRating = safetyRating;
    }

    public String getSafetyRatingDate() {
        return safetyRatingDate;
    }

    public void setSafetyRatingDate(String safetyRatingDate) {
        this.safetyRatingDate = safetyRatingDate;
    }

    public Long getEin() {
        return ein;
    }

    public void setEin(Long ein) {
        this.ein = ein;
    }

    public Integer getCrashTotal() {
        return crashTotal;
    }

    public void setCrashTotal(Integer crashTotal) {
        this.crashTotal = crashTotal;
    }

    public Integer getFatalCrash() {
        return fatalCrash;
    }

    public void setFatalCrash(Integer fatalCrash) {
        this.fatalCrash = fatalCrash;
    }

    public Integer getInjCrash() {
        return injCrash;
    }

    public void setInjCrash(Integer injCrash) {
        this.injCrash = injCrash;
    }

    public Integer getTowawayCrash() {
        return towawayCrash;
    }

    public void setTowawayCrash(Integer towawayCrash) {
        this.towawayCrash = towawayCrash;
    }
}
