package org.blueorange.happyrobot.search;

/**
 * A single-field condition whose matching behaviour is selected by {@link QueryTermType}
 * (phrase, phrase-prefix, fuzzy, regex or wildcard). Mirrors the search-sdk
 * {@code QueryTermCondition}.
 */
public class QueryTermCondition {

    private String field;
    private String query;
    private QueryTermType type;
    /** Applies to {@link QueryTermType#REGEX} and {@link QueryTermType#WILDCARD}; defaults to false. */
    private Boolean caseInsensitive;
    /** Relevance multiplier applied to this clause; defaults to 1.0 when null. */
    private Float boost;
    /** Max edit distance for {@link QueryTermType#FUZZY} matches; defaults to Lucene's auto value. */
    private Integer maxEdits;

    public QueryTermCondition() {
    }

    public QueryTermCondition(String field, String query, QueryTermType type) {
        this.field = field;
        this.query = query;
        this.type = type;
    }

    /** Convenience factory for a {@code field:value} match of the given {@link QueryTermType}. */
    public static QueryTermCondition of(String field, String query, QueryTermType type) {
        return new QueryTermCondition(field, query, type);
    }

    public String getField() {
        return field;
    }

    public void setField(String field) {
        this.field = field;
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public QueryTermType getType() {
        return type;
    }

    public void setType(QueryTermType type) {
        this.type = type;
    }

    public Boolean getCaseInsensitive() {
        return caseInsensitive;
    }

    public void setCaseInsensitive(Boolean caseInsensitive) {
        this.caseInsensitive = caseInsensitive;
    }

    public Float getBoost() {
        return boost;
    }

    public void setBoost(Float boost) {
        this.boost = boost;
    }

    public Integer getMaxEdits() {
        return maxEdits;
    }

    public void setMaxEdits(Integer maxEdits) {
        this.maxEdits = maxEdits;
    }
}
