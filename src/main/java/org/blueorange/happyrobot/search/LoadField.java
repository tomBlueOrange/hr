package org.blueorange.happyrobot.search;

import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * The searchable schema of a load document: every Lucene field exposed to the query model,
 * along with the data type that governs how it may be queried and sorted.
 *
 * <p>This is the embedded-Lucene analogue of the search-sdk {@code Schema}/{@code SchemaProperty}
 * pair. The {@code LoadSearchService} consults it when indexing (to know which doc-values to
 * write) and the {@code LuceneQueryTranslator} consults it when building queries (to know whether
 * a range bound is a double, an int or a date, and whether a field can be sorted).
 */
public enum LoadField {

    LOAD_ID("loadId", FieldType.KEYWORD, true),

    STARTING_LOCATION("startingLocation", FieldType.TEXT, true),
    DELIVERY_LOCATION("deliveryLocation", FieldType.TEXT, true),
    EQUIPMENT_TYPE("equipmentType", FieldType.TEXT, true),
    NOTES("notes", FieldType.TEXT, false),
    /** Multi-valued, so it is searchable but not sortable. */
    COMMODITY_TYPE("commodityType", FieldType.TEXT, false),

    LOADBOARD_RATE("loadboardRate", FieldType.DOUBLE, true),
    WEIGHT("weight", FieldType.DOUBLE, true),
    MILES("miles", FieldType.DOUBLE, true),
    NUM_OF_PIECES("numOfPieces", FieldType.INT, true),

    DIM_HEIGHT("dimHeight", FieldType.INT, true),
    DIM_WIDTH("dimWidth", FieldType.INT, true),
    DIM_LENGTH("dimLength", FieldType.INT, true),

    PICKUP_DATE_TIME("pickupDateTime", FieldType.DATE, true),
    DELIVERY_DATE_TIME("deliveryDateTime", FieldType.DATE, true);

    /** The broad category of a field, which determines how it is indexed and queried. */
    public enum FieldType {
        /** Exact-match string (indexed verbatim, not analysed). */
        KEYWORD,
        /** Analysed free text. */
        TEXT,
        /** 64-bit floating point, range-queryable. */
        DOUBLE,
        /** 32-bit integer, range-queryable. */
        INT,
        /** Instant stored as epoch millis, range-queryable. */
        DATE
    }

    private static final Map<String, LoadField> BY_NAME =
            Stream.of(values()).collect(Collectors.toMap(LoadField::fieldName, f -> f));

    private final String fieldName;
    private final FieldType type;
    private final boolean sortable;

    LoadField(String fieldName, FieldType type, boolean sortable) {
        this.fieldName = fieldName;
        this.type = type;
        this.sortable = sortable;
    }

    /** The Lucene field name as written to the index (e.g. {@code "loadboardRate"}). */
    public String fieldName() {
        return fieldName;
    }

    public FieldType type() {
        return type;
    }

    /** Whether single-valued doc-values are written for this field so it can back a sort. */
    public boolean sortable() {
        return sortable;
    }

    /** Looks up a field by its Lucene name, if it is part of the searchable schema. */
    public static Optional<LoadField> byName(String fieldName) {
        return Optional.ofNullable(BY_NAME.get(fieldName));
    }
}
