package org.blueorange.happyrobot.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.blueorange.happyrobot.entities.Load;
import org.blueorange.happyrobot.search.Query;
import org.blueorange.happyrobot.search.QueryCompositeCondition;
import org.blueorange.happyrobot.search.QueryCondition;
import org.blueorange.happyrobot.search.QueryDateCondition;
import org.blueorange.happyrobot.search.QueryFullTextCondition;
import org.blueorange.happyrobot.search.QueryNumericCondition;
import org.blueorange.happyrobot.search.QueryResponse;
import org.blueorange.happyrobot.search.QueryTermCondition;
import org.blueorange.happyrobot.search.QueryTermType;
import org.blueorange.happyrobot.search.ResponseState;
import org.blueorange.happyrobot.search.SortCondition;
import org.blueorange.happyrobot.search.SortDirection;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.core.io.ClassPathResource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * End-to-end exercise of the granular query API: builds the embedded index from the dummy data and
 * asserts that the {@link Query} model translates into the expected Lucene matches, sorting and
 * pagination.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class LoadSearchServiceTest {

    private LoadSearchService service;

    @BeforeAll
    void buildIndex() {
        service = new LoadSearchService(new ObjectMapper(),
                new ClassPathResource("data/dummy_load_data.json"));
        service.buildIndex();
        assertTrue(service.isReady(), "index should be ready after a synchronous build");
        assertEquals(12, service.getDocumentsIndexed());
    }

    @Test
    void freeTextStringSearchDelegatesToFullText() {
        List<Load> results = service.search("Reefer", 10);
        assertEquals(3, results.size());
        assertTrue(results.stream().allMatch(l -> "Reefer".equals(l.getEquipmentType())));
    }

    @Test
    void fullTextConditionMatchesDefaultFields() {
        Query query = new Query(QueryCondition.fullText(
                QueryFullTextCondition.of("Reefer")));
        query.setSize(20);

        QueryResponse response = service.search(query);

        assertEquals(ResponseState.SUCCESS, response.getState());
        assertEquals(3, response.getCount());
        assertEquals(3, response.getResults().size());
    }

    @Test
    void wildcardTermConditionMatchesAnalysedToken() {
        Query query = new Query(QueryCondition.term(
                QueryTermCondition.of("equipmentType", "dry*", QueryTermType.WILDCARD)));
        query.setSize(20);

        QueryResponse response = service.search(query);

        assertEquals(6, response.getCount(), "there are six Dry Van loads");
        assertTrue(response.getResults().stream().allMatch(l -> "Dry Van".equals(l.getEquipmentType())));
    }

    @Test
    void numericRangeIsInclusiveOnBothEnds() {
        QueryNumericCondition rate = new QueryNumericCondition("loadboardRate");
        rate.setGte(1000.0);
        rate.setLte(1500.0);
        Query query = new Query(QueryCondition.numeric(rate));
        query.setSize(20);

        QueryResponse response = service.search(query);

        assertEquals(5, response.getCount());
        assertTrue(response.getResults().stream()
                .allMatch(l -> l.getLoadboardRate() >= 1000.0 && l.getLoadboardRate() <= 1500.0));
    }

    @Test
    void dateRangeFiltersByPickup() {
        QueryDateCondition pickup = new QueryDateCondition("pickupDateTime");
        pickup.setGte("2026-06-04T00:00:00Z");
        Query query = new Query(QueryCondition.date(pickup));
        query.setSize(20);

        QueryResponse response = service.search(query);

        // Loads picking up on or after 2026-06-04.
        assertEquals(5, response.getCount());
    }

    @Test
    void compositeAndCombinesConstraints() {
        QueryNumericCondition rate = new QueryNumericCondition("loadboardRate");
        rate.setGte(1000.0);
        Query query = new Query(QueryCompositeCondition.and(
                QueryCondition.term(QueryTermCondition.of("equipmentType", "dry*", QueryTermType.WILDCARD)),
                QueryCondition.numeric(rate)));
        query.setSize(20);

        QueryResponse response = service.search(query);

        assertEquals(3, response.getCount(), "Dry Van loads with rate >= 1000");
    }

    @Test
    void compositeNotExcludesMatches() {
        Query query = new Query(QueryCompositeCondition.not(
                QueryCondition.term(QueryTermCondition.of("equipmentType", "reefer", QueryTermType.WILDCARD))));
        query.setSize(20);

        QueryResponse response = service.search(query);

        assertEquals(9, response.getCount(), "all loads except the three reefers");
        assertFalse(response.getResults().stream().anyMatch(l -> "Reefer".equals(l.getEquipmentType())));
    }

    @Test
    void compositeOrUnionsMatches() {
        QueryNumericCondition rate = new QueryNumericCondition("loadboardRate");
        rate.setGte(2000.0);
        Query query = new Query(QueryCompositeCondition.or(
                QueryCondition.term(QueryTermCondition.of("equipmentType", "dry*", QueryTermType.WILDCARD)),
                QueryCondition.numeric(rate)));
        query.setSize(20);

        QueryResponse response = service.search(query);

        // 6 Dry Van loads, plus the one non-Dry-Van load (Flatbed) with rate >= 2000.
        assertEquals(7, response.getCount());
    }

    @Test
    void defaultOrderIsByRelevance() {
        // "reefer produce": LD-100002 matches both terms; the other two reefers match only "reefer".
        Query query = new Query(QueryCondition.fullText(QueryFullTextCondition.of("reefer produce")));
        query.setSize(10);

        QueryResponse response = service.search(query);

        assertEquals(3, response.getCount());
        assertEquals("LD-100002", response.getResults().get(0).getLoadId(),
                "most relevant load (matches both terms) should rank first by default");
    }

    @Test
    void explicitRelevanceSortMatchesDefaultOrder() {
        Query query = new Query(QueryCondition.fullText(QueryFullTextCondition.of("reefer produce")));
        query.setSize(10);
        query.addSortCondition(SortCondition.relevance());

        QueryResponse response = service.search(query);

        assertEquals("LD-100002", response.getResults().get(0).getLoadId());
    }

    @Test
    void ascendingRelevancePutsLeastRelevantFirst() {
        Query query = new Query(QueryCondition.fullText(QueryFullTextCondition.of("reefer produce")));
        query.setSize(10);
        query.addSortCondition(SortCondition.relevance(SortDirection.ASC));

        QueryResponse response = service.search(query);

        assertEquals(3, response.getResults().size());
        assertEquals("LD-100002", response.getResults().get(2).getLoadId(),
                "most relevant load should rank last when relevance is ascending");
    }

    @Test
    void fieldSortFallsBackToRelevanceTieBreaker() {
        // Equipment type is identical across the three reefers, so the secondary order is relevance.
        Query query = new Query(QueryCompositeCondition.and(
                QueryCondition.fullText(QueryFullTextCondition.of("reefer produce")),
                QueryCondition.term(QueryTermCondition.of("equipmentType", "reefer", QueryTermType.WILDCARD))));
        query.setSize(10);
        query.addSortCondition(new SortCondition("equipmentType", SortDirection.ASC));

        QueryResponse response = service.search(query);

        assertEquals(3, response.getResults().size());
        assertEquals("LD-100002", response.getResults().get(0).getLoadId(),
                "with equal equipment types, the most relevant load wins the tie-break");
    }

    @Test
    void sortOrdersByRequestedField() {
        Query query = new Query(); // null root condition -> match all
        query.setSize(12);
        query.addSortCondition(new SortCondition("loadboardRate", SortDirection.ASC));

        QueryResponse response = service.search(query);

        assertEquals(12, response.getResults().size());
        assertEquals(685.0, response.getResults().get(0).getLoadboardRate());
        assertEquals(2890.0, response.getResults().get(11).getLoadboardRate());
    }

    @Test
    void paginationSlicesSortedResults() {
        Query first = new Query();
        first.setSize(5);
        first.setPage(0);
        first.addSortCondition(new SortCondition("loadboardRate", SortDirection.ASC));
        QueryResponse firstPage = service.search(first);

        assertEquals(12, firstPage.getCount(), "count reflects all matches, not just the page");
        assertEquals(5, firstPage.getResults().size());
        assertEquals(685.0, firstPage.getResults().get(0).getLoadboardRate());

        Query second = new Query();
        second.setSize(5);
        second.setPage(1);
        second.addSortCondition(new SortCondition("loadboardRate", SortDirection.ASC));
        QueryResponse secondPage = service.search(second);

        assertEquals(5, secondPage.getResults().size());
        // Second page must start strictly above the first page's last rate.
        double lastOfFirst = firstPage.getResults().get(4).getLoadboardRate();
        assertTrue(secondPage.getResults().get(0).getLoadboardRate() >= lastOfFirst);
    }

    @Test
    void unknownFieldYieldsErrorResponse() {
        QueryNumericCondition bogus = new QueryNumericCondition("notAField");
        bogus.setGte(1.0);
        Query query = new Query(QueryCondition.numeric(bogus));

        QueryResponse response = service.search(query);

        assertEquals(ResponseState.ERROR, response.getState());
        assertTrue(response.getResults().isEmpty());
        assertTrue(response.getError() != null && response.getError().contains("notAField"));
    }

    @Test
    void searchBeforeIndexReadyReportsError() {
        LoadSearchService cold = new LoadSearchService(new ObjectMapper(),
                new ClassPathResource("data/dummy_load_data.json"));
        QueryResponse response = cold.search(new Query());
        assertEquals(ResponseState.ERROR, response.getState());
        assertTrue(response.getResults().isEmpty());
    }
}
