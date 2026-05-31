import React, {useState} from "react";

import {PageHeading} from "../components/text-decorations/page-heading/PageHeading";
import {RangeSelector} from "./RangeSelector";
import {MetricCard, MetricLabelPosition} from "../components/metrics/metric-card/MetricCard";
import {LineChart} from "../components/charts/line/LineChart";
import {BarChart} from "../components/charts/bar/BarChart";
import {LegendPosition} from "../components/charts/types/ChartTypes";
import {Skeleton} from "../components/loading/skeleton/Skeleton";
import {ButtonIcon} from "../components/buttons/button-icon/ButtonIcon";

import {ChartCard} from "./ChartCard";
import {useApi} from "../hooks/useApi";
import {MetricsRange} from "../api/types";
import {getBookingsTimeline, getEarningsTimeline, getSummary} from "../api/metrics";
import {fmtCurrency, fmtDuration, fmtInt, fmtPercent, fmtSentiment, fmtWeight} from "./format";

export const OverviewView: React.FC = () => {
    const [range, setRange] = useState<MetricsRange>("all");

    const summary = useApi(() => getSummary(range), [range]);
    const bookings = useApi(() => getBookingsTimeline(range), [range]);
    const earnings = useApi(() => getEarningsTimeline(range), [range]);

    const loading = summary.loading || bookings.loading || earnings.loading;

    // Re-fetch every metric on this page (summary KPIs + both timelines).
    const refresh = () => {
        summary.reload();
        bookings.reload();
        earnings.reload();
    };

    const s = summary.data;
    const bookingRate =
        s && s.completedBookings + s.failedBookings > 0
            ? s.completedBookings / (s.completedBookings + s.failedBookings)
            : null;

    const kpis: {icon: string; label: string; value: string}[] = s
        ? [
              {icon: "ri-phone-line", label: "Total Calls", value: fmtInt(s.totalCalls)},
              {icon: "ri-checkbox-circle-line", label: "Completed Bookings", value: fmtInt(s.completedBookings)},
              {icon: "ri-close-circle-line", label: "Failed Bookings", value: fmtInt(s.failedBookings)},
              // {icon: "ri-percent-line", label: "Booking Rate", value: fmtPercent(bookingRate)},
              {icon: "ri-emotion-line", label: "Avg Sentiment", value: fmtSentiment(s.averageSentiment)},
              // {icon: "ri-money-dollar-circle-line", label: "Avg Cost", value: fmtCurrency(s.averageCost)},
              {icon: "ri-wallet-3-line", label: "Total Earnings", value: fmtCurrency(s.totalEarnings)},
              {icon: "ri-time-line", label: "Avg Call Duration", value: fmtDuration(s.averageCallDurationSeconds)},
              // {icon: "ri-scales-3-line", label: "Avg Booking Weight", value: fmtWeight(s.averageBookingWeight)},
          ]
        : [];

    return (
        <div className="hr-overview">
            {/* Page heading with inline range selector */}
            <div className="hr-overview-head">
                <PageHeading>Overview</PageHeading>
                <RangeSelector value={range} onChange={setRange} />
                <ButtonIcon
                    icon="ri-refresh-line"
                    label="Refresh"
                    isDisabled={loading}
                    onClick={refresh}
                />
            </div>

            {/* KPI row */}
            <section className="hr-kpis">
                {summary.error ? (
                    <div className="hr-error">{summary.error}</div>
                ) : summary.loading ? (
                    Array.from({length: 9}).map((_, i) => (
                        <Skeleton key={i} style={{height: 92, borderRadius: 10}} />
                    ))
                ) : (
                    kpis.map((k) => (
                        <MetricCard
                            key={k.label}
                            icon={k.icon}
                            label={k.label}
                            text={k.value}
                            labelPosition={MetricLabelPosition.BOTTOM}
                        />
                    ))
                )}
            </section>

            {/* Timelines */}
            <ChartCard title="Bookings over time" loading={bookings.loading} error={bookings.error}>
                {bookings.data && (
                    <LineChart
                        dataset={bookings.data.dataset}
                        labels={bookings.data.labels}
                        height="100%"
                        legend
                        legendPosition={LegendPosition.BOTTOM}
                    />
                )}
            </ChartCard>

            <ChartCard title="Earnings over time" loading={earnings.loading} error={earnings.error}>
                {earnings.data && (
                    <BarChart
                        dataset={earnings.data.dataset}
                        labels={earnings.data.labels}
                        height="100%"
                        legend
                        legendPosition={LegendPosition.BOTTOM}
                    />
                )}
            </ChartCard>
        </div>
    );
};

export default OverviewView;
