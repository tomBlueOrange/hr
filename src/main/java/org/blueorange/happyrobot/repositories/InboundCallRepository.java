package org.blueorange.happyrobot.repositories;

import org.blueorange.happyrobot.entities.InboundCall;
import org.springframework.data.repository.CrudRepository;

public interface InboundCallRepository extends CrudRepository<InboundCall, String> {
}
