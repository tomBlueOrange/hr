import React, {useState} from "react";

import {PageHeading} from "../components/text-decorations/page-heading/PageHeading";
import {RangeSelector} from "./RangeSelector";
import {BarChart} from "../components/charts/bar/BarChart";
import {ScatterChart} from "../components/charts/scatter/ScatterChart";
import {LegendPosition} from "../components/charts/types/ChartTypes";
import {Skeleton} from "../components/loading/skeleton/Skeleton";

import {ChartCard} from "./ChartCard";
import {useApi} from "../hooks/useApi";
import {MetricsRange} from "../api/types";
import {getSuggestions} from "../api/metrics";

export const InsightsView: React.FC = () => {
    const [range, setRange] = useState<MetricsRange>("all");

    const suggestions = useApi(() => getSuggestions(range), [range]);

    return (
        <div className="hr-overview">
            {/* Page heading with inline range selector */}
            <div className="hr-overview-head">
                <PageHeading>Insights</PageHeading>
                <RangeSelector value={range} onChange={setRange} />
            </div>

            {/* Insights summary at the top */}
            <section className="hr-card">
                <h2 className="hr-card-title">Insights</h2>
                {suggestions.error ? (
                    <div className="hr-error">{suggestions.error}</div>
                ) : suggestions.loading ? (
                    <Skeleton style={{height: 120, width: "100%", borderRadius: 8}} />
                ) : suggestions.data && suggestions.data.insights.length > 0 ? (
                    <ul className="hr-insights">
                        {suggestions.data.insights.map((text, i) => (
                            <li key={i}>
                                <i className="ri-lightbulb-flash-line" />
                                <span>{text}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="hr-card-hint">No insights available for this range.</div>
                )}
            </section>

            {/* Location breakdowns */}
            <ChartCard
                title="Failed calls by location"
                loading={suggestions.loading}
                error={suggestions.error}
            >
                {suggestions.data && (
                    <BarChart
                        dataset={suggestions.data.failedCallsByLocation.dataset}
                        labels={suggestions.data.failedCallsByLocation.labels}
                        height="100%"
                        legend
                        legendPosition={LegendPosition.BOTTOM}
                    />
                )}
            </ChartCard>

            <ChartCard
                title="Average load weight by location"
                loading={suggestions.loading}
                error={suggestions.error}
            >
                {suggestions.data && (
                    <BarChart
                        dataset={suggestions.data.weightByLocation.dataset}
                        labels={suggestions.data.weightByLocation.labels}
                        height="100%"
                        legend
                        legendPosition={LegendPosition.BOTTOM}
                    />
                )}
            </ChartCard>

            <ChartCard
                title="Location clusters — weight vs. failed calls"
                loading={suggestions.loading}
                error={suggestions.error}
            >
                {suggestions.data && (
                    <ScatterChart
                        dataset={suggestions.data.locationClusters.dataset}
                        height="100%"
                        xLabel="Avg weight (lbs)"
                        yLabel="Failed calls"
                        legend
                        legendPosition={LegendPosition.BOTTOM}
                    />
                )}
            </ChartCard>
        </div>
    );
};

export default InsightsView;
