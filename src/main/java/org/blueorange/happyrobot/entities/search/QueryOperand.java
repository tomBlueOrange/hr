package org.blueorange.happyrobot.entities.search;

/**
 * Boolean operator applied across the children of a {@link QueryCompositeCondition}.
 *
 * <ul>
 *   <li>{@link #AND} &mdash; every child must match (Lucene {@code MUST}).</li>
 *   <li>{@link #OR} &mdash; at least {@code minimumShouldMatch} children must match (Lucene {@code SHOULD}).</li>
 *   <li>{@link #NOT} &mdash; no child may match (Lucene {@code MUST_NOT} over a match-all base).</li>
 * </ul>
 */
public enum QueryOperand {
    AND,
    OR,
    NOT
}
