package org.blueorange.happyrobot.entities.search;

/**
 * A numeric range condition over a {@code DOUBLE} or {@code INT} field, mirroring the search-sdk
 * {@code QueryNumericCondition}. Any combination of bounds may be set; an unset bound is open.
 * {@code gte}/{@code lte} are inclusive, {@code gt}/{@code lt} are exclusive. If both an inclusive
 * and exclusive bound are given on the same side the more restrictive one wins.
 */
public class QueryNumericCondition {

    private String field;
    private Double gte;
    private Double gt;
    private Double lte;
    private Double lt;

    public QueryNumericCondition() {
    }

    public QueryNumericCondition(String field) {
        this.field = field;
    }

    /** Convenience factory for an inclusive {@code [min, max]} range; pass null for an open end. */
    public static QueryNumericCondition between(String field, Double min, Double max) {
        QueryNumericCondition c = new QueryNumericCondition(field);
        c.gte = min;
        c.lte = max;
        return c;
    }

    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public Double getGte() {
        return gte;
    }

    public void setGte(Double gte) {
        this.gte = gte;
    }

    public Double getGt() {
        return gt;
    }

    public void setGt(Double gt) {
        this.gt = gt;
    }

    public Double getLte() {
        return lte;
    }

    public void setLte(Double lte) {
        this.lte = lte;
    }

    public Double getLt() {
        return lt;
    }

    public void setLt(Double lt) {
        this.lt = lt;
    }
}
