// Typed accessors for the /metrics endpoints.

import {apiGet} from "./client";
import {ChartData, MetricsRange, MetricsSummary, SuggestionsResponse} from "./types";

const rangeQuery = (range: MetricsRange) => `?range=${encodeURIComponent(range)}`;

export function getSummary(range: MetricsRange): Promise<MetricsSummary> {
    return apiGet<MetricsSummary>(`/metrics/summary${rangeQuery(range)}`);
}

export function getBookingsTimeline(range: MetricsRange): Promise<ChartData> {
    return apiGet<ChartData>(`/metrics/bookings/timeline${rangeQuery(range)}`);
}

export function getEarningsTimeline(range: MetricsRange): Promise<ChartData> {
    return apiGet<ChartData>(`/metrics/earnings/timeline${rangeQuery(range)}`);
}

export function getSuggestions(range: MetricsRange): Promise<SuggestionsResponse> {
    return apiGet<SuggestionsResponse>(`/metrics/suggestions${rangeQuery(range)}`);
}
