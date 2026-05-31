// TypeScript shapes for the HappyRobot API responses. Verified against live
// responses from the server on port 9876.

import {ChartDataset} from "../components/charts/types/ChartTypes";

// Rolling-window presets accepted by every metrics endpoint's `range` param.
export type MetricsRange =
    | "30m" | "1h" | "6h" | "12h" | "1d" | "7d" | "30d" | "1y" | "all";

// GET /metrics/summary
export interface MetricsSummary {
    totalCalls: number;
    completedBookings: number;
    failedBookings: number;
    averageSentiment: number | null;        // 0..1
    averageBookingWeight: number | null;    // lbs
    averageCost: number | null;             // dollars
    totalEarnings: number;                  // dollars
    averageCallDurationSeconds: number | null;
}

// Chart.js-shaped payload returned by the timeline endpoints. The `dataset`
// items already match the local ChartDataset interface, so they pass straight
// into LineChart / BarChart.
export interface ChartData {
    labels?: string[];
    dataset: ChartDataset[];
}

// GET /metrics/suggestions
export interface SuggestionsResponse {
    failedCallsByLocation: ChartData;
    weightByLocation: ChartData;
    locationClusters: ChartData; // dataset[].data is [{x, y, label}]
    insights: string[];
}

// A single load row returned by the search endpoints.
export interface Load {
    loadId: string;
    startingLocation: string;
    deliveryLocation: string;
    pickupDateTime: string;
    deliveryDateTime: string;
    equipmentType: string;
    loadboardRate: number;
    notes: string;
    weight: number;
    commodityType: string[];
    numOfPieces: number;
    miles: number;
    dimensions?: { height: number; width: number; length: number };
}

// POST /loads/search
export interface LoadSearchResponse {
    state: string;
    count: number;
    page: number;
    size: number;
    searchDuration: number;
    results: Load[];
}
