package org.blueorange.happyrobot.search;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

/**
 * Marker interface for anything that can appear in the query tree, equivalent to the search-sdk
 * {@code QueryComponent}. The tree has exactly two node kinds:
 *
 * <ul>
 *   <li>{@link QueryCompositeCondition} &mdash; an internal node combining children with AND/OR/NOT.</li>
 *   <li>{@link QueryCondition} &mdash; a leaf wrapping one concrete condition
 *       (full-text, term, numeric or date).</li>
 * </ul>
 *
 * <p>Polymorphic JSON is handled by Jackson <em>deduction</em>: a composite is recognised by its
 * {@code operand}/{@code components} fields and a leaf by its condition fields, so no explicit
 * {@code "type"} discriminator is needed in the request body.
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.DEDUCTION)
@JsonSubTypes({
        @JsonSubTypes.Type(QueryCompositeCondition.class),
        @JsonSubTypes.Type(QueryCondition.class)
})
public interface QueryComponent {
}
