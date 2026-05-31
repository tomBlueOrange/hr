package org.blueorange.happyrobot.services;

import com.blueorange.commons.config.OrangeLogger;
import com.blueorange.commons.config.SafeLogParam;
import com.blueorange.commons.config.UnSafeLogParam;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class FmcsaService {

    private static final OrangeLogger logger = new OrangeLogger(FmcsaService.class);

    private String apiToken;

    @Autowired
    public FmcsaService(
            @Value("${application.fde-interview.fmcsa}") String apiToken
    ) {
        logger.info("Creating FMCSA Service with api key: {}", UnSafeLogParam.of(apiToken));
        this.apiToken = apiToken;
    }
}
