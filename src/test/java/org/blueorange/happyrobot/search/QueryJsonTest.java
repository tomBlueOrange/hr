package org.blueorange.happyrobot.search;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.blueorange.happyrobot.entities.search.*;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Verifies that the JSON shape the REST endpoint receives deserialises into the right tree. The
 * polymorphic {@link QueryComponent} relies on Jackson <em>deduction</em> (no {@code "type"}
 * discriminator), so this guards against the composite/leaf nodes becoming ambiguous.
 */
class QueryJsonTest {

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    void deserialisesCompositeTreeWithoutDiscriminator() throws Exception {
        String json = """
                {
                  "page": 0,
                  "size": 10,
                  "sortConditions": [
                    { "field": "loadboardRate", "direction": "DESC" }
                  ],
                  "rootCondition": {
                    "operand": "AND",
                    "components": [
                      { "fullText": { "query": "Dallas", "fields": ["deliveryLocation"] } },
                      { "numeric": { "field": "loadboardRate", "gte": 1000.0, "lte": 3000.0 } },
                      {
                        "operand": "NOT",
                        "components": [
                          { "term": { "field": "equipmentType", "query": "reefer", "type": "WILDCARD" } }
                        ]
                      }
                    ]
                  }
                }
                """;

        Query query = mapper.readValue(json, Query.class);

        assertEquals(0, query.getPage());
        assertEquals(10, query.getSize());
        assertEquals(1, query.getSortConditions().size());
        assertEquals(SortDirection.DESC, query.getSortConditions().get(0).getDirection());

        // Root deduced as a composite AND with three children.
        QueryCompositeCondition root = assertInstanceOf(QueryCompositeCondition.class, query.getRootCondition());
        assertEquals(QueryOperand.AND, root.getOperand());
        assertEquals(3, root.getComponents().size());

        // First child: a leaf full-text condition.
        QueryCondition fullTextLeaf = assertInstanceOf(QueryCondition.class, root.getComponents().get(0));
        assertNotNull(fullTextLeaf.getFullText());
        assertEquals("Dallas", fullTextLeaf.getFullText().getQuery());

        // Second child: a leaf numeric condition.
        QueryCondition numericLeaf = assertInstanceOf(QueryCondition.class, root.getComponents().get(1));
        assertNotNull(numericLeaf.getNumeric());
        assertEquals(1000.0, numericLeaf.getNumeric().getGte());

        // Third child: a nested composite NOT wrapping a term condition.
        QueryCompositeCondition not = assertInstanceOf(QueryCompositeCondition.class, root.getComponents().get(2));
        assertEquals(QueryOperand.NOT, not.getOperand());
        QueryCondition termLeaf = assertInstanceOf(QueryCondition.class, not.getComponents().get(0));
        assertEquals(QueryTermType.WILDCARD, termLeaf.getTerm().getType());
    }

    @Test
    void serialisesResponseWithoutNullClutter() throws Exception {
        QueryResponse response = QueryResponse.success(new java.util.ArrayList<>(), 0, 0, 10, 5);
        String json = mapper.writeValueAsString(response);
        assertTrue(json.contains("\"state\":\"SUCCESS\""));
        // error is null on success and should be omitted, not serialised as null.
        assertTrue(!json.contains("\"error\""));
    }
}
