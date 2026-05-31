package org.blueorange.happyrobot.seed;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * One row of the demo call dataset in {@code data/seed_calls.json}, loaded at startup by
 * {@link DataSeeder}. Timing is stored relative to "now" rather than as an absolute instant so the
 * seeded history always lands in the recent past: {@link #daysAgo} (1&ndash;60) selects the day,
 * {@link #hour}/{@link #minute} the wall-clock time, and {@link #durationSeconds} the call length.
 * {@link #ref} is a seed-only key used to attach the matching {@link NegotiationSeed} rounds; it is
 * not persisted.
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class CallSeed {

    public String ref;
    public int daysAgo;
    public int hour;
    public int minute;
    public int durationSeconds;
    public Boolean sentiment;
    public String carrierId;
    public String carrierLocation;
    public String carrierEquipment;
    public Boolean booked;
    public Double amount;
    public String loadId;
    public Integer backAndForths;
}
