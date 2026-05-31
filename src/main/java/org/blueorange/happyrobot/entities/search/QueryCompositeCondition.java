package org.blueorange.happyrobot.entities.search;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * An internal node of the query tree that combines its children with a single
 * {@link QueryOperand} (AND/OR/NOT), mirroring the search-sdk {@code QueryCompositeCondition}.
 * Composites may nest arbitrarily, e.g. {@code (A AND B) OR (C AND NOT D)}.
 */
public class QueryCompositeCondition implements QueryComponent {

    private QueryOperand operand;
    private List<QueryComponent> components = new ArrayList<>();

    public QueryCompositeCondition() {
    }

    public QueryCompositeCondition(QueryOperand operand) {
        this.operand = operand;
    }

    // --- Convenience factories for programmatic query building ----------------

    public static QueryCompositeCondition and(QueryComponent... components) {
        return of(QueryOperand.AND, components);
    }

    public static QueryCompositeCondition or(QueryComponent... components) {
        return of(QueryOperand.OR, components);
    }

    public static QueryCompositeCondition not(QueryComponent... components) {
        return of(QueryOperand.NOT, components);
    }

    private static QueryCompositeCondition of(QueryOperand operand, QueryComponent... components) {
        QueryCompositeCondition c = new QueryCompositeCondition(operand);
        c.components = new ArrayList<>(Arrays.asList(components));
        return c;
    }

    /** Appends a child and returns {@code this} for chaining. */
    public QueryCompositeCondition add(QueryComponent component) {
        this.components.add(component);
        return this;
    }

    public QueryOperand getOperand() {
        return operand;
    }

    public void setOperand(QueryOperand operand) {
        this.operand = operand;
    }

    public List<QueryComponent> getComponents() {
        return components;
    }

    public void setComponents(List<QueryComponent> components) {
        this.components = components == null ? new ArrayList<>() : components;
    }
}
