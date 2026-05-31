package org.blueorange.happyrobot.entities.search;

/**
 * Orders results by a single key, mirroring the search-sdk {@code SortCondition}. The key is
 * either a {@link LoadField#sortable() sortable} load field or the reserved {@link #RELEVANCE}
 * key, which orders by full-text relevance score (the Elasticsearch {@code _score} idiom).
 * Sort conditions are applied in the order they appear in {@link Query#getSortConditions()};
 * relevance score is the implicit final tie-breaker unless it is already listed explicitly.
 */
public class SortCondition {

    /**
     * Reserved sort field selecting relevance-score ordering, matching Elasticsearch's
     * {@code _score}. With {@link SortDirection#DESC} (the default) the most relevant load comes
     * first; {@link SortDirection#ASC} puts the least relevant first.
     */
    public static final String RELEVANCE = "_score";

    private String field;
    private SortDirection direction;

    public SortCondition() {
    }

    public SortCondition(String field, SortDirection direction) {
        this.field = field;
        this.direction = direction;
    }

    /** Convenience factory ordering by relevance, most relevant first. */
    public static SortCondition relevance() {
        return new SortCondition(RELEVANCE, SortDirection.DESC);
    }

    /** Convenience factory ordering by relevance in the given direction. */
    public static SortCondition relevance(SortDirection direction) {
        return new SortCondition(RELEVANCE, direction);
    }

    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public SortDirection getDirection() {
        return direction;
    }

    public void setDirection(SortDirection direction) {
        this.direction = direction;
    }
}
