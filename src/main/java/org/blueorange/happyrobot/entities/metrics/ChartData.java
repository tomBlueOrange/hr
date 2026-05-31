package org.blueorange.happyrobot.entities.metrics;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.ArrayList;
import java.util.List;

/**
 * The payload a chart component is rendered from: a list of {@link ChartDataset} series plus the shared
 * category {@code labels} along the x-axis. The field names ({@code dataset}, {@code labels}) match the
 * props of the front-end {@code LineChart}/{@code BarChart} components so a response can be spread
 * straight onto the component. {@code labels} is omitted for scatter charts, whose points carry their
 * own x-values.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChartData {

    private List<ChartDataset> dataset = new ArrayList<>();
    private List<String> labels;

    public ChartData() {
    }

    public ChartData(List<ChartDataset> dataset, List<String> labels) {
        this.dataset = dataset;
        this.labels = labels;
    }

    /** A label-indexed chart (line or bar). */
    public static ChartData of(List<String> labels, List<ChartDataset> dataset) {
        return new ChartData(dataset, labels);
    }

    /** A scatter chart whose datasets carry {@link ScatterPoint}s, so no shared labels are needed. */
    public static ChartData scatter(List<ChartDataset> dataset) {
        return new ChartData(dataset, null);
    }

    public List<ChartDataset> getDataset() {
        return dataset;
    }

    public void setDataset(List<ChartDataset> dataset) {
        this.dataset = dataset;
    }

    public List<String> getLabels() {
        return labels;
    }

    public void setLabels(List<String> labels) {
        this.labels = labels;
    }
}
