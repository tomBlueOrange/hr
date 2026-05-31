package org.blueorange.happyrobot.controllers;

import com.blueorange.commons.config.OrangeLogger;
import com.blueorange.commons.config.SafeLogParam;
import com.blueorange.passportsdk.annotation.Authentication;
import org.blueorange.happyrobot.entities.fmcsa.CarrierValidationResponse;
import org.blueorange.happyrobot.entities.search.Query;
import org.blueorange.happyrobot.entities.search.QueryResponse;
import org.blueorange.happyrobot.services.FmcsaService;
import org.blueorange.happyrobot.services.LoadSearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
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

    @Authentication()
    @RequestMapping(value = "/get", method= RequestMethod.GET)
    public String test() {
        logger.info("Request received");
        return "Hello World";
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
