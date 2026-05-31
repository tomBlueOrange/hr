package org.blueorange.happyrobot.services;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.blueorange.happyrobot.entities.Load;
import org.blueorange.happyrobot.entities.search.LoadSearchCriteria;
import org.blueorange.happyrobot.entities.search.QueryResponse;
import org.blueorange.happyrobot.entities.search.ResponseState;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.core.io.ClassPathResource;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Exercises {@link LoadSearchCriteria} end-to-end: it builds the embedded index from the dummy data,
 * then asserts that the flattened criteria translate into the same Lucene matches a hand-built
 * {@link org.blueorange.happyrobot.entities.search.Query} would, including AND-combination across
 * fields, numeric ranges, reference-number resolution and the default highest-paying-first sort.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class LoadSearchCriteriaTest {

    private LoadSearchService service;

    @BeforeAll
    void buildIndex() {
        service = new LoadSearchService(new ObjectMapper(),
                new ClassPathResource("data/dummy_load_data.json"));
        service.buildIndex();
        assertTrue(service.isReady(), "index should be ready after a synchronous build");
    }

    private List<Load> find(LoadSearchCriteria criteria) {
        QueryResponse response = service.search(criteria.toQuery());
        assertEquals(ResponseState.SUCCESS, response.getState(), response.getError());
        return response.getResults();
    }

    @Test
    void emptyCriteriaMatchesAllLoadsButPagesToDefaultSize() {
        LoadSearchCriteria criteria = new LoadSearchCriteria();
        QueryResponse response = service.search(criteria.toQuery());

        assertEquals(ResponseState.SUCCESS, response.getState());
        assertEquals(service.getDocumentsIndexed(), response.getCount(), "match-all should count every load");
        assertEquals(3, response.getResults().size(), "default page size is 3");
    }

    @Test
    void equipmentTypeFiltersToThatEquipment() {
        LoadSearchCriteria criteria = new LoadSearchCriteria();
        criteria.setEquipmentType("Reefer");
        criteria.setSize(20);

        List<Load> results = find(criteria);
        assertFalse(results.isEmpty());
        assertTrue(results.stream().allMatch(l -> "Reefer".equals(l.getEquipmentType())));
    }

    @Test
    void destinationNarrowsByDeliveryLocation() {
        LoadSearchCriteria criteria = new LoadSearchCriteria();
        criteria.setDestination("Dallas");

        List<Load> results = find(criteria);
        assertFalse(results.isEmpty());
        assertTrue(results.stream().allMatch(l -> l.getDeliveryLocation().contains("Dallas")));
    }

    @Test
    void maxRateExcludesPricierLoads() {
        LoadSearchCriteria criteria = new LoadSearchCriteria();
        criteria.setMaxRate(1300.0);
        criteria.setSize(20);

        List<Load> results = find(criteria);
        assertFalse(results.isEmpty());
        assertTrue(results.stream().allMatch(l -> l.getLoadboardRate() <= 1300.0));
    }

    @Test
    void multipleFieldsAreAndedTogether() {
        LoadSearchCriteria criteria = new LoadSearchCriteria();
        criteria.setEquipmentType("Reefer");
        criteria.setMaxRate(1300.0);
        criteria.setSize(20);

        List<Load> results = find(criteria);
        assertTrue(results.stream().allMatch(
                l -> "Reefer".equals(l.getEquipmentType()) && l.getLoadboardRate() <= 1300.0));
    }

    @Test
    void referenceNumberResolvesDespiteHyphenAndPrefix() {
        for (String reference : List.of("LD-100003", "100003", "mc 100003")) {
            LoadSearchCriteria criteria = new LoadSearchCriteria();
            criteria.setReferenceNumber(reference);

            List<Load> results = find(criteria);
            assertEquals(1, results.size(), "expected a single match for " + reference);
            assertEquals("LD-100003", results.get(0).getLoadId());
        }
    }

    @Test
    void defaultSortReturnsHighestPayingFirst() {
        LoadSearchCriteria criteria = new LoadSearchCriteria();
        criteria.setSize(20);

        List<Load> results = find(criteria);
        for (int i = 1; i < results.size(); i++) {
            assertTrue(results.get(i - 1).getLoadboardRate() >= results.get(i).getLoadboardRate(),
                    "results should be ordered by loadboardRate descending");
        }
    }
}
