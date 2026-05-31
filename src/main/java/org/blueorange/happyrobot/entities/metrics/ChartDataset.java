package org.blueorange.happyrobot.entities.metrics;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * A single series within a chart, serialised to match the {@code ChartDataset} interface consumed by
 * the front-end chart component library ({@code .claude/fe-components/charts/types/ChartTypes.ts}).
 *
 * <p>{@link #data} is intentionally untyped ({@code List<Object>}): for line and bar charts it holds
 * plain numbers aligned with the chart's {@code labels}; for scatter charts it holds {@link ScatterPoint}
 * {@code {x, y}} objects. Only {@link #label} and {@link #data} are required; the styling fields mirror
 * the optional members of the TypeScript interface and are omitted from JSON when {@code null}.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChartDataset {

    private String label;
    private List<Object> data;
    private String borderColor;
    private String backgroundColor;
    private Integer borderWidth;
    private Object fill;
    private String axis;
    private Integer borderRadius;
    private String yAxisID;

    public ChartDataset() {
    }

    public ChartDataset(String label, List<Object> data) {
        this.label = label;
        this.data = data;
    }

    /** A line/bar series with a stroke and (optional) fill colour. */
    public static ChartDataset line(String label, List<Object> data, String color) {
        ChartDataset ds = new ChartDataset(label, data);
        ds.borderColor = color;
        ds.backgroundColor = color;
        ds.borderWidth = 2;
        return ds;
    }

    /** A bar series with a solid fill colour and lightly rounded corners. */
    public static ChartDataset bar(String label, List<Object> data, String color) {
        ChartDataset ds = new ChartDataset(label, data);
        ds.backgroundColor = color;
        ds.borderColor = color;
        ds.borderRadius = 4;
        return ds;
    }

    /** A scatter series whose {@code data} elements are {@link ScatterPoint}s. */
    public static ChartDataset scatter(String label, List<Object> points, String color) {
        ChartDataset ds = new ChartDataset(label, points);
        ds.backgroundColor = color;
        ds.borderColor = color;
        return ds;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }

    public List<Object> getData() {
        return data;
    }

    public void setData(List<Object> data) {
        this.data = data;
    }

    public String getBorderColor() {
        return borderColor;
    }

    public void setBorderColor(String borderColor) {
        this.borderColor = borderColor;
    }

    public String getBackgroundColor() {
        return backgroundColor;
    }

    public void setBackgroundColor(String backgroundColor) {
        this.backgroundColor = backgroundColor;
    }

    public Integer getBorderWidth() {
        return borderWidth;
    }

    public void setBorderWidth(Integer borderWidth) {
        this.borderWidth = borderWidth;
    }

    public Object getFill() {
        return fill;
    }

    public void setFill(Object fill) {
        this.fill = fill;
    }

    public String getAxis() {
        return axis;
    }

    public void setAxis(String axis) {
        this.axis = axis;
    }

    public Integer getBorderRadius() {
        return borderRadius;
    }

    public void setBorderRadius(Integer borderRadius) {
        this.borderRadius = borderRadius;
    }

    public String getYAxisID() {
        return yAxisID;
    }

    public void setYAxisID(String yAxisID) {
        this.yAxisID = yAxisID;
    }
}
