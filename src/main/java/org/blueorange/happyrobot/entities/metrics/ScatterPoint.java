package org.blueorange.happyrobot.entities.metrics;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * A single {@code {x, y}} point in a scatter-chart dataset. Chart.js reads {@code x} and {@code y}
 * directly; the optional {@link #label} carries the entity behind the point (e.g. a carrier location)
 * so the front-end can annotate or tooltip it.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ScatterPoint {

    private double x;
    private double y;
    private String label;

    public ScatterPoint() {
    }

    public ScatterPoint(double x, double y, String label) {
        this.x = x;
        this.y = y;
        this.label = label;
    }

    public double getX() {
        return x;
    }

    public void setX(double x) {
        this.x = x;
    }

    public double getY() {
        return y;
    }

    public void setY(double y) {
        this.y = y;
    }

    public String getLabel() {
        return label;
    }

    public void setLabel(String label) {
        this.label = label;
    }
}
