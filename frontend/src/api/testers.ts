// Accessors used by the API Test page to exercise the server's controller
// endpoints directly and surface their raw responses. These are deliberately
// untyped (Promise<unknown>) — the page renders whatever JSON comes back.
//
// Endpoints referenced (see src/main/java/.../controllers):
//   GET  /loads/find         HappyRobotApi#findLoads
//   GET  /carriers/validate  HappyRobotApi#validateCarrier
//   POST /calls              CallController#createCall
//   POST /negotiations       CallController#createNegotiation

import {apiGet, apiPost} from "./client";

// Build a `?a=1&b=2` string from a record, dropping blank values so only the
// criteria the user actually filled in are sent.
function queryString(params: Record<string, string>): string {
    const usp = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value.trim() !== "") {
            usp.append(key, value.trim());
        }
    }
    const qs = usp.toString();
    return qs ? `?${qs}` : "";
}

// GET /loads/find — flattened criteria search (HappyRobotApi#findLoads).
export function findLoads(criteria: Record<string, string>): Promise<unknown> {
    return apiGet<unknown>(`/loads/find${queryString(criteria)}`);
}

// GET /carriers/validate — FMCSA carrier eligibility (HappyRobotApi#validateCarrier).
export function validateCarrier(mcNumber: string): Promise<unknown> {
    return apiGet<unknown>(`/carriers/validate${queryString({mcNumber})}`);
}

// POST /calls — record an inbound call (CallController#createCall).
export function createCall(body: unknown): Promise<unknown> {
    return apiPost<unknown>("/calls", body);
}

// POST /negotiations — record a negotiation round (CallController#createNegotiation).
export function createNegotiation(body: unknown): Promise<unknown> {
    return apiPost<unknown>("/negotiations", body);
}
