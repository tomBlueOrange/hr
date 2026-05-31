package org.blueorange.happyrobot.entities;

public class Dimension {

    private Integer height;

    private Integer width;

    private Integer length;

    public Dimension() {
    }

    public Dimension(Integer height, Integer width, Integer length) {
        this.height = height;
        this.width = width;
        this.length = length;
    }

    public Integer getHeight() {
        return height;
    }

    public void setHeight(Integer height) {
        this.height = height;
    }

    public Integer getWidth() {
        return width;
    }

    public void setWidth(Integer width) {
        this.width = width;
    }

    public Integer getLength() {
        return length;
    }

    public void setLength(Integer length) {
        this.length = length;
    }
}
