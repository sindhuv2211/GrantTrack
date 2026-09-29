package com.example.GrantTrack.Controller;

import com.example.GrantTrack.model.Application;
import com.example.GrantTrack.model.ApplicationStatus;
import com.example.GrantTrack.model.Stage;
import com.example.GrantTrack.service.ApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping
    public ResponseEntity<Application> create(@Valid @RequestBody Application application) {
        return ResponseEntity.status(HttpStatus.CREATED).body(applicationService.create(application));
    }

    @GetMapping
    public ResponseEntity<List<Application>> getAll() {
        return ResponseEntity.ok(applicationService.getAll());
    }

    @GetMapping("/nearing-deadline")
    public ResponseEntity<List<Application>> nearingDeadline() {
        return ResponseEntity.ok(applicationService.getNearingDeadline());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Application> getById(@PathVariable Long id) {
        return ResponseEntity.ok(applicationService.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Application> update(@PathVariable Long id,
                                               @Valid @RequestBody Application application) {
        return ResponseEntity.ok(applicationService.update(id, application));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        applicationService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Application> changeStatus(
            @PathVariable Long id,
            @RequestParam ApplicationStatus status,
            @RequestParam(required = false) String remarks,
            @RequestParam(required = false) Double approvedAmount) {
        return ResponseEntity.ok(applicationService.changeStatus(id, status, remarks, approvedAmount));
    }

    @GetMapping("/{id}/stages")
    public ResponseEntity<List<Stage>> getStages(@PathVariable Long id) {
        return ResponseEntity.ok(applicationService.getStages(id));
    }
}
