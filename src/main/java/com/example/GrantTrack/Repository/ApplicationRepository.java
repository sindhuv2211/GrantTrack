package com.example.GrantTrack.Repository;

import com.example.GrantTrack.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByDeadlineBetween(LocalDate start, LocalDate end);
}
