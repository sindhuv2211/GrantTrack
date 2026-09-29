package com.example.GrantTrack.service;

import com.example.GrantTrack.Repository.ExpenditureRepository;
import com.example.GrantTrack.model.Application;
import com.example.GrantTrack.model.ApplicationStatus;
import com.example.GrantTrack.model.Expenditure;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class ExpenditureService {

    private final ExpenditureRepository expenditureRepository;
    private final ApplicationService applicationService;

    public ExpenditureService(ExpenditureRepository expenditureRepository,
                               ApplicationService applicationService) {
        this.expenditureRepository = expenditureRepository;
        this.applicationService = applicationService;
    }

    public Expenditure add(Long applicationId, Expenditure expenditure) {
        Application application = applicationService.getById(applicationId);

        if (application.getStatus() != ApplicationStatus.APPROVED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Expenditure can only be added for an approved application.");
        }

        BigDecimal existing = expenditureRepository.sumAmountByApplicationId(applicationId);
        BigDecimal total = existing.add(expenditure.getAmount());

        if (total.compareTo(application.getApprovedAmount()) > 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Total expenditure cannot exceed the approved amount.");
        }

        expenditure.setApplication(application);
        return expenditureRepository.save(expenditure);
    }

    public List<Expenditure> getAll(Long applicationId) {
        applicationService.getById(applicationId);
        return expenditureRepository.findByApplicationId(applicationId);
    }

    public Map<String, BigDecimal> getBudget(Long applicationId) {
        Application application = applicationService.getById(applicationId);
        BigDecimal approved = application.getApprovedAmount();
        BigDecimal spent = expenditureRepository.sumAmountByApplicationId(applicationId);
        BigDecimal remaining = approved.subtract(spent);

        Map<String, BigDecimal> budget = new HashMap<>();
        budget.put("approvedAmount", approved);
        budget.put("totalExpenditure", spent);
        budget.put("remainingAmount", remaining);
        return budget;
    }
}
