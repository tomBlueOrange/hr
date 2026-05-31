package org.blueorange.happyrobot.entities.search;

import java.util.Arrays;
import java.util.List;

/**
 * A free-text condition matched across one or more analysed fields, equivalent to the
 * search-sdk {@code QueryFullTextCondition}. The supplied {@link #query} is parsed with Lucene's
 * multi-field query parser, so it supports the usual {@code +}/{@code -}, quoting and boosting
 * syntax. When {@link #fields} is empty the service falls back to its default set of text fields.
 */
public class QueryFullTextCondition {

    private String query;
    private List<String> fields;
    /** Optional Lucene fuzziness, e.g. {@code "AUTO"}, {@code "1"} or {@code "2"}; {@code null} for exact. */
    private String fuzziness;

    public QueryFullTextCondition() {
    }

    public QueryFullTextCondition(String query, List<String> fields) {
        this.query = query;
        this.fields = fields;
    }

    /** Convenience factory: free text across an explicit list of fields. */
    public static QueryFullTextCondition of(String query, String... fields) {
        return new QueryFullTextCondition(query, Arrays.asList(fields));
    }

    public String getQuery() {
        return query;
    }

    public void setQuery(String query) {
        this.query = query;
    }

    public List<String> getFields() {
        return fields;
    }

    public void setFields(List<String> fields) {
        this.fields = fields;
    }

    public String getFuzziness() {
        return fuzziness;
    }

    public void setFuzziness(String fuzziness) {
        this.fuzziness = fuzziness;
    }
}
