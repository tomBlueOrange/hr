package org.blueorange.happyrobot.search;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * A leaf of the query tree that wraps exactly one concrete condition, mirroring the search-sdk
 * {@code QueryCondition}. Exactly one of the condition fields should be set; if more than one is
 * populated the translator uses the first non-null in declaration order. This wrapper keeps the
 * JSON shape flat and non-polymorphic, so each condition kind serialises under its own key.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QueryCondition implements QueryComponent {

    private QueryFullTextCondition fullText;
    private QueryTermCondition term;
    private QueryNumericCondition numeric;
    private QueryDateCondition date;

    public QueryCondition() {
    }

    // --- Convenience factories for programmatic query building ----------------

    public static QueryCondition fullText(QueryFullTextCondition condition) {
        QueryCondition c = new QueryCondition();
        c.fullText = condition;
        return c;
    }

    public static QueryCondition term(QueryTermCondition condition) {
        QueryCondition c = new QueryCondition();
        c.term = condition;
        return c;
    }

    public static QueryCondition numeric(QueryNumericCondition condition) {
        QueryCondition c = new QueryCondition();
        c.numeric = condition;
        return c;
    }

    public static QueryCondition date(QueryDateCondition condition) {
        QueryCondition c = new QueryCondition();
        c.date = condition;
        return c;
    }

    public QueryFullTextCondition getFullText() {
        return fullText;
    }

    public void setFullText(QueryFullTextCondition fullText) {
        this.fullText = fullText;
    }

    public QueryTermCondition getTerm() {
        return term;
    }

    public void setTerm(QueryTermCondition term) {
        this.term = term;
    }

    public QueryNumericCondition getNumeric() {
        return numeric;
    }

    public void setNumeric(QueryNumericCondition numeric) {
        this.numeric = numeric;
    }

    public QueryDateCondition getDate() {
        return date;
    }

    public void setDate(QueryDateCondition date) {
        this.date = date;
    }
}
