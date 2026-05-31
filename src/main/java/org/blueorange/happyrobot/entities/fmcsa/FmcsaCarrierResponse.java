package org.blueorange.happyrobot.entities.fmcsa;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Envelope for the single-carrier endpoints (e.g. lookup by USDOT number), where {@code content}
 * is a single {@link CarrierResult} object, or {@code null} when no carrier matches.
 *
 * <pre>{@code {"content": {"carrier": {...}, "_links": {...}}, "retrievalDate": "..."}}</pre>
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class FmcsaCarrierResponse {

    private CarrierResult content;
    private String retrievalDate;

    public CarrierResult getContent() {
        return content;
    }

    public void setContent(CarrierResult content) {
        this.content = content;
    }

    public String getRetrievalDate() {
        return retrievalDate;
    }

    public void setRetrievalDate(String retrievalDate) {
        this.retrievalDate = retrievalDate;
    }
}
