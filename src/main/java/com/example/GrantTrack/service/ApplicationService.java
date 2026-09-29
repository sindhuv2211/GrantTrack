package com.example.GrantTrack.service;

import com.example.GrantTrack.Repository.ApplicationRepository;
import com.example.GrantTrack.Repository.FacultyRepository;
import com.example.GrantTrack.Repository.StageRepository;
import com.example.GrantTrack.model.Application;
import com.example.GrantTrack.model.ApplicationStatus;
import com.example.GrantTrack.model.Faculty;
import com.example.GrantTrack.model.Stage;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final FacultyRepository facultyRepository;
    private final StageRepository stageRepository;

    public ApplicationService(ApplicationRepository applicationRepository,
                               FacultyRepository facultyRepository,
                               StageRepository stageRepository) {
        this.applicationRepository = applicationRepository;
        this.facultyRepository = facultyRepository;
        this.stageRepository = stageRepository;
    }

    public Application create(Application application) {
        Faculty faculty = facultyRepository.findById(application.getFaculty().getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Faculty not found"));

        application.setFaculty(faculty);
        application.setStatus(ApplicationStatus.SUBMITTED);

        if (application.getApprovedAmount() == null) {
            application.setApprovedAmount(java.math.BigDecimal.ZERO);
        }

        Application saved = applicationRepository.save(application);

        Stage stage = new Stage();
        stage.setStageName(ApplicationStatus.SUBMITTED);
        stage.setRemarks("Application submitted");
        stage.setStageDate(LocalDateTime.now());
        stage.setApplication(saved);
        stageRepository.save(stage);

        return saved;
    }

    public List<Application> getAll() {
        return applicationRepository.findAll();
    }

    public Application getById(Long id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Application not found"));
    }

    public Application update(Long id, Application updated) {
        Application existing = getById(id);
        existing.setTitle(updated.getTitle());
        existing.setAbstractText(updated.getAbstractText());
        existing.setRequestedAmount(updated.getRequestedAmount());
        existing.setDeadline(updated.getDeadline());
        return applicationRepository.save(existing);
    }

    public void delete(Long id) {
        Application existing = getById(id);
        applicationRepository.delete(existing);
    }

    public Application changeStatus(Long id, ApplicationStatus newStatus, String remarks, Double approvedAmount) {
        Application application = getById(id);

        if (newStatus == ApplicationStatus.APPROVED) {
            if (approvedAmount == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Approved amount is required when approving.");
            }
            java.math.BigDecimal approved = java.math.BigDecimal.valueOf(approvedAmount);
            if (approved.compareTo(application.getRequestedAmount()) > 0) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Approved amount cannot exceed requested amount.");
            }
            application.setApprovedAmount(approved);
        }

        application.setStatus(newStatus);
        Application saved = applicationRepository.save(application);

        Stage stage = new Stage();
        stage.setStageName(newStatus);
        stage.setRemarks(remarks != null ? remarks : "Status updated to " + newStatus);
        stage.setStageDate(LocalDateTime.now());
        stage.setApplication(saved);
        stageRepository.save(stage);

        return saved;
    }

    public List<Stage> getStages(Long id) {
        getById(id);
        return stageRepository.findByApplicationIdOrderByStageDateAsc(id);
    }

    public List<Application> getNearingDeadline() {
        LocalDate today = LocalDate.now();
        LocalDate in7Days = today.plusDays(7);
        return applicationRepository.findByDeadlineBetween(today, in7Days);
    }
}
