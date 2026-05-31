package org.blueorange.happyrobot.services;

import org.blueorange.happyrobot.entities.InboundCall;
import org.blueorange.happyrobot.entities.Load;
import org.blueorange.happyrobot.entities.metrics.ChartData;
import org.blueorange.happyrobot.entities.metrics.MetricsSummary;
import org.blueorange.happyrobot.entities.metrics.ScatterPoint;
import org.blueorange.happyrobot.entities.metrics.SuggestionsResponse;
import org.blueorange.happyrobot.entities.metrics.TimeRange;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Verifies {@link MetricsService} computes the dashboard metrics from a handcrafted call history,
 * with load weights resolved through a mocked {@link LoadSearchService}. Two calls book (with loads
 * L1/L2) and two fail, across two consecutive days.
 */
class MetricsServiceTest {

    private static final LocalDate DAY_1 = LocalDate.of(2026, 5, 20);
    private static final LocalDate DAY_2 = LocalDate.of(2026, 5, 21);

    private CallService callService;
    private LoadSearchService loadSearchService;
    private MetricsService metricsService;

    @BeforeEach
    void setUp() {
        callService = mock(CallService.class);
        loadSearchService = mock(LoadSearchService.class);
        metricsService = new MetricsService(callService, loadSearchService);

        // call1: booked, sentiment +, 120s, Dallas, load L1 (500 lbs), $1000 on day 1
        InboundCall call1 = call(at(DAY_1, 9, 0), at(DAY_1, 9, 2), true, true, 1000.0, "L1", "Dallas, TX");
        // call2: failed, sentiment -, Dallas, load L2 (1000 lbs) on day 1
        InboundCall call2 = call(at(DAY_1, 10, 0), null, false, false, null, "L2", "Dallas, TX");
        // call3: booked, sentiment +, 60s, Austin, load L1 (500 lbs), $2000 on day 2
        InboundCall call3 = call(at(DAY_2, 11, 0), at(DAY_2, 11, 1), true, true, 2000.0, "L1", "Austin, TX");
        // call4: failed, sentiment null, no location, no load on day 2
        InboundCall call4 = call(at(DAY_2, 12, 0), null, null, false, null, null, null);

        when(callService.findAllCalls()).thenReturn(List.of(call1, call2, call3, call4));
        when(loadSearchService.findById(eq("L1"))).thenReturn(Optional.of(load("L1", 500.0)));
        when(loadSearchService.findById(eq("L2"))).thenReturn(Optional.of(load("L2", 1000.0)));
    }

    @Test
    void summaryComputesScalarKpis() {
        MetricsSummary s = metricsService.summary(TimeRange.all());
        assertEquals(4, s.getTotalCalls());
        assertEquals(2, s.getCompletedBookings());
        assertEquals(2, s.getFailedBookings());
        // sentiments present: +,-,+ -> (1+0+1)/3 = 0.67
        assertEquals(0.67, s.getAverageSentiment());
        // booked load weights: 500, 500 -> 500
        assertEquals(500.0, s.getAverageBookingWeight());
        // booked amounts: 1000, 2000 -> 1500
        assertEquals(1500.0, s.getAverageCost());
        assertEquals(3000.0, s.getTotalEarnings());
        // durations: 120s, 60s -> 90
        assertEquals(90.0, s.getAverageCallDurationSeconds());
    }

    @Test
    void bookingTimelineHasCompletedAndFailedSeries() {
        ChartData data = metricsService.bookingTimeline(TimeRange.all());
        assertEquals(List.of("2026-05-20", "2026-05-21"), data.getLabels());
        assertEquals(2, data.getDataset().size());

        assertEquals("Completed Bookings", data.getDataset().get(0).getLabel());
        assertEquals(List.of(1L, 1L), data.getDataset().get(0).getData());
        assertEquals("Failed Bookings", data.getDataset().get(1).getLabel());
        assertEquals(List.of(1L, 1L), data.getDataset().get(1).getData());
    }

