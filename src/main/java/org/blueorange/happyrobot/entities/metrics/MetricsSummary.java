package org.blueorange.happyrobot.entities.metrics;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * The scalar KPIs for the inbound-carrier-sales dashboard, computed across all recorded
 * {@link org.blueorange.happyrobot.entities.InboundCall}s. Averages are {@code null} when there is no
 * data to average (rather than {@code 0}, which would read as a real measurement), and are omitted
 * from the JSON in that case.
 *
 * <ul>
 *   <li>{@link #totalCalls} &mdash; every inbound call recorded.</li>
 *   <li>{@link #completedBookings} / {@link #failedBookings} &mdash; calls that did / did not result in a booking.</li>
 *   <li>{@link #averageSentiment} &mdash; mean carrier sentiment in {@code [0, 1]}, treating positive as {@code 1}.</li>
 *   <li>{@link #averageBookingWeight} &mdash; mean weight (lbs) of the loads behind booked calls.</li>
 *   <li>{@link #averageCost} &mdash; mean agreed amount of booked calls.</li>
 *   <li>{@link #totalEarnings} &mdash; summed agreed amount across booked calls.</li>
 *   <li>{@link #averageCallDurationSeconds} &mdash; mean call length in seconds.</li>
 * </ul>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class MetricsSummary {

    private long totalCalls;
    private long completedBookings;
    private long failedBookings;
    private Double averageSentiment;
    private Double averageBookingWeight;
    private Double averageCost;
    private Double totalEarnings;
    private Double averageCallDurationSeconds;

    public long getTotalCalls() {
        return totalCalls;
    }

    public void setTotalCalls(long totalCalls) {
        this.totalCalls = totalCalls;
    }

    public long getCompletedBookings() {
        return completedBookings;
    }

    public void setCompletedBookings(long completedBookings) {
        this.completedBookings = completedBookings;
    }

    public long getFailedBookings() {
        return failedBookings;
    }

    public void setFailedBookings(long failedBookings) {
        this.failedBookings = failedBookings;
    }

    public Double getAverageSentiment() {
        return averageSentiment;
    }

    public void setAverageSentiment(Double averageSentiment) {
        this.averageSentiment = averageSentiment;
    }

    public Double getAverageBookingWeight() {
        return averageBookingWeight;
    }

    public void setAverageBookingWeight(Double averageBookingWeight) {
        this.averageBookingWeight = averageBookingWeight;
    }

    public Double getAverageCost() {
        return averageCost;
    }

    public void setAverageCost(Double averageCost) {
        this.averageCost = averageCost;
    }

    public Double getTotalEarnings() {
        return totalEarnings;
    }

    public void setTotalEarnings(Double totalEarnings) {
        this.totalEarnings = totalEarnings;
    }

    public Double getAverageCallDurationSeconds() {
        return averageCallDurationSeconds;
    }

    public void setAverageCallDurationSeconds(Double averageCallDurationSeconds) {
        this.averageCallDurationSeconds = averageCallDurationSeconds;
    }
}
