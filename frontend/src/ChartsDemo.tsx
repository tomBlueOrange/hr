import React from "react";
import "./ChartsDemo.css";
import {LineChart} from "./components/charts/line/LineChart";
import {LegendPosition} from "./components/charts/types/ChartTypes";
import {BarChart} from "./components/charts/bar/BarChart";
import {ScatterChart} from "./components/charts/scatter/ScatterChart";
import {ComboChart} from "./components/charts/combo/ComboChart";

// ---- Sample data -----------------------------------------------------------

// Line: two series of {x, y} points.
const lineData1 = Array.from({ length: 50 }, (_, i) => ({
    x: i,
    y: Number((Math.sin(i / 5) * 40 + 50 + Math.random() * 10).toFixed(2)),
}));
const lineData2 = Array.from({ length: 50 }, (_, i) => ({
    x: i,
    y: Number((Math.cos(i / 6) * 30 + 50 + Math.random() * 10).toFixed(2)),
}));

// Bar: categorical data with shared labels.
const barLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const barData1 = [42, 55, 48, 61, 58, 70];
const barData2 = [30, 38, 41, 35, 49, 52];

// Scatter: clustered {x, y} points.
const scatterData = Array.from({ length: 60 }, () => ({
    x: Number((Math.random() * 100).toFixed(2)),
    y: Number((Math.random() * 100).toFixed(2)),
}));

// Combo: a bar series, a line series and a scatter series sharing one axis.
const comboLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const ChartsDemo: React.FC = () => {
    return (
        <div className="charts-demo">
            <h1 className="charts-demo-title">Foundations Charts</h1>
            <p className="charts-demo-subtitle">
                LineChart, BarChart, ScatterChart and ComboChart copied from
                @blue-orange-ai/foundations-core.
            </p>

            <section className="chart-card">
                <h2>Line Chart</h2>
                <p className="chart-card-hint">
                    Hover for tooltips, click-drag to select an x-range (logs to console).
                </p>
                <div className="chart-frame">
                    <LineChart
                        height="100%"
                        width="100%"
                        gridLines
                        xLabel="Index"
                        yLabel="Value"
                        xScale="linear"
                        interactionType="nearest"
                        rangeSelect
                        legend
                        legendPosition={LegendPosition.BOTTOM}
                        onRangeSelected={(start, end) =>
                            console.log("Line range selected:", start, end)
                        }
                        dataset={[
                            {
                                label: "Series A",
                                backgroundColor: "#BB8FCE",
                                borderColor: "#BB8FCE",
                                borderWidth: 2,
                                data: lineData1,
                            },
                            {
                                label: "Series B",
                                backgroundColor: "#E59866",
                                borderColor: "#E59866",
                                borderWidth: 2,
                                data: lineData2,
                            },
                        ]}
                    />
                </div>
            </section>

            <section className="chart-card">
                <h2>Bar Chart</h2>
                <div className="chart-frame">
                    <BarChart
                        height="100%"
                        width="100%"
                        gridLines
                        xLabel="Month"
                        yLabel="Revenue"
                        labels={barLabels}
                        legend
                        legendPosition={LegendPosition.BOTTOM}
                        dataset={[
                            {
                                label: "2024",
                                backgroundColor: "#5DADE2",
                                borderColor: "#5DADE2",
                                borderRadius: 4,
                                data: barData1,
                            },
                            {
                                label: "2025",
                                backgroundColor: "#48C9B0",
                                borderColor: "#48C9B0",
                                borderRadius: 4,
                                data: barData2,
                            },
                        ]}
                    />
                </div>
            </section>

            <section className="chart-card">
                <h2>Scatter Chart</h2>
                <div className="chart-frame">
                    <ScatterChart
                        height="100%"
                        width="100%"
                        gridLines
                        xLabel="X"
                        yLabel="Y"
                        legend
                        legendPosition={LegendPosition.BOTTOM}
                        dataset={[
                            {
                                label: "Observations",
                                backgroundColor: "#EC7063",
                                borderColor: "#EC7063",
                                data: scatterData,
                            },
                        ]}
                    />
                </div>
            </section>

            <section className="chart-card">
                <h2>Combo Chart</h2>
                <p className="chart-card-hint">
                    Mixed bar + line + scatter on shared axes. Click a scatter point to pin it.
                </p>
                <div className="chart-frame">
                    <ComboChart
                        height="100%"
                        width="100%"
                        gridLines
                        xLabel="Day"
                        yLabel="Value"
                        xScale="category"
                        labels={comboLabels}
                        legend
                        legendPosition={LegendPosition.BOTTOM}
                        dataset={[
                            {
                                type: "bar",
                                label: "Volume",
                                backgroundColor: "#AAB7B8",
                                borderColor: "#AAB7B8",
                                borderRadius: 4,
                                data: [20, 35, 28, 45, 38, 30, 25],
                            },
                            {
                                type: "line",
                                label: "Trend",
                                backgroundColor: "#5499C7",
                                borderColor: "#5499C7",
                                borderWidth: 2,
                                data: [22, 30, 33, 40, 42, 36, 32],
                            },
                            {
                                type: "scatter",
                                label: "Outliers",
                                backgroundColor: "#F39C12",
                                borderColor: "#F39C12",
                                data: [
                                    { x: "Tue", y: 48 },
                                    { x: "Thu", y: 12 },
                                    { x: "Sat", y: 50 },
                                ],
                            },
                        ]}
                    />
                </div>
            </section>
        </div>
    );
};

export default ChartsDemo;
