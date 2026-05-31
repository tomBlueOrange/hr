package org.blueorange.happyrobot.entities.search;

import com.fasterxml.jackson.annotation.JsonInclude;
import org.blueorange.happyrobot.entities.Load;

import java.util.ArrayList;
import java.util.List;

/**
 * The envelope returned for a {@link Query}, mirroring the search-sdk {@code QueryResponse} but
 * with strongly-typed {@link Load} results rather than raw maps. Carries the matched page of
 * loads, the total match {@link #count} across all pages, the echoed pagination, the wall-clock
 * {@link #searchDuration} in millis, and an {@link #error} message when {@link #state} is
 * {@link ResponseState#ERROR}.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public class QueryResponse {

    private ResponseState state;
    private String error;
    private long count;
    private int page;
    private int size;
    private long searchDuration;
    private List<Load> results = new ArrayList<>();

    public QueryResponse() {
    }

    public static QueryResponse success(List<Load> results, long count, int page, int size, long searchDuration) {
        QueryResponse r = new QueryResponse();
        r.state = ResponseState.SUCCESS;
        r.results = results;
        r.count = count;
        r.page = page;
        r.size = size;
        r.searchDuration = searchDuration;
        return r;
    }

    public static QueryResponse error(String message, int page, int size, long searchDuration) {
        QueryResponse r = new QueryResponse();
        r.state = ResponseState.ERROR;
        r.error = message;
        r.page = page;
        r.size = size;
        r.searchDuration = searchDuration;
        return r;
    }

    public ResponseState getState() {
        return state;
    }

    public void setState(ResponseState state) {
        this.state = state;
    }

    public String getError() {
        return error;
    }

    public void setError(String error) {
        this.error = error;
    }

    public long getCount() {
        return count;
    }

    public void setCount(long count) {
        this.count = count;
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

    public long getSearchDuration() {
        return searchDuration;
    }

    public void setSearchDuration(long searchDuration) {
        this.searchDuration = searchDuration;
    }

    public List<Load> getResults() {
        return results;
    }

    public void setResults(List<Load> results) {
        this.results = results;
    }
}
