import React, {useMemo, useState} from "react";

import {Table, TableTheme} from "../components/table/table/Table";
import {THead} from "../components/table/thead/THead";
import {TBody} from "../components/table/tbody/TBody";
import {Row} from "../components/table/row/Row";
import {HeaderCell} from "../components/table/cells/headercell/HeaderCell";
import {PrimaryCell} from "../components/table/cells/primarycell/PrimaryCell";
import {TextDataCell} from "../components/table/cells/text-data-cell/TextDataCell";
import {CurrencyDataCell} from "../components/table/cells/currency-data-cell/CurrencyDataCell";
import {NumberDataCell} from "../components/table/cells/number-data-cell/NumberDataCell";
import {DateDataCell} from "../components/table/cells/date-data-cell/DateDataCell";
import {LoadingCell} from "../components/table/cells/loading-cell/LoadingCell";
import {CellAlignment} from "../components/interfaces/AppInterfaces";
import {ButtonIcon} from "../components/buttons/button-icon/ButtonIcon";

import {useApi} from "../hooks/useApi";
import {InboundCall, Negotiation, listCalls, listNegotiations} from "../api/calls";
import {CallDetailDrawer} from "./CallDetailDrawer";

// The Calls page: every recorded inbound call in an object table, newest first.
// Clicking a row opens a right-hand drawer with the full call detail and the
// negotiation back-and-forth. Fetches the call + negotiation lists (the server
// returns them unsorted) and joins them client-side.

const COLUMNS = [
    "Carrier",
    "Started",
    "Ended",
    "Equipment",
    "Load",
    "Sentiment",
    "Booked",
    "Amount",
    "Rounds",
];

// Newest first, by call start time. Unparseable/missing dates sink to the bottom.
const startedMs = (c: InboundCall): number => {
    if (c.started == null) return -Infinity;
    const t = new Date(c.started).getTime();
    return Number.isNaN(t) ? -Infinity : t;
};

export const CallsView: React.FC = () => {
    const calls = useApi<InboundCall[]>(() => listCalls(), []);
    const negotiations = useApi<Negotiation[]>(() => listNegotiations(), []);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const loading = calls.loading || negotiations.loading;
    const error = calls.error || negotiations.error;

    const sortedCalls = useMemo(
        () => [...(calls.data ?? [])].sort((a, b) => startedMs(b) - startedMs(a)),
        [calls.data]
    );

    // Negotiations grouped onto their call, newest round first within each call.
    // The entities carry no timestamp, so "newest" falls back to reverse list order.
    const negotiationsByCall = useMemo(() => {
        const map = new Map<string, Negotiation[]>();
        for (const n of negotiations.data ?? []) {
            if (!n.inBoundCallId) continue;
            const list = map.get(n.inBoundCallId);
            if (list) list.push(n);
            else map.set(n.inBoundCallId, [n]);
        }
        map.forEach((list) => list.reverse());
        return map;
    }, [negotiations.data]);

    const selectedCall = selectedId ? sortedCalls.find((c) => c.id === selectedId) ?? null : null;

    // Re-fetch both lists. useApi exposes a reload() that bumps an internal nonce.
    const refresh = () => {
        calls.reload();
        negotiations.reload();
    };

    return (
        <div className="hr-search">
            <section className="hr-card">
                <div className="hr-card-head">
                    <h2 className="hr-card-title">Calls</h2>
                    <ButtonIcon
                        icon="ri-refresh-line"
                        label="Refresh calls"
                        isDisabled={loading}
                        onClick={refresh}
                    />
                </div>
                <p className="hr-card-hint">
                    Every recorded inbound call, newest first. Click a row to see the full call detail
                    and the negotiation back-and-forth.
                </p>

                {error ? (
                    <div className="hr-error">{error}</div>
                ) : (
                    <div className="hr-table-frame hr-calls-table">
                        <Table theme={TableTheme.OBJECT_LIST}>
                            <THead>
                                <tr>
                                    {COLUMNS.map((c) => (
                                        <HeaderCell key={c}>
                                            <div className="hr-object-table-header">{c}</div>
                                        </HeaderCell>
                                    ))}
                                </tr>
                            </THead>
                            <TBody>
                                {loading
                                    ? Array.from({length: 10}).map((_, r) => (
                                          <Row key={`skeleton-${r}`} hoverEffect={false}>
                                              {COLUMNS.map((c) => (
                                                  <LoadingCell key={c} />
                                              ))}
                                          </Row>
                                      ))
                                    : sortedCalls.map((call) => (
                                          <Row
                                              key={call.id}
                                              id={call.id}
                                              onClick={(id) => setSelectedId(id)}
                                          >
                                              <PrimaryCell
                                                  text={call.carrierId || "—"}
                                                  secondaryText={call.carrierLocation || ""}
                                                  style={{cursor: "pointer"}}
                                              />
                                              <DateDataCell
                                                  date={call.started}
                                                  dateformat="HH:mm DD MMM YYYY"
                                                  alignment={CellAlignment.LEFT}
                                              />
                                              <DateDataCell
                                                  date={call.ended}
                                                  dateformat="HH:mm DD MMM YYYY"
                                                  alignment={CellAlignment.LEFT}
                                              />
                                              <TextDataCell
                                                  text={call.carrierEquipment || "—"}
                                                  alignment={CellAlignment.LEFT}
                                              />
                                              <TextDataCell
                                                  text={call.loadId || "—"}
                                                  alignment={CellAlignment.LEFT}
                                              />
                                              <TextDataCell
                                                  text={
                                                      call.sentiment == null
                                                          ? "—"
                                                          : call.sentiment
                                                          ? "Positive"
                                                          : "Negative"
                                                  }
                                                  alignment={CellAlignment.LEFT}
                                              />
                                              <TextDataCell
                                                  text={
                                                      call.booked == null
                                                          ? "—"
                                                          : call.booked
                                                          ? "Yes"
                                                          : "No"
                                                  }
                                                  alignment={CellAlignment.LEFT}
                                              />
                                              <CurrencyDataCell
                                                  amount={call.amount ?? 0}
                                                  currency="USD"
                                                  alignment={CellAlignment.LEFT}
                                              />
                                              <NumberDataCell
                                                  value={call.backAndForths ?? 0}
                                                  alignment={CellAlignment.LEFT}
                                              />
                                          </Row>
                                      ))}
                                {!loading && sortedCalls.length === 0 && (
                                    <Row hoverEffect={false}>
                                        <TextDataCell
                                            text="No calls recorded yet."
                                            alignment={CellAlignment.LEFT}
                                            tdProps={{colSpan: COLUMNS.length}}
                                        />
                                    </Row>
                                )}
                            </TBody>
                        </Table>
                    </div>
                )}

                <div className="hr-result-bar hr-result-bar-bottom">
                    <span>
                        {error
                            ? "—"
                            : loading
                            ? "Loading…"
                            : `${sortedCalls.length.toLocaleString()} call${
                                  sortedCalls.length === 1 ? "" : "s"
                              }`}
                    </span>
                </div>
            </section>

            {selectedCall && (
                <CallDetailDrawer
                    call={selectedCall}
                    negotiations={negotiationsByCall.get(selectedCall.id) ?? []}
                    onClose={() => setSelectedId(null)}
                />
            )}
        </div>
    );
};

export default CallsView;
