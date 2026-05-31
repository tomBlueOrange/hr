package org.blueorange.happyrobot.controllers;

import com.blueorange.commons.config.OrangeLogger;
import com.blueorange.commons.config.SafeLogParam;
import com.blueorange.passportsdk.annotation.Authentication;
import org.blueorange.happyrobot.entities.metrics.ChartData;
import org.blueorange.happyrobot.entities.metrics.MetricsSummary;
import org.blueorange.happyrobot.entities.metrics.SuggestionsResponse;
import org.blueorange.happyrobot.entities.metrics.TimeRange;
import org.blueorange.happyrobot.services.MetricsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Read-only dashboard endpoints for the inbound carrier-sales use case, all under
 * {@code /api/v1/metrics}. The chart endpoints return {@link ChartData} shaped for the front-end chart
 * component library (spread straight onto a {@code LineChart}/{@code BarChart}/{@code ScatterChart});
 * {@code /summary} returns the scalar KPIs. All endpoints require authentication.
 *
 * <p>Every endpoint can be scoped in time with either a {@code range} preset
 * ({@code 30m, 1h, 6h, 12h, 1d, 7d, 30d, 1y} &mdash; a rolling window ending now &mdash; or {@code all})
 * or a custom {@code from}/{@code to} pair (ISO-8601 instant, {@code yyyy-MM-dd} date, or epoch millis).
 * When no scope is supplied the full history is used. An invalid scope yields {@code 400}.
 */
@RestController
@CrossOrigin
@RequestMapping("/api/v1/metrics")
public class MetricsController {

    private static final OrangeLogger logger = new OrangeLogger(MetricsController.class);

    private final MetricsService metricsService;

    @Autowired
    public MetricsController(MetricsService metricsService) {
        this.metricsService = metricsService;
    }

    /** Scalar KPIs: totals, averages (sentiment, weight, cost, duration) and total earnings. */
    @Authentication()
    @GetMapping("/summary")
    public MetricsSummary summary(
            @RequestParam(required = false) String range,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        logger.info("Metrics summary request received (range {})", SafeLogParam.of(range));
        return metricsService.summary(resolveRange(range, from, to));
    }

    /** Completed vs failed bookings over time (two line series; buckets adapt to the window). */
    @Authentication()
    @GetMapping("/bookings/timeline")
    public ChartData bookingTimeline(
            @RequestParam(required = false) String range,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        logger.info("Booking timeline request received (range {})", SafeLogParam.of(range));
        return metricsService.bookingTimeline(resolveRange(range, from, to));
    }

    /** Earnings over time as a bar chart (buckets adapt to the window). */
    @Authentication()
    @GetMapping("/earnings/timeline")
    public ChartData earningsTimeline(
            @RequestParam(required = false) String range,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        logger.info("Earnings timeline request received (range {})", SafeLogParam.of(range));
        return metricsService.earningsTimeline(resolveRange(range, from, to));
    }

    /** Location-based suggestions: failed calls by location, weight by location, and a cluster scatter. */
    @Authentication()
    @GetMapping("/suggestions")
    public SuggestionsResponse suggestions(
            @RequestParam(required = false) String range,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {
        logger.info("Suggestions request received (range {})", SafeLogParam.of(range));
        return metricsService.suggestions(resolveRange(range, from, to));
    }

    /** Resolves the request's time scope against the current clock. */
    private TimeRange resolveRange(String range, String from, String to) {
        return TimeRange.resolve(range, from, to, Instant.now());
    }

    /** An unparseable range/from/to is a client error, not a server fault. */
    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleInvalidRange(IllegalArgumentException e) {
        return Map.of("error", e.getMessage());
    }
}
