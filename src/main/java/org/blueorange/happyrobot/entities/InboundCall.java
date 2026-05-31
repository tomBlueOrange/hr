package org.blueorange.happyrobot.entities;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import org.hibernate.annotations.UuidGenerator;

import java.util.Date;

@Entity
public class InboundCall {

    @Id
    @UuidGenerator
    private String id;

    private Date started;

    private Date ended;

    private Boolean sentiment;

    private String carrierId;

    private String carrierLocation;

    private String carrierEquipment;

    private Boolean booked;

    private Double amount;

    private String loadId;

    private Integer backAndForths;

    public InboundCall() {
    }

    public InboundCall(
            Date started,
            Date ended,
            Boolean sentiment,
            String carrierId,
            String carrierLocation,
            String carrierEquipment,
            Boolean booked,
            Double amount,
            String loadId,
            Integer backAndForths) {
        this.started = started;
        this.ended = ended;
        this.sentiment = sentiment;
        this.carrierId = carrierId;
        this.carrierLocation = carrierLocation;
        this.carrierEquipment = carrierEquipment;
        this.booked = booked;
        this.amount = amount;
        this.loadId = loadId;
        this.backAndForths = backAndForths;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public Date getStarted() {
        return started;
    }

    public void setStarted(Date started) {
        this.started = started;
    }

    public Date getEnded() {
        return ended;
    }

    public void setEnded(Date ended) {
        this.ended = ended;
    }

    public Boolean getSentiment() {
        return sentiment;
    }

    public void setSentiment(Boolean sentiment) {
        this.sentiment = sentiment;
    }

    public String getCarrierId() {
        return carrierId;
    }

    public void setCarrierId(String carrierId) {
        this.carrierId = carrierId;
    }

    public String getCarrierLocation() {
        return carrierLocation;
    }

    public void setCarrierLocation(String carrierLocation) {
        this.carrierLocation = carrierLocation;
    }

    public String getCarrierEquipment() {
        return carrierEquipment;
    }

    public void setCarrierEquipment(String carrierEquipment) {
        this.carrierEquipment = carrierEquipment;
    }

    public Boolean getBooked() {
        return booked;
    }

    public void setBooked(Boolean booked) {
        this.booked = booked;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public String getLoadId() {
        return loadId;
    }

    public void setLoadId(String loadId) {
        this.loadId = loadId;
    }

    public Integer getBackAndForths() {
        return backAndForths;
    }

    public void setBackAndForths(Integer backAndForths) {
        this.backAndForths = backAndForths;
    }
}
