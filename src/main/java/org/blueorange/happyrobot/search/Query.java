package org.blueorange.happyrobot.search;

import java.util.ArrayList;
import java.util.List;

/**
 * The root of a granular load search request, mirroring the search-sdk {@code Query}. A query is a
 * tree of {@link QueryComponent}s (the {@link #rootCondition}) plus pagination, sorting and a
 * couple of matching knobs. There is a single in-memory index here, so unlike the SDK there is no
 * {@code index} field.
 *
 * <p>Defaults: page {@code 0}, size {@code 10}, {@code minimumShouldMatch} {@code 1}. A
 * {@code null} {@link #rootCondition} matches all loads (subject to pagination/sorting).
 */
public class Query {

    private QueryComponent rootCondition;
    private List<SortCondition> sortConditions = new ArrayList<>();

    private int page = 0;
    private int size = 10;

    /** Minimum number of {@code SHOULD} clauses that must match in an OR composite. Defaults to 1. */
    private int minimumShouldMatch = 1;

    public Query() {
    }

    public Query(QueryComponent rootCondition) {
        this.rootCondition = rootCondition;
    }

    public QueryComponent getRootCondition() {
        return rootCondition;
    }

    public void setRootCondition(QueryComponent rootCondition) {
        this.rootCondition = rootCondition;
    }

    public List<SortCondition> getSortConditions() {
        return sortConditions;
    }

    public void setSortConditions(List<SortCondition> sortConditions) {
        this.sortConditions = sortConditions == null ? new ArrayList<>() : sortConditions;
    }

    /** Appends a sort condition and returns {@code this} for chaining. */
    public Query addSortCondition(SortCondition condition) {
        this.sortConditions.add(condition);
        return this;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public int getMinimumShouldMatch() {
        return minimumShouldMatch;
    }

    public void setMinimumShouldMatch(int minimumShouldMatch) {
        this.minimumShouldMatch = minimumShouldMatch;
    }
}
