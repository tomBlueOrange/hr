package org.blueorange.happyrobot.entities.search;

import java.util.ArrayList;
import java.util.List;

/**
 * A flat, query-string-friendly view over a load search, intended for callers (such as the
 * HappyRobot voice agent) that cannot easily build the nested {@link Query} tree the
 * {@code /loads/search} endpoint expects. Each populated field becomes one clause; the clauses are
 * combined with AND via {@link #toQuery()}, so the more fields a caller sets the narrower the search.
 *
 * <p>All fields are optional. Text fields ({@link #origin}, {@link #destination},
 * {@link #equipmentType}, {@link #commodity}) are matched as analysed full text against the single
 * corresponding load field. {@link #referenceNumber} is matched as a (case-insensitive) substring of
 * {@code loadId} — its digits are used when present, so {@code "LD-100003"}, {@code "100003"} and
 * {@code "mc 100003"} all resolve to the same load. The numeric bounds form inclusive ranges. With no
 * field set the query matches all loads (subject to paging/sorting).
 */
public class LoadSearchCriteria {

    private String origin;
    private String destination;
    private String equipmentType;
    private String commodity;
    private String referenceNumber;

    private Double minRate;
    private Double maxRate;
    private Double minWeight;
    private Double maxWeight;
    private Double maxMiles;

    private int page = 0;
    private int size = 3;
    /** A sortable {@link LoadField} name, or {@code relevance}; defaults to highest-paying first. */
    private String sortBy = "loadboardRate";
    private String sortDir = "DESC";

    /**
     * Assembles the equivalent granular {@link Query}: an AND over one clause per populated field,
     * plus paging and a single sort. Returns a query with a {@code null} root (match-all) when no
     * field is set.
     */
    public Query toQuery() {
        List<QueryComponent> components = new ArrayList<>();
        addFullText(components, "startingLocation", origin);
        addFullText(components, "deliveryLocation", destination);
        addFullText(components, "equipmentType", equipmentType);
        addFullText(components, "commodityType", commodity);
        addReference(components, referenceNumber);
        addRange(components, "loadboardRate", minRate, maxRate);
        addRange(components, "weight", minWeight, maxWeight);
        addRange(components, "miles", null, maxMiles);

        Query query = new Query();
        if (!components.isEmpty()) {
            QueryCompositeCondition root = new QueryCompositeCondition(QueryOperand.AND);
            root.setComponents(components);
            query.setRootCondition(root);
        }
        query.setPage(Math.max(0, page));
        query.setSize(size <= 0 ? 3 : size);
        query.addSortCondition(resolveSort());
        return query;
    }

    private static void addFullText(List<QueryComponent> components, String field, String value) {
        if (hasText(value)) {
            components.add(QueryCondition.fullText(
                    new QueryFullTextCondition(value.trim(), List.of(field))));
        }
    }

    private static void addReference(List<QueryComponent> components, String reference) {
        if (!hasText(reference)) {
            return;
        }
        // loadId is an un-analysed keyword (e.g. "LD-100003"); a hyphenated wildcard does not match,
        // so we anchor on the digits when the caller gives a full reference number.
        String digits = reference.replaceAll("\\D", "");
        String needle = hasText(digits) ? digits : reference.trim();
        QueryTermCondition term = new QueryTermCondition("loadId", "*" + needle + "*", QueryTermType.WILDCARD);
        term.setCaseInsensitive(true);
        components.add(QueryCondition.term(term));
    }

    private static void addRange(List<QueryComponent> components, String field, Double min, Double max) {
        if (min == null && max == null) {
            return;
        }
        QueryNumericCondition numeric = new QueryNumericCondition(field);
        numeric.setGte(min);
        numeric.setLte(max);
        components.add(QueryCondition.numeric(numeric));
    }

    private SortCondition resolveSort() {
        SortDirection direction = "ASC".equalsIgnoreCase(sortDir) ? SortDirection.ASC : SortDirection.DESC;
        if (!hasText(sortBy) || "relevance".equalsIgnoreCase(sortBy) || SortCondition.RELEVANCE.equals(sortBy)) {
            return SortCondition.relevance(direction);
        }
        return new SortCondition(sortBy.trim(), direction);
    }

    private static boolean hasText(String s) {
        return s != null && !s.isBlank();
    }

    public String getOrigin() {
        return origin;
    }

    public void setOrigin(String origin) {
        this.origin = origin;
    }

    public String getDestination() {
        return destination;
    }

    public void setDestination(String destination) {
        this.destination = destination;
    }

    public String getEquipmentType() {
        return equipmentType;
    }

    public void setEquipmentType(String equipmentType) {
        this.equipmentType = equipmentType;
    }

    public String getCommodity() {
        return commodity;
    }

    public void setCommodity(String commodity) {
        this.commodity = commodity;
    }

    public String getReferenceNumber() {
        return referenceNumber;
    }

    public void setReferenceNumber(String referenceNumber) {
        this.referenceNumber = referenceNumber;
    }

    public Double getMinRate() {
        return minRate;
    }

    public void setMinRate(Double minRate) {
        this.minRate = minRate;
    }

    public Double getMaxRate() {
        return maxRate;
    }

    public void setMaxRate(Double maxRate) {
        this.maxRate = maxRate;
    }

    public Double getMinWeight() {
        return minWeight;
    }

    public void setMinWeight(Double minWeight) {
        this.minWeight = minWeight;
    }

    public Double getMaxWeight() {
        return maxWeight;
    }

    public void setMaxWeight(Double maxWeight) {
        this.maxWeight = maxWeight;
    }

    public Double getMaxMiles() {
        return maxMiles;
    }

    public void setMaxMiles(Double maxMiles) {
        this.maxMiles = maxMiles;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getSize() {
        return size;
    }

    public void setSize(int size) {
        this.size = size;
    }

    public String getSortBy() {
        return sortBy;
    }

    public void setSortBy(String sortBy) {
        this.sortBy = sortBy;
    }

    public String getSortDir() {
        return sortDir;
    }

    public void setSortDir(String sortDir) {
        this.sortDir = sortDir;
    }
}
