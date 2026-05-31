package org.blueorange.happyrobot.entities.metrics;

import org.junit.jupiter.api.Test;

import java.time.Duration;
import java.time.Instant;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Verifies {@link TimeRange} parsing of preset windows and custom from/to bounds, and the
 * {@link TimeRange#includes(Date)} membership test.
 */
class TimeRangeTest {

    private static final Instant NOW = Instant.parse("2026-05-31T12:00:00Z");

    @Test
    void presetResolvesToRollingWindowEndingNow() {
        TimeRange range = TimeRange.resolve("6h", null, null, NOW);
        assertEquals(NOW, range.getTo());
        assertEquals(NOW.minus(Duration.ofHours(6)), range.getFrom());
    }

    @Test
    void allPresetIsUnbounded() {
        assertFalse(TimeRange.resolve("all", null, null, NOW).isBounded());
    }

    @Test
    void noParametersIsUnbounded() {
        assertFalse(TimeRange.resolve(null, null, null, NOW).isBounded());
    }

    @Test
    void unknownPresetIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> TimeRange.resolve("99x", null, null, NOW));
    }

    @Test
    void customIsoBoundsAreParsed() {
        TimeRange range = TimeRange.resolve(null, "2026-05-01T00:00:00Z", "2026-05-02T00:00:00Z", NOW);
        assertEquals(Instant.parse("2026-05-01T00:00:00Z"), range.getFrom());
        assertEquals(Instant.parse("2026-05-02T00:00:00Z"), range.getTo());
    }

    @Test
    void epochMillisBoundsAreParsed() {
        long fromMs = Instant.parse("2026-05-01T00:00:00Z").toEpochMilli();
        TimeRange range = TimeRange.resolve(null, String.valueOf(fromMs), null, NOW);
        assertEquals(Instant.ofEpochMilli(fromMs), range.getFrom());
        assertEquals(NOW, range.getTo()); // open end defaults to now
    }

    @Test
    void fromAfterToIsRejected() {
        assertThrows(IllegalArgumentException.class,
                () -> TimeRange.resolve(null, "2026-05-02T00:00:00Z", "2026-05-01T00:00:00Z", NOW));
    }

    @Test
    void invalidTimestampIsRejected() {
        assertThrows(IllegalArgumentException.class, () -> TimeRange.resolve(null, "not-a-date", null, NOW));
    }

    @Test
    void includesRespectsBoundsAndExcludesNullWhenBounded() {
        TimeRange range = TimeRange.resolve("1h", null, null, NOW);
        assertTrue(range.includes(Date.from(NOW.minus(Duration.ofMinutes(30)))));
        assertFalse(range.includes(Date.from(NOW.minus(Duration.ofHours(2)))));
        assertFalse(range.includes(null)); // no timestamp cannot be placed in a bounded window

        assertTrue(TimeRange.all().includes(null)); // unbounded includes everything
    }
}
