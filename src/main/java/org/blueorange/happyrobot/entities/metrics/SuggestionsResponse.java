package org.blueorange.happyrobot.entities.metrics;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.List;

/**
 * Location-oriented suggestions derived from the call history, surfacing where the operation is
 * losing bookings and how load weight varies geographically.
 *
 * <ul>
 *   <li>{@link #failedCallsByLocation} &mdash; bar chart of failed-call counts per carrier location,
 *       highest first: the locations bleeding the most bookings.</li>
 *   <li>{@link #weightByLocation} &mdash; bar chart of average load weight per carrier location: which
 *       areas run heavy vs light.</li>
 *   <li>{@link #locationClusters} &mdash; scatter chart placing each location at
 *       {@code (avg weight, failed calls)}, so clusters of heavy-and-failing areas stand out.</li>
 *   <li>{@link #insights} &mdash; short, human-readable takeaways generated from the above.</li>
 * </ul>
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class SuggestionsResponse {

    private ChartData failedCallsByLocation;
    private ChartData weightByLocation;
    private ChartData locationClusters;
    private List<String> insights = new ArrayList<>();

    public ChartData getFailedCallsByLocation() {
        return failedCallsByLocation;
    }

    public void setFailedCallsByLocation(ChartData failedCallsByLocation) {
        this.failedCallsByLocation = failedCallsByLocation;
    }

    public ChartData getWeightByLocation() {
        return weightByLocation;
    }

    public void setWeightByLocation(ChartData weightByLocation) {
        this.weightByLocation = weightByLocation;
    }

    public ChartData getLocationClusters() {
        return locationClusters;
    }

    public void setLocationClusters(ChartData locationClusters) {
        this.locationClusters = locationClusters;
    }

    public List<String> getInsights() {
        return insights;
    }

    public void setInsights(List<String> insights) {
        this.insights = insights;
    }
}
