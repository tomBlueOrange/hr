package org.blueorange.happyrobot.services;

import com.blueorange.commons.config.OrangeLogger;
import org.blueorange.happyrobot.entities.InboundCall;
import org.blueorange.happyrobot.entities.Load;
import org.blueorange.happyrobot.entities.metrics.ChartData;
import org.blueorange.happyrobot.entities.metrics.ChartDataset;
import org.blueorange.happyrobot.entities.metrics.MetricsSummary;
import org.blueorange.happyrobot.entities.metrics.ScatterPoint;
import org.blueorange.happyrobot.entities.metrics.SuggestionsResponse;
import org.blueorange.happyrobot.entities.metrics.TimeRange;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Builds the dashboard metrics for the inbound carrier-sales use case from the persisted call history.
 *
 * <p>Every endpoint is scoped by a {@link TimeRange}: calls are filtered by their {@code started}
 * timestamp, so the dashboard can show "the last 30 minutes" or an arbitrary custom window.
 * {@link TimeRange#all()} reproduces the unscoped behaviour.
 *
 * <p>The chart-shaped results ({@link ChartData}) are serialised to match the front-end chart component
 * library, so a response can be handed straight to a {@code LineChart}, {@code BarChart} or
 * {@code ScatterChart}. Time-series buckets adapt to the window width &mdash; minute buckets for short
 * windows up through monthly buckets for a year &mdash; while an unscoped request keeps the original
 * day buckets.
 *
 * <p>Load weight is not stored on a call, so it is resolved on demand from {@link LoadSearchService} by
 * the call's {@code loadId} (cached per request). When a load cannot be resolved its weight is simply
 * omitted from the averages.
 */
@Service
public class MetricsService {

    private static final OrangeLogger logger = new OrangeLogger(MetricsService.class);

    private static final ZoneId ZONE = ZoneId.systemDefault();
    private static final int TOP_LOCATIONS = 10;

    // Chart palette.
    private static final String GREEN = "#22c55e";
    private static final String RED = "#ef4444";
    private static final String BLUE = "#3b82f6";
    private static final String AMBER = "#f59e0b";
    private static final String VIOLET = "#8b5cf6";

    private final CallService callService;
    private final LoadSearchService loadSearchService;

    @Autowired
    public MetricsService(CallService callService, LoadSearchService loadSearchService) {
        this.callService = callService;
        this.loadSearchService = loadSearchService;
    }

    // --- Scalar KPIs ----------------------------------------------------------

    /** Computes every scalar KPI in one pass over the calls within {@code range}. */
    public MetricsSummary summary(TimeRange range) {
        List<InboundCall> calls = callsWithin(range);
        Map<String, Double> weightCache = new HashMap<>();

        MetricsSummary summary = new MetricsSummary();
        summary.setTotalCalls(calls.size());

        long completed = 0;
        long failed = 0;
        double sentimentSum = 0;
        long sentimentCount = 0;
        double weightSum = 0;
        long weightCount = 0;
        double costSum = 0;
        long costCount = 0;
        double earnings = 0;
        double durationSum = 0;
        long durationCount = 0;

        for (InboundCall call : calls) {
            boolean booked = Boolean.TRUE.equals(call.getBooked());
            if (booked) {
                completed++;
            } else {
                failed++;
            }

            if (call.getSentiment() != null) {
                sentimentSum += call.getSentiment() ? 1 : 0;
                sentimentCount++;
            }

            if (booked) {
                Double weight = resolveWeight(call.getLoadId(), weightCache);
                if (weight != null) {
                    weightSum += weight;
                    weightCount++;
                }
                if (call.getAmount() != null) {
                    costSum += call.getAmount();
                    costCount++;
                    earnings += call.getAmount();
                }
            }

            Long duration = durationSeconds(call);
            if (duration != null) {
                durationSum += duration;
                durationCount++;
            }
        }

        summary.setCompletedBookings(completed);
        summary.setFailedBookings(failed);
        summary.setAverageSentiment(average(sentimentSum, sentimentCount));
        summary.setAverageBookingWeight(average(weightSum, weightCount));
        summary.setAverageCost(average(costSum, costCount));
        summary.setTotalEarnings(costCount > 0 ? round(earnings, 2) : null);
        summary.setAverageCallDurationSeconds(average(durationSum, durationCount));
        return summary;
    }

    // --- Time series ----------------------------------------------------------

    /**
     * Completed vs failed bookings over time within {@code range}, bucketed to suit the window. Returns
     * two line series ("Completed Bookings", "Failed Bookings") sharing a continuous, zero-filled time
     * axis so the lines stay unbroken. A "failed" booking is any call that started but did not end in a
     * booking.
     */
    public ChartData bookingTimeline(TimeRange range) {
        List<InboundCall> calls = timelineCalls(range);
        Axis axis = buildAxis(calls, range);
        if (axis == null) {
            return ChartData.of(new ArrayList<>(), new ArrayList<>());
        }

        long[] completed = new long[axis.size()];
        long[] failed = new long[axis.size()];
        for (InboundCall call : calls) {
            Integer pos = axis.indexOf(call.getStarted());
            if (pos == null) {
                continue;
            }
            if (Boolean.TRUE.equals(call.getBooked())) {
                completed[pos]++;
            } else {
                failed[pos]++;
            }
        }

        return ChartData.of(axis.labels, List.of(
                ChartDataset.line("Completed Bookings", boxed(completed), GREEN),
                ChartDataset.line("Failed Bookings", boxed(failed), RED)));
    }

    /**
     * Earnings (summed agreed amount of booked calls) over time within {@code range}, bucketed to suit
     * the window, as a single bar series. The axis spans the whole window, zero-filling empty buckets so
     * the bars are evenly spaced.
     */
    public ChartData earningsTimeline(TimeRange range) {
        List<InboundCall> calls = timelineCalls(range);
        Axis axis = buildAxis(calls, range);
        if (axis == null) {
            return ChartData.of(new ArrayList<>(), new ArrayList<>());
        }

        double[] earnings = new double[axis.size()];
        for (InboundCall call : calls) {
            if (!Boolean.TRUE.equals(call.getBooked()) || call.getAmount() == null) {
                continue;
            }
            Integer pos = axis.indexOf(call.getStarted());
            if (pos != null) {
                earnings[pos] += call.getAmount();
            }
        }

        List<Object> data = new ArrayList<>(earnings.length);
        for (double value : earnings) {
            data.add(round(value, 2));
        }
        return ChartData.of(axis.labels, List.of(ChartDataset.bar("Earnings", data, BLUE)));
    }

    // --- Suggestions ----------------------------------------------------------

    /**
     * Location-oriented suggestions over the calls within {@code range}: where bookings fail most, how
     * load weight varies by location, and a scatter clustering of the two. See {@link SuggestionsResponse}.
     */
    public SuggestionsResponse suggestions(TimeRange range) {
        List<InboundCall> calls = callsWithin(range);
        Map<String, Double> weightCache = new HashMap<>();

        Map<String, LocationAgg> byLocation = new HashMap<>();
        for (InboundCall call : calls) {
            LocationAgg agg = byLocation.computeIfAbsent(location(call), k -> new LocationAgg());
            if (!Boolean.TRUE.equals(call.getBooked())) {
                agg.failed++;
            }
            Double weight = resolveWeight(call.getLoadId(), weightCache);
            if (weight != null) {
                agg.weightSum += weight;
                agg.weightCount++;
            }
        }

        SuggestionsResponse response = new SuggestionsResponse();
        response.setFailedCallsByLocation(failedByLocationChart(byLocation));
        response.setWeightByLocation(weightByLocationChart(byLocation));
        response.setLocationClusters(locationClusterChart(byLocation));
        response.setInsights(buildInsights(byLocation));
        return response;
    }

    private ChartData failedByLocationChart(Map<String, LocationAgg> byLocation) {
        List<Map.Entry<String, LocationAgg>> top = byLocation.entrySet().stream()
                .filter(e -> e.getValue().failed > 0)
                .sorted(Comparator.comparingLong((Map.Entry<String, LocationAgg> e) -> e.getValue().failed).reversed())
                .limit(TOP_LOCATIONS)
                .toList();

        List<String> labels = new ArrayList<>();
        List<Object> data = new ArrayList<>();
        for (Map.Entry<String, LocationAgg> e : top) {
            labels.add(e.getKey());
            data.add(e.getValue().failed);
        }
        return ChartData.of(labels, List.of(ChartDataset.bar("Failed Calls", data, RED)));
    }

    private ChartData weightByLocationChart(Map<String, LocationAgg> byLocation) {
        List<Map.Entry<String, LocationAgg>> top = byLocation.entrySet().stream()
                .filter(e -> e.getValue().weightCount > 0)
                .sorted(Comparator.comparingDouble((Map.Entry<String, LocationAgg> e) -> e.getValue().avgWeight()).reversed())
                .limit(TOP_LOCATIONS)
                .toList();

        List<String> labels = new ArrayList<>();
        List<Object> data = new ArrayList<>();
        for (Map.Entry<String, LocationAgg> e : top) {
            labels.add(e.getKey());
            data.add(round(e.getValue().avgWeight(), 1));
        }
        return ChartData.of(labels, List.of(ChartDataset.bar("Avg Weight (lbs)", data, AMBER)));
    }

    private ChartData locationClusterChart(Map<String, LocationAgg> byLocation) {
        List<Object> points = new ArrayList<>();
        for (Map.Entry<String, LocationAgg> e : byLocation.entrySet()) {
            LocationAgg agg = e.getValue();
            if (agg.weightCount > 0) {
                points.add(new ScatterPoint(round(agg.avgWeight(), 1), agg.failed, e.getKey()));
            }
        }
        return ChartData.scatter(List.of(ChartDataset.scatter("Locations", points, VIOLET)));
    }

    private List<String> buildInsights(Map<String, LocationAgg> byLocation) {
        List<String> insights = new ArrayList<>();

        byLocation.entrySet().stream()
                .filter(e -> e.getValue().failed > 0)
                .max(Comparator.comparingLong(e -> e.getValue().failed))
                .ifPresent(e -> insights.add(String.format(
                        "%s has the most failed bookings (%d). Review pricing or load fit for that lane.",
                        e.getKey(), e.getValue().failed)));

        byLocation.entrySet().stream()
                .filter(e -> e.getValue().weightCount > 0)
                .max(Comparator.comparingDouble(e -> e.getValue().avgWeight()))
                .ifPresent(e -> insights.add(String.format(
                        "Loads from %s are the heaviest on average (%.0f lbs); make sure carriers there run the right equipment.",
                        e.getKey(), e.getValue().avgWeight())));

        byLocation.entrySet().stream()
                .filter(e -> e.getValue().weightCount > 0)
                .min(Comparator.comparingDouble(e -> e.getValue().avgWeight()))
                .ifPresent(e -> insights.add(String.format(
                        "Loads from %s are the lightest on average (%.0f lbs).",
                        e.getKey(), e.getValue().avgWeight())));

        if (insights.isEmpty()) {
            insights.add("Not enough call data yet to surface location-based suggestions.");
        }
        return insights;
    }

    // --- Filtering ------------------------------------------------------------

    /** All calls whose {@code started} time falls within {@code range}. */
    private List<InboundCall> callsWithin(TimeRange range) {
        List<InboundCall> result = new ArrayList<>();
        for (InboundCall call : callService.findAllCalls()) {
            if (range.includes(call.getStarted())) {
                result.add(call);
            }
        }
        return result;
    }

    /** Calls within {@code range} that have a {@code started} time, so they can be placed on a timeline. */
    private List<InboundCall> timelineCalls(TimeRange range) {
        List<InboundCall> result = new ArrayList<>();
        for (InboundCall call : callsWithin(range)) {
            if (call.getStarted() != null) {
                result.add(call);
            }
        }
        return result;
    }

    // --- Time bucketing -------------------------------------------------------

    /** A granularity for time-series buckets, with its label format and step. */
    private enum Bucket {
        MINUTE(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
        HOUR(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
        DAY(DateTimeFormatter.ofPattern("yyyy-MM-dd")),
        MONTH(DateTimeFormatter.ofPattern("yyyy-MM"));

        private final DateTimeFormatter formatter;

        Bucket(DateTimeFormatter formatter) {
            this.formatter = formatter;
        }

        private LocalDateTime truncate(LocalDateTime t) {
            return switch (this) {
                case MINUTE -> t.truncatedTo(ChronoUnit.MINUTES);
                case HOUR -> t.truncatedTo(ChronoUnit.HOURS);
                case DAY -> t.toLocalDate().atStartOfDay();
                case MONTH -> t.withDayOfMonth(1).toLocalDate().atStartOfDay();
            };
        }

        private LocalDateTime next(LocalDateTime t) {
            return switch (this) {
                case MINUTE -> t.plusMinutes(1);
                case HOUR -> t.plusHours(1);
                case DAY -> t.plusDays(1);
                case MONTH -> t.plusMonths(1);
            };
        }

        private String label(LocalDateTime t) {
            return t.format(formatter);
        }
    }

    /** Pre-built, zero-filled time axis: ordered bucket labels and a bucket-start &rarr; position index. */
    private static final class Axis {
        private final List<String> labels;
        private final Map<LocalDateTime, Integer> positionByBucket;
        private final Bucket bucket;

        private Axis(List<String> labels, Map<LocalDateTime, Integer> positionByBucket, Bucket bucket) {
            this.labels = labels;
            this.positionByBucket = positionByBucket;
            this.bucket = bucket;
        }

        private int size() {
            return labels.size();
        }

        /** @return the axis position for the bucket containing {@code started}, or {@code null} if off-axis. */
        private Integer indexOf(Date started) {
            if (started == null) {
                return null;
            }
            LocalDateTime t = LocalDateTime.ofInstant(started.toInstant(), ZONE);
            return positionByBucket.get(bucket.truncate(t));
        }
    }

    /**
     * Builds the time axis spanning {@code range} (or the span of the data when a bound is open). When
     * the range is unbounded the axis keeps day buckets (the original behaviour); when scoped, the
     * bucket granularity adapts to the window width. Returns {@code null} when there is no window to draw
     * (an open bound with no data to infer it from).
     */
    private Axis buildAxis(List<InboundCall> calls, TimeRange range) {
        LocalDateTime start = range.getFrom() != null ? toLocalDateTime(range.getFrom()) : minStarted(calls);
        LocalDateTime end = range.getTo() != null ? toLocalDateTime(range.getTo()) : maxStarted(calls);
        if (start == null || end == null) {
            return null;
        }
        if (end.isBefore(start)) {
            end = start;
        }

        Bucket bucket = range.isBounded() ? chooseBucket(Duration.between(start, end)) : Bucket.DAY;
        LocalDateTime cursor = bucket.truncate(start);
        LocalDateTime last = bucket.truncate(end);

        List<String> labels = new ArrayList<>();
        Map<LocalDateTime, Integer> index = new LinkedHashMap<>();
        int position = 0;
        while (!cursor.isAfter(last)) {
            index.put(cursor, position++);
            labels.add(bucket.label(cursor));
            cursor = bucket.next(cursor);
        }
        return new Axis(labels, index, bucket);
    }

    /** Chooses a bucket granularity so a window yields a readable number of points. */
    private static Bucket chooseBucket(Duration span) {
        long minutes = Math.max(0, span.toMinutes());
        if (minutes <= 120) {            // up to 2 hours -> per minute
            return Bucket.MINUTE;
        }
        if (minutes <= 2 * 24 * 60) {    // up to 2 days -> per hour
            return Bucket.HOUR;
        }
        if (minutes <= 90L * 24 * 60) {  // up to ~3 months -> per day
            return Bucket.DAY;
        }
        return Bucket.MONTH;             // longer -> per month
    }

    // --- Helpers --------------------------------------------------------------

    private Double resolveWeight(String loadId, Map<String, Double> cache) {
        if (loadId == null || loadId.isBlank()) {
            return null;
        }
        if (cache.containsKey(loadId)) {
            return cache.get(loadId);
        }
        Double weight = loadSearchService.findById(loadId).map(Load::getWeight).orElse(null);
        cache.put(loadId, weight);
        return weight;
    }

    private static Long durationSeconds(InboundCall call) {
        if (call.getStarted() == null || call.getEnded() == null) {
            return null;
        }
        long millis = call.getEnded().getTime() - call.getStarted().getTime();
        return millis < 0 ? null : millis / 1000;
    }

    private static String location(InboundCall call) {
        String loc = call.getCarrierLocation();
        return (loc == null || loc.isBlank()) ? "Unknown" : loc.trim();
    }

    private static LocalDateTime minStarted(List<InboundCall> calls) {
        LocalDateTime min = null;
        for (InboundCall call : calls) {
            LocalDateTime t = toLocalDateTime(call.getStarted());
            if (t != null && (min == null || t.isBefore(min))) {
                min = t;
            }
        }
        return min;
    }

    private static LocalDateTime maxStarted(List<InboundCall> calls) {
        LocalDateTime max = null;
        for (InboundCall call : calls) {
            LocalDateTime t = toLocalDateTime(call.getStarted());
            if (t != null && (max == null || t.isAfter(max))) {
                max = t;
            }
        }
        return max;
    }

    private static LocalDateTime toLocalDateTime(Date date) {
        return date == null ? null : LocalDateTime.ofInstant(date.toInstant(), ZONE);
    }

    private static LocalDateTime toLocalDateTime(Instant instant) {
        return instant == null ? null : LocalDateTime.ofInstant(instant, ZONE);
    }

    private static List<Object> boxed(long[] values) {
        List<Object> data = new ArrayList<>(values.length);
        for (long value : values) {
            data.add(value);
        }
        return data;
    }

    private static Double average(double sum, long count) {
        return count == 0 ? null : round(sum / count, 2);
    }

    private static double round(double value, int decimals) {
        double factor = Math.pow(10, decimals);
        return Math.round(value * factor) / factor;
    }

    /** Per-location running totals used to build the suggestion charts. */
    private static final class LocationAgg {
        private long failed;
        private double weightSum;
        private long weightCount;

        private double avgWeight() {
            return weightCount == 0 ? 0 : weightSum / weightCount;
        }
    }
}
