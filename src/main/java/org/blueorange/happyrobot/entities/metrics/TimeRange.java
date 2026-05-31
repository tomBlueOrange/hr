package org.blueorange.happyrobot.entities.metrics;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

/**
 * A half-open-or-closed window of time used to scope the metrics endpoints to a slice of the call
 * history. Either bound may be {@code null} (open), and an entirely-open range ({@link #all()}) matches
 * everything &mdash; preserving the unscoped behaviour when no range is requested.
 *
 * <p>A range is resolved from request parameters by {@link #resolve(String, String, String, Instant)}:
 * <ul>
 *   <li>a {@code range} preset &mdash; one of {@code 30m, 1h, 6h, 12h, 1d, 7d, 30d, 1y} (a rolling
 *       window ending "now"), or {@code all};</li>
 *   <li>or a custom {@code from}/{@code to} pair, each an ISO-8601 instant
 *       ({@code 2026-05-01T00:00:00Z}), a {@code yyyy-MM-dd} date, or epoch milliseconds.</li>
 * </ul>
 * The {@code range} preset takes precedence over {@code from}/{@code to} if both are supplied.
 */
public class TimeRange {

    /** Rolling-window presets, in the order they are offered to clients. */
    private static final Map<String, Duration> PRESETS = new LinkedHashMap<>();

    static {
        PRESETS.put("30m", Duration.ofMinutes(30));
        PRESETS.put("1h", Duration.ofHours(1));
        PRESETS.put("6h", Duration.ofHours(6));
        PRESETS.put("12h", Duration.ofHours(12));
        PRESETS.put("1d", Duration.ofDays(1));
        PRESETS.put("7d", Duration.ofDays(7));
        PRESETS.put("30d", Duration.ofDays(30));
        PRESETS.put("1y", Duration.ofDays(365));
    }

    private final Instant from;
    private final Instant to;

    public TimeRange(Instant from, Instant to) {
        this.from = from;
        this.to = to;
    }

    /** An unbounded range that includes every call (the default when no scope is requested). */
    public static TimeRange all() {
        return new TimeRange(null, null);
    }

    /**
     * Resolves a range from request parameters. {@code now} is supplied (rather than read from the
     * clock here) so the resolution is deterministic and testable.
     *
     * @throws IllegalArgumentException if a preset is unknown, a timestamp is unparseable, or {@code from} is after {@code to}
     */
    public static TimeRange resolve(String range, String from, String to, Instant now) {
        if (range != null && !range.isBlank()) {
            String key = range.trim().toLowerCase(Locale.ROOT);
            if (key.equals("all")) {
                return all();
            }
            Duration window = PRESETS.get(key);
            if (window == null) {
                throw new IllegalArgumentException("Unknown range '" + range + "'. Valid presets: "
                        + String.join(", ", PRESETS.keySet()) + ", all; or supply a custom from/to.");
            }
            return new TimeRange(now.minus(window), now);
        }

        Instant fromInstant = parseInstant(from, false);
        Instant toInstant = parseInstant(to, true);
        if (fromInstant == null && toInstant == null) {
            return all();
        }
        if (toInstant == null) {
            toInstant = now;
        }
        if (fromInstant != null && fromInstant.isAfter(toInstant)) {
            throw new IllegalArgumentException("'from' (" + from + ") must not be after 'to' (" + to + ").");
        }
        return new TimeRange(fromInstant, toInstant);
    }

    /** @return whether either bound is set; an unbounded range matches everything. */
    public boolean isBounded() {
        return from != null || to != null;
    }

    /**
     * @return whether {@code started} falls within this range. An unbounded range includes everything
     * (even a {@code null} timestamp); a bounded range excludes calls with no {@code started} time,
     * since they cannot be placed on the timeline.
     */
    public boolean includes(Date started) {
        if (!isBounded()) {
            return true;
        }
        if (started == null) {
            return false;
        }
        Instant t = started.toInstant();
        if (from != null && t.isBefore(from)) {
            return false;
        }
        return to == null || !t.isAfter(to);
    }

    public Instant getFrom() {
        return from;
    }

    public Instant getTo() {
        return to;
    }

    /**
     * Parses a timestamp parameter as epoch millis, an ISO-8601 instant, or a {@code yyyy-MM-dd} date.
     * A bare date resolves to the start of that day in the system zone, or (for the {@code to} bound)
     * the start of the following day so the named day is included.
     */
    private static Instant parseInstant(String value, boolean exclusiveEndForDate) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String s = value.trim();
        try {
            if (s.matches("-?\\d+")) {
                return Instant.ofEpochMilli(Long.parseLong(s));
            }
            if (s.matches("\\d{4}-\\d{2}-\\d{2}")) {
                LocalDate date = LocalDate.parse(s);
                LocalDate effective = exclusiveEndForDate ? date.plusDays(1) : date;
                return effective.atStartOfDay(ZoneId.systemDefault()).toInstant();
            }
            return Instant.parse(s);
        } catch (DateTimeParseException | NumberFormatException e) {
            throw new IllegalArgumentException("Invalid timestamp '" + value
                    + "'. Use ISO-8601 (2026-05-01T00:00:00Z), a yyyy-MM-dd date, or epoch milliseconds.");
        }
    }
}
