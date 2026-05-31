import React, {useState} from "react";

import {LoadSearchView} from "./LoadSearchView";
import {createCall, createNegotiation, findLoads, validateCarrier} from "../api/testers";

// The API Test page. The load-search section (POST /loads/search) is reused
// unchanged from LoadSearchView; the cards below let you hit the other server
// endpoints — GET /loads/find, GET /carriers/validate, POST /calls and
// POST /negotiations — and inspect the raw JSON they return.

// --- request state shared by every tester --------------------------------
type RunState = {
    sent: boolean;
    loading: boolean;
    response: unknown;
    error: string | null;
};

const IDLE: RunState = {sent: false, loading: false, response: null, error: null};

// Runs a request and tracks loading/response/error. Errors thrown by the api
// client (non-2xx responses carry the status + body) are caught and shown.
function useRequest(): {state: RunState; run: (fn: () => Promise<unknown>) => void} {
    const [state, setState] = useState<RunState>(IDLE);

    const run = (fn: () => Promise<unknown>) => {
        setState({sent: true, loading: true, response: null, error: null});
        fn()
            .then((response) => setState({sent: true, loading: false, response, error: null}))
            .catch((e: unknown) =>
                setState({
                    sent: true,
                    loading: false,
                    response: null,
                    error: e instanceof Error ? e.message : String(e),
                })
            );
    };

    return {state, run};
}

// Renders the loading / error / JSON result of a request.
const ResponsePanel: React.FC<{state: RunState}> = ({state}) => {
    if (!state.sent) {
        return null;
    }
    return (
        <div className="hr-api-response">
            <div className="hr-api-response-label">Response</div>
            {state.loading ? (
                <div className="hr-api-pending">Sending…</div>
            ) : state.error ? (
                <div className="hr-error">{state.error}</div>
            ) : (
                <pre className="hr-json-output">{JSON.stringify(state.response, null, 2)}</pre>
            )}
        </div>
    );
};

// Small coloured GET/POST chip + path, shown under each card title.
const EndpointTag: React.FC<{method: "GET" | "POST"; path: string}> = ({method, path}) => (
    <p className="hr-card-hint">
        <span className={`hr-api-method hr-api-method-${method.toLowerCase()}`}>{method}</span>
        <code>{path}</code>
    </p>
);

// --- GET /loads/find ------------------------------------------------------
const FIND_FIELDS: {key: string; label: string; placeholder: string}[] = [
    {key: "origin", label: "Origin", placeholder: "Chicago"},
    {key: "destination", label: "Destination", placeholder: "Dallas"},
    {key: "equipmentType", label: "Equipment", placeholder: "Dry Van"},
    {key: "commodity", label: "Commodity", placeholder: "Electronics"},
    {key: "referenceNumber", label: "Reference #", placeholder: "LD-100003"},
    {key: "minRate", label: "Min rate", placeholder: "1000"},
    {key: "maxRate", label: "Max rate", placeholder: "5000"},
    {key: "minWeight", label: "Min weight", placeholder: "0"},
    {key: "maxWeight", label: "Max weight", placeholder: "40000"},
    {key: "maxMiles", label: "Max miles", placeholder: "1500"},
    {key: "page", label: "Page", placeholder: "0"},
    {key: "size", label: "Size", placeholder: "3"},
    {key: "sortBy", label: "Sort by", placeholder: "loadboardRate"},
    {key: "sortDir", label: "Sort dir", placeholder: "DESC"},
];

const FindLoadsTester: React.FC = () => {
    const [criteria, setCriteria] = useState<Record<string, string>>({});
    const {state, run} = useRequest();

    const setField = (key: string, value: string) =>
        setCriteria((prev) => ({...prev, [key]: value}));

    return (
        <section className="hr-card">
            <h2 className="hr-card-title">Find loads</h2>
            <EndpointTag method="GET" path="/loads/find" />
            <p className="hr-card-hint">
                The flattened, query-string search. Fill in any subset — empty fields are omitted, so
                no filters returns the first page of all loads.
            </p>
            <div className="hr-api-fields">
                {FIND_FIELDS.map((f) => (
                    <div className="hr-api-field" key={f.key}>
                        <label htmlFor={`find-${f.key}`}>{f.label}</label>
                        <input
                            id={`find-${f.key}`}
                            className="hr-api-input"
                            placeholder={f.placeholder}
                            value={criteria[f.key] ?? ""}
                            onChange={(e) => setField(f.key, e.target.value)}
                        />
                    </div>
                ))}
            </div>
            <div className="hr-api-toolbar">
                <button
                    className="hr-send-btn"
                    disabled={state.loading}
                    onClick={() => run(() => findLoads(criteria))}
                >
                    <i className="ri-send-plane-line" /> Send request
                </button>
            </div>
            <ResponsePanel state={state} />
        </section>
    );
};