    @Test
    void earningsTimelineSumsBookedAmountPerDay() {
        ChartData data = metricsService.earningsTimeline(TimeRange.all());
        assertEquals(List.of("2026-05-20", "2026-05-21"), data.getLabels());
        assertEquals(1, data.getDataset().size());
        assertEquals(List.of(1000.0, 2000.0), data.getDataset().get(0).getData());
    }

    @Test
    void suggestionsClusterByLocation() {
        SuggestionsResponse s = metricsService.suggestions(TimeRange.all());

        // Failed calls: Dallas (call2) and Unknown (call4) each have 1.
        List<String> failedLabels = s.getFailedCallsByLocation().getLabels();
        assertTrue(failedLabels.contains("Dallas, TX"));
        assertTrue(failedLabels.contains("Unknown"));

        // Weight by location: Dallas avg (500+1000)/2 = 750 is heaviest, Austin 500.
        ChartData weight = s.getWeightByLocation();
        assertEquals("Dallas, TX", weight.getLabels().get(0));
        assertEquals(750.0, weight.getDataset().get(0).getData().get(0));

        // Cluster scatter carries a point per weighted location.
        List<Object> points = s.getLocationClusters().getDataset().get(0).getData();
        assertEquals(2, points.size());
        assertTrue(points.stream().allMatch(p -> p instanceof ScatterPoint));

        assertTrue(s.getInsights().stream().anyMatch(i -> i.contains("Dallas, TX")));
    }

    @Test
    void emptyHistoryYieldsEmptyChartsAndNullAverages() {
        when(callService.findAllCalls()).thenReturn(List.of());

        MetricsSummary s = metricsService.summary(TimeRange.all());
        assertEquals(0, s.getTotalCalls());
        assertNull(s.getAverageSentiment());
        assertNull(s.getAverageCost());
        assertNull(s.getTotalEarnings());

        assertTrue(metricsService.bookingTimeline(TimeRange.all()).getLabels().isEmpty());
        assertTrue(metricsService.earningsTimeline(TimeRange.all()).getLabels().isEmpty());
    }

    @Test
    void timeRangeScopesCallsToWindow() {
        // A window covering only day 1 keeps the two day-1 calls (1 booked, 1 failed).
        TimeRange day1 = new TimeRange(
                at(DAY_1, 0, 0).toInstant(), at(DAY_1, 23, 59).toInstant());

        MetricsSummary s = metricsService.summary(day1);
        assertEquals(2, s.getTotalCalls());
        assertEquals(1, s.getCompletedBookings());
        assertEquals(1, s.getFailedBookings());
        assertEquals(1000.0, s.getTotalEarnings()); // only call1 ($1000) booked on day 1

        // Bounded sub-day window buckets by hour, not day: call1 (09:00) and call2 (10:00).
        ChartData timeline = metricsService.bookingTimeline(day1);
        assertTrue(timeline.getLabels().get(0).contains(":"), "bounded window should use intra-day buckets");
        assertTrue(timeline.getLabels().contains("2026-05-20 09:00"));
        assertTrue(timeline.getLabels().contains("2026-05-20 10:00"));
    }

    @Test
    void customRangeExcludesCallsWithNoStartedTimestamp() {
        // call4 has a started time but call with null started would be dropped by a bounded range;
        // here we assert a narrow window around day 2 keeps exactly the two day-2 calls.
        TimeRange day2 = new TimeRange(
                at(DAY_2, 0, 0).toInstant(), at(DAY_2, 23, 59).toInstant());
        assertEquals(2, metricsService.summary(day2).getTotalCalls());
    }

    // --- helpers --------------------------------------------------------------

    private static InboundCall call(Date started, Date ended, Boolean sentiment, boolean booked,
                                    Double amount, String loadId, String location) {
        return new InboundCall(started, ended, sentiment, "carrier", location, "Reefer",
                booked, amount, loadId, 0);
    }

    private static Load load(String id, Double weight) {
        Load load = new Load();
        load.setLoadId(id);
        load.setWeight(weight);
        return load;
    }

    private static Date at(LocalDate date, int hour, int minute) {
        return Date.from(date.atTime(LocalTime.of(hour, minute)).atZone(ZoneId.systemDefault()).toInstant());
    }
}
