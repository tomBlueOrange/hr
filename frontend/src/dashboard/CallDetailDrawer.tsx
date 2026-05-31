import React, {useEffect} from "react";

import {Drawer, DrawerPosition} from "../components/layouts/drawer/drawer/Drawer";
import {DrawerHeader} from "../components/layouts/drawer/drawer-header/DrawerHeader";
import {DrawerDescription} from "../components/layouts/drawer/drawer-description/DrawerDescription";
import {DrawerBody} from "../components/layouts/drawer/drawer-body/DrawerBody";

import {InboundCall, Negotiation} from "../api/calls";
import {fmtCurrency} from "./format";

// Right-hand slide-in drawer showing every field of a single call plus the
// negotiation back-and-forth attached to it. Built on the shared layouts/drawer
// kit (Drawer + DrawerHeader/Body) — backdrop-close and slide-in come from there;
// this file only supplies the call-specific content (field grids + timeline) and
// adds Escape-to-close on top.

const fmtDateTime = (value: string | number | null): string => {
    if (value == null) return "—";
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString();
};

const fmtBool = (value: boolean | null, yes: string, no: string): string =>
    value == null ? "—" : value ? yes : no;

// Call duration in m s, when both timestamps are present and sane.
const fmtCallDuration = (started: string | number | null, ended: string | number | null): string => {
    if (started == null || ended == null) return "—";
    const a = new Date(started).getTime();
    const b = new Date(ended).getTime();
    if (Number.isNaN(a) || Number.isNaN(b) || b < a) return "—";
    const s = Math.round((b - a) / 1000);
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return m > 0 ? `${m}m ${rem}s` : `${rem}s`;
};

const Field: React.FC<{label: string; children: React.ReactNode}> = ({label, children}) => (
    <div className="hr-drawer-field">
        <span className="hr-drawer-field-label">{label}</span>
        <span className="hr-drawer-field-value">{children}</span>
    </div>
);

export const CallDetailDrawer: React.FC<{
    call: InboundCall;
    negotiations: Negotiation[];
    onClose: () => void;
}> = ({call, negotiations, onClose}) => {
    // Escape-to-close (the shared Drawer only closes on backdrop click).
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    const sentimentClass =
        call.sentiment == null ? "" : call.sentiment ? "hr-pill-good" : "hr-pill-bad";
    const bookedClass = call.booked == null ? "" : call.booked ? "hr-pill-good" : "hr-pill-bad";

    return (
        <Drawer position={DrawerPosition.RIGHT} width="460px" onClose={onClose}>
            <DrawerHeader label={call.carrierId || "Unknown carrier"} onClose={onClose} />
            <DrawerDescription description={call.carrierLocation || "—"} />
            <DrawerBody>
                <section className="hr-drawer-section">
                    <h3 className="hr-drawer-section-title">Call</h3>
                    <div className="hr-drawer-grid">
                        <Field label="Started">{fmtDateTime(call.started)}</Field>
                        <Field label="Ended">{fmtDateTime(call.ended)}</Field>
                        <Field label="Duration">{fmtCallDuration(call.started, call.ended)}</Field>
                        <Field label="Sentiment">
                            <span className={`hr-pill ${sentimentClass}`}>
                                {fmtBool(call.sentiment, "Positive", "Negative")}
                            </span>
                        </Field>
                        <Field label="Booked">
                            <span className={`hr-pill ${bookedClass}`}>
                                {fmtBool(call.booked, "Booked", "Not booked")}
                            </span>
                        </Field>
                        <Field label="Final amount">{fmtCurrency(call.amount)}</Field>
                        <Field label="Back-and-forths">{call.backAndForths ?? "—"}</Field>
                    </div>
                </section>

                <section className="hr-drawer-section">
                    <h3 className="hr-drawer-section-title">Carrier &amp; load</h3>
                    <div className="hr-drawer-grid">
                        <Field label="Carrier (MC)">{call.carrierId || "—"}</Field>
                        <Field label="Location">{call.carrierLocation || "—"}</Field>
                        <Field label="Equipment">{call.carrierEquipment || "—"}</Field>
                        <Field label="Load">{call.loadId || "—"}</Field>
                        <Field label="Call ID">
                            <code className="hr-drawer-id">{call.id}</code>
                        </Field>
                    </div>
                </section>

                <section className="hr-drawer-section">
                    <h3 className="hr-drawer-section-title">
                        Negotiations
                        <span className="hr-drawer-count">{negotiations.length}</span>
                    </h3>
                    {negotiations.length === 0 ? (
                        <p className="hr-drawer-empty">No negotiation rounds recorded for this call.</p>
                    ) : (
                        <ol className="hr-nego-timeline">
                            {negotiations.map((n, i) => (
                                <li key={n.id} className="hr-nego-round">
                                    <div className="hr-nego-round-head">
                                        <span className="hr-nego-round-num">
                                            Round {negotiations.length - i}
                                        </span>
                                        <span
                                            className={`hr-pill ${
                                                n.accepted == null
                                                    ? ""
                                                    : n.accepted
                                                    ? "hr-pill-good"
                                                    : "hr-pill-bad"
                                            }`}
                                        >
                                            {fmtBool(n.accepted, "Accepted", "Countered")}
                                        </span>
                                    </div>
                                    <div className="hr-nego-round-grid">
                                        <Field label="Carrier offer">{fmtCurrency(n.proposedOffer)}</Field>
                                        <Field label="Our counter">{fmtCurrency(n.counter)}</Field>
                                        {n.accepted ? (
                                            <Field label="Accepted at">
                                                {fmtCurrency(n.acceptedAmount)}
                                            </Field>
                                        ) : null}
                                    </div>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>
            </DrawerBody>
        </Drawer>
    );
};

export default CallDetailDrawer;
