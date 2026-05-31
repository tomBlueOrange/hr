package org.blueorange.happyrobot.repositories;

import org.blueorange.happyrobot.entities.Negotiation;
import org.springframework.data.repository.CrudRepository;

public interface NegotiationRepository extends CrudRepository<Negotiation, String> {
}
