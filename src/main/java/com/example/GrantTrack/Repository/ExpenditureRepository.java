package com.example.GrantTrack.Repository;

import com.example.GrantTrack.model.Expenditure;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.math.BigDecimal;
import java.util.List;

public interface ExpenditureRepository extends JpaRepository<Expenditure, Long> {
    List<Expenditure> findByApplicationId(Long applicationId);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expenditure e WHERE e.application.id = :applicationId")
    BigDecimal sumAmountByApplicationId(Long applicationId);
}
