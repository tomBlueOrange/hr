package org.blueorange.happyrobot.controllers;

import com.blueorange.commons.config.OrangeLogger;
import com.blueorange.commons.config.SafeLogParam;
import com.blueorange.passportsdk.annotation.Authentication;
import org.blueorange.happyrobot.entities.fmcsa.CarrierValidationResponse;
import org.blueorange.happyrobot.entities.search.LoadSearchCriteria;
import org.blueorange.happyrobot.entities.search.Query;
import org.blueorange.happyrobot.entities.search.QueryResponse;
import org.blueorange.happyrobot.services.FmcsaService;
import org.blueorange.happyrobot.services.LoadSearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@CrossOrigin
@RequestMapping("/api/v1")
public class HappyRobotApi {

    private static final OrangeLogger logger = new OrangeLogger(HappyRobotApi.class);

    private final FmcsaService fmcsaService;
    private final LoadSearchService loadSearchService;

    @Autowired
    public HappyRobotApi(FmcsaService fmcsaService, LoadSearchService loadSearchService) {
        this.fmcsaService = fmcsaService;
        this.loadSearchService = loadSearchService;
    }

    /**
     * Executes a granular load search. The request body is a {@link Query}: a tree of
     * AND/OR/NOT conditions (full-text, term, numeric and date) with pagination and sorting.
     * The {@link QueryResponse} carries the matched page of loads, the total count and the
     * outcome state (errors, including a warming-up index, are reported in the body).
     */
    @Authentication()
    @RequestMapping(value = "/loads/search", method = RequestMethod.POST)
    public QueryResponse searchLoads(@RequestBody Query query) {
        logger.info("Load search request received (page {}, size {})",
                SafeLogParam.of(query.getPage()), SafeLogParam.of(query.getSize()));
        return loadSearchService.search(query);
    }

    /**
     * A flattened load search for callers that cannot build the nested {@link Query} tree
     * {@link #searchLoads(Query)} expects (notably the HappyRobot voice agent's HTTP tool). Each
     * supplied query parameter — {@code origin}, {@code destination}, {@code equipmentType},
     * {@code commodity}, {@code referenceNumber}, {@code minRate}/{@code maxRate},
     * {@code minWeight}/{@code maxWeight}, {@code maxMiles}, plus {@code page}/{@code size}/
     * {@code sortBy}/{@code sortDir} — becomes one ANDed clause via
     * {@link LoadSearchCriteria#toQuery()}. With no parameters it returns the first page of all loads.
     * The response is the same {@link QueryResponse} envelope as {@code /loads/search}.
     */
    @Authentication()
    @RequestMapping(value = "/loads/find", method = RequestMethod.GET)
    public QueryResponse findLoads(@ModelAttribute LoadSearchCriteria criteria) {
        logger.info("Simple load find request received (origin {}, destination {}, equipment {})",
                SafeLogParam.of(criteria.getOrigin()),
                SafeLogParam.of(criteria.getDestination()),
                SafeLogParam.of(criteria.getEquipmentType()));
        return loadSearchService.search(criteria.toQuery());
    }

    /**
     * Validates an inbound carrier against FMCSA before any load is pitched. The agent supplies the
     * MC/docket number the carrier rep quotes (any common format, e.g. {@code MC-44110} or
     * {@code 44110}); the response says whether the carrier is {@code eligible} to be worked with,
     * with a human-readable {@code reason} and the matched carrier details.
     */
    @Authentication()
    @RequestMapping(value = "/carriers/validate", method = RequestMethod.GET)
    public CarrierValidationResponse validateCarrier(@RequestParam("mcNumber") String mcNumber) {
        logger.info("Carrier validation request received for MC number {}", SafeLogParam.of(mcNumber));
        return fmcsaService.validateCarrier(mcNumber);
    }

}
