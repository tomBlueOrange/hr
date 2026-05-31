package org.blueorange.happyrobot.entities.fmcsa;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

/**
 * Envelope for the multi-carrier endpoints (lookup by docket number, search by name), where
 * {@code content} is an array of {@link CarrierResult}, or {@code null} when nothing matches.
 *
 * <pre>{@code {"content": [{"carrier": {...}}, ...], "retrievalDate": "..."}}</pre>
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class FmcsaCarrierListResponse {

    private List<CarrierResult> content;
    private String retrievalDate;

    public List<CarrierResult> getContent() {
        return content;
    }

    public void setContent(List<CarrierResult> content) {
        this.content = content;
    }

    public String getRetrievalDate() {
        return retrievalDate;
    }

    public void setRetrievalDate(String retrievalDate) {
        this.retrievalDate = retrievalDate;
    }
}
