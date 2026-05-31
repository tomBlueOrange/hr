package org.blueorange.happyrobot.entities.search;

/**
 * A date range condition over a {@code DATE} field, mirroring the search-sdk
 * {@code QueryDateCondition}. Bounds are ISO-8601 instants (e.g. {@code "2026-06-02T08:00:00Z"})
 * or date-only values (e.g. {@code "2026-06-02"}, interpreted as the start of that UTC day).
 * {@code gte}/{@code lte} are inclusive, {@code gt}/{@code lt} are exclusive.
 */
public class QueryDateCondition {

    private String field;
    private String gte;
    private String gt;
    private String lte;
    private String lt;

    public QueryDateCondition() {
    }

    public QueryDateCondition(String field) {
        this.field = field;
    }

    /** Convenience factory for an inclusive {@code [from, to]} range; pass null for an open end. */
    public static QueryDateCondition between(String field, String from, String to) {
        QueryDateCondition c = new QueryDateCondition(field);
        c.gte = from;
        c.lte = to;
        return c;
    }

    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public String getGte() {
        return gte;
    }

    public void setGte(String gte) {
        this.gte = gte;
    }

    public String getGt() {
        return gt;
    }

    public void setGt(String gt) {
        this.gt = gt;
    }

    public String getLte() {
        return lte;
    }

    public void setLte(String lte) {
        this.lte = lte;
    }

    public String getLt() {
        return lt;
    }

    public void setLt(String lt) {
        this.lt = lt;
    }
}
