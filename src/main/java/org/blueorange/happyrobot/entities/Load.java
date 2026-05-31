package org.blueorange.happyrobot.entities;

import java.util.Date;
import java.util.List;

public class Load {

    private String loadId;

    private String startingLocation;

    private String deliveryLocation;

    private Date pickupDateTime;

    private Date deliveryDateTime;

    private String equipmentType;

    private Double loadboardRate;

    private String notes;

    private Double weight;

    private List<String> commodityType;

    private Integer numOfPieces;

    private Double miles;

    private Dimension dimensions;

    public Load() {
    }

    public Load(
            String loadId,
            String startingLocation,
            String deliveryLocation,
            Date pickupDateTime,
            Date deliveryDateTime,
            String equipmentType,
            Double loadboardRate,
            String notes,
            Double weight,
            List<String> commodityType,
            Integer numOfPieces,
            Double miles,
            Dimension dimensions) {
        this.loadId = loadId;
        this.startingLocation = startingLocation;
        this.deliveryLocation = deliveryLocation;
        this.pickupDateTime = pickupDateTime;
        this.deliveryDateTime = deliveryDateTime;
        this.equipmentType = equipmentType;
        this.loadboardRate = loadboardRate;
        this.notes = notes;
        this.weight = weight;
        this.commodityType = commodityType;
        this.numOfPieces = numOfPieces;
        this.miles = miles;
        this.dimensions = dimensions;
    }

    public String getLoadId() {
        return loadId;
    }

    public void setLoadId(String loadId) {
        this.loadId = loadId;
    }

    public String getStartingLocation() {
        return startingLocation;
    }

    public void setStartingLocation(String startingLocation) {
        this.startingLocation = startingLocation;
    }

    public String getDeliveryLocation() {
        return deliveryLocation;
    }

    public void setDeliveryLocation(String deliveryLocation) {
        this.deliveryLocation = deliveryLocation;
    }

    public Date getPickupDateTime() {
        return pickupDateTime;
    }

    public void setPickupDateTime(Date pickupDateTime) {
        this.pickupDateTime = pickupDateTime;
    }

    public Date getDeliveryDateTime() {
        return deliveryDateTime;
    }

    public void setDeliveryDateTime(Date deliveryDateTime) {
        this.deliveryDateTime = deliveryDateTime;
    }

    public String getEquipmentType() {
        return equipmentType;
    }

    public void setEquipmentType(String equipmentType) {
        this.equipmentType = equipmentType;
    }

    public Double getLoadboardRate() {
        return loadboardRate;
    }

    public void setLoadboardRate(Double loadboardRate) {
        this.loadboardRate = loadboardRate;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public List<String> getCommodityType() {
        return commodityType;
    }

    public void setCommodityType(List<String> commodityType) {
        this.commodityType = commodityType;
    }

    public Integer getNumOfPieces() {
        return numOfPieces;
    }

    public void setNumOfPieces(Integer numOfPieces) {
        this.numOfPieces = numOfPieces;
    }

    public Double getMiles() {
        return miles;
    }

    public void setMiles(Double miles) {
        this.miles = miles;
    }

    public Dimension getDimensions() {
        return dimensions;
    }

    public void setDimensions(Dimension dimensions) {
        this.dimensions = dimensions;
    }
}
