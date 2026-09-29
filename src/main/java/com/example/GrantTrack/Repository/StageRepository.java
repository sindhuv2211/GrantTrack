package com.example.GrantTrack.Repository;

import com.example.GrantTrack.model.Stage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface StageRepository extends JpaRepository<Stage, Long> {
    List<Stage> findByApplicationIdOrderByStageDateAsc(Long applicationId);
}