// --- GET /carriers/validate ----------------------------------------------
const ValidateCarrierTester: React.FC = () => {
    const [mcNumber, setMcNumber] = useState("");
    const {state, run} = useRequest();
    const canSend = mcNumber.trim() !== "" && !state.loading;

    return (
        <section className="hr-card">
            <h2 className="hr-card-title">Validate carrier</h2>
            <EndpointTag method="GET" path="/carriers/validate" />
            <p className="hr-card-hint">
                Checks an MC/docket number against FMCSA. Accepts any common format, e.g.
                {" "}<code>MC-44110</code> or <code>44110</code>.
            </p>
            <div className="hr-api-fields">
                <div className="hr-api-field">
                    <label htmlFor="validate-mc">MC number</label>
                    <input
                        id="validate-mc"
                        className="hr-api-input"
                        placeholder="MC-44110"
                        value={mcNumber}
                        onChange={(e) => setMcNumber(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && canSend) {
                                run(() => validateCarrier(mcNumber));
                            }
                        }}
                    />
                </div>
            </div>
            <div className="hr-api-toolbar">
                <button
                    className="hr-send-btn"
                    disabled={!canSend}
                    onClick={() => run(() => validateCarrier(mcNumber))}
                >
                    <i className="ri-send-plane-line" /> Send request
                </button>
            </div>
            <ResponsePanel state={state} />
        </section>
    );
};

// --- POST with a JSON body (calls + negotiations) -------------------------
const JsonPostTester: React.FC<{
    title: string;
    path: string;
    hint: React.ReactNode;
    example: unknown;
    send: (body: unknown) => Promise<unknown>;
}> = ({title, path, hint, example, send}) => {
    const [text, setText] = useState(() => JSON.stringify(example, null, 2));
    const {state, run} = useRequest();

    // Live JSON validation: re-parsed every render (cheap for a small body) so
    // the badge and the Send button always reflect the current text.
    const jsonError = (() => {
        try {
            JSON.parse(text);
            return null;
        } catch (e) {
            return e instanceof Error ? e.message : "Invalid JSON";
        }
    })();
    const valid = jsonError === null;

    const onSend = () => {
        if (!valid) {
            return;
        }
        run(() => send(JSON.parse(text)));
    };

    const onFormat = () => {
        if (valid) {
            setText(JSON.stringify(JSON.parse(text), null, 2));
        }
    };

    return (
        <section className="hr-card">
            <h2 className="hr-card-title">{title}</h2>
            <EndpointTag method="POST" path={path} />
            <p className="hr-card-hint">{hint}</p>
            <textarea
                className="hr-api-textarea"
                spellCheck={false}
                value={text}
                onChange={(e) => setText(e.target.value)}
            />
            <div className="hr-api-toolbar">
                <button className="hr-send-btn" disabled={!valid || state.loading} onClick={onSend}>
                    <i className="ri-send-plane-line" /> Send request
                </button>
                <button className="hr-ghost-btn" disabled={!valid} onClick={onFormat}>
                    Format JSON
                </button>
                <span className={`hr-json-badge ${valid ? "hr-json-badge-valid" : "hr-json-badge-invalid"}`}>
                    {valid ? "Valid JSON" : "Invalid JSON"}
                </span>
                {!valid && <span className="hr-json-error">{jsonError}</span>}
            </div>
            <ResponsePanel state={state} />
        </section>
    );
};

// Example bodies that match the server entities, so a tester can just hit Send.
const EXAMPLE_CALL = {
    started: "2026-05-31T15:00:00.000Z",
    ended: "2026-05-31T15:08:00.000Z",
    sentiment: true,
    carrierId: "MC-44110",
    carrierLocation: "Chicago, IL",
    carrierEquipment: "Dry Van",
    booked: true,
    amount: 2400.0,
    loadId: "LD-100003",
    backAndForths: 2,
};

const EXAMPLE_NEGOTIATION = {
    inBoundCallId: "paste-a-call-id-here",
    proposedOffer: 2200.0,
    accepted: true,
    counter: 2400.0,
    acceptedAmount: 2400.0,
};

export const ApiTestView: React.FC = () => {
    return (
        <div className="hr-search">
            <LoadSearchView />

            <FindLoadsTester />

            <ValidateCarrierTester />

            <JsonPostTester
                title="Create call"
                path="/calls"
                example={EXAMPLE_CALL}
                send={createCall}
                hint={
                    <>
                        Records an inbound call. The server generates the <code>id</code> and returns
                        the saved record with <code>201 Created</code>.
                    </>
                }
            />

            <JsonPostTester
                title="Create negotiation"
                path="/negotiations"
                example={EXAMPLE_NEGOTIATION}
                send={createNegotiation}
                hint={
                    <>
                        Records a negotiation round attached to a call. Set <code>inBoundCallId</code>
                        {" "}to an id returned by <code>POST /calls</code> above.
                    </>
                }
            />
        </div>
    );
};

export default ApiTestView;
