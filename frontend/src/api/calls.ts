// Accessors + types for the inbound-call log shown on the Calls page.
//
// Endpoints referenced (see src/main/java/.../controllers/CallController.java):
//   GET /calls         -> List<InboundCall>
//   GET /negotiations  -> List<Negotiation>
//
// The server returns the full, unsorted lists; the Calls page sorts calls
// newest-first and groups negotiations onto their call via inBoundCallId.

import {apiGet} from "./client";

// Mirrors org.blueorange.happyrobot.entities.InboundCall. `started`/`ended`
// are Java Dates serialised as ISO strings (or epoch millis) — kept as the
// raw wire value and parsed at display time.
export interface InboundCall {
    id: string;
    started: string | number | null;
    ended: string | number | null;
    sentiment: boolean | null;
    carrierId: string | null;
    carrierLocation: string | null;
    carrierEquipment: string | null;
    booked: boolean | null;
    amount: number | null;
    loadId: string | null;
    backAndForths: number | null;
}

// Mirrors org.blueorange.happyrobot.entities.Negotiation. One row per round of
// the back-and-forth, linked to its call by inBoundCallId.
export interface Negotiation {
    id: string;
    inBoundCallId: string | null;
    proposedOffer: number | null;
    accepted: boolean | null;
    counter: number | null;
    acceptedAmount: number | null;
}

// GET /calls — every recorded inbound call.
export function listCalls(): Promise<InboundCall[]> {
    return apiGet<InboundCall[]>("/calls");
}

// GET /negotiations — every recorded negotiation round.
export function listNegotiations(): Promise<Negotiation[]> {
    return apiGet<Negotiation[]>("/negotiations");
}
