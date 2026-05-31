import React from "react";

import "./Demos.css";
import "./components/metrics/metrics-theme.css";

import {Metric} from "./components/metrics/metric/Metric";
import {MetricCard, MetricLabelPosition} from "./components/metrics/metric-card/MetricCard";
import {MetricWithAction} from "./components/metrics/metric-with-action/MetricWithAction";
import {MetricWithCopy} from "./components/metrics/metric-with-copy/MetricWithCopy";
import {SimpleMetric} from "./components/metrics/simple-metric/SimpleMetric";

export const MetricsDemo: React.FC = () => {
    return (
        <div className="demo-page">
            <h1 className="demo-title">Metrics</h1>
            <p className="demo-subtitle">
                Metric, MetricCard, MetricWithAction, MetricWithCopy and SimpleMetric
                copied from @blue-orange-ai/foundations-core.
            </p>

            <section className="demo-card">
                <h2>Metric Cards</h2>
                <p className="demo-card-hint">
                    Icon + value + label. Label can sit above or below the value; the whole
                    card is clickable.
                </p>
                <div className="demo-grid">
                    <MetricCard
                        icon="ri-money-dollar-circle-line"
                        label="Revenue (MTD)"
                        text="$48,250"
                        onClick={() => console.log("Revenue card clicked")}
                    />
                    <MetricCard
                        icon="ri-user-add-line"
                        label="New Users"
                        text="1,204"
                    />
                    <MetricCard
                        icon="ri-pulse-line"
                        label="Uptime"
                        text="99.98%"
                        labelPosition={MetricLabelPosition.BOTTOM}
                    />
                </div>
            </section>

            <section className="demo-card">
                <h2>Metric</h2>
                <p className="demo-card-hint">A plain labelled value.</p>
                <div className="demo-grid">
                    <Metric label="Open Tickets" text="37" />
                    <Metric label="Avg. Response" text="2h 14m" />
                </div>
            </section>

            <section className="demo-card">
                <h2>Metric With Action</h2>
                <p className="demo-card-hint">
                    A value paired with an icon button (logs to console on click).
                </p>
                <div className="demo-grid">
                    <MetricWithAction
                        label="API Endpoint"
                        text="https://api.example.com/v1"
                        icon="ri-external-link-line"
                        onClick={() => console.log("Action clicked")}
                    />
                    <MetricWithAction
                        label="Refresh Token"
                        text="rt_8f3a…c21d"
                        icon="ri-refresh-line"
                        onClick={() => console.log("Refresh clicked")}
                    />
                </div>
            </section>

            <section className="demo-card">
                <h2>Metric With Copy</h2>
                <p className="demo-card-hint">
                    Click the copy button to write the value to the clipboard (the button
                    flashes green for 2s).
                </p>
                <div className="demo-grid">
                    <MetricWithCopy label="Account ID" text="acct_1234567890" />
                    <MetricWithCopy label="Public Key" text="pk_live_51HxYz…" />
                </div>
            </section>

            <section className="demo-card">
                <h2>Simple Metric</h2>
                <p className="demo-card-hint">Compact clickable badges.</p>
                <div className="demo-row">
                    {["A1", "B2", "C3", "D4", "E5"].map((t) => (
                        <SimpleMetric key={t} text={t} onClick={() => console.log("SimpleMetric", t)} />
                    ))}
                </div>
            </section>
        </div>
    );
};

export default MetricsDemo;
