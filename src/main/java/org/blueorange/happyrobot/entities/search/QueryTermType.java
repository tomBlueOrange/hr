package org.blueorange.happyrobot.entities.search;

/**
 * The matching strategy used by a {@link QueryTermCondition} against a single field.
 */
public enum QueryTermType {
    /** Match the analysed terms as an exact, in-order phrase. */
    PHRASE,
    /** Like {@link #PHRASE} but the final term is treated as a prefix. */
    PHRASE_PREFIX,
    /** Edit-distance ("fuzzy") matching of a single term. */
    FUZZY,
    /** Match the field value against a regular expression. */
    REGEX,
    /** Wildcard matching using {@code *} (any run) and {@code ?} (single char). */
    WILDCARD
}
