package com.example.GrantTrack.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "stage")
public class Stage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private ApplicationStatus stageName;

    private String remarks;

    private LocalDateTime stageDate;

    @ManyToOne
    @JoinColumn(name = "application_id")
    @JsonIgnore
    private Application application;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ApplicationStatus getStageName() { return stageName; }
    public void setStageName(ApplicationStatus stageName) { this.stageName = stageName; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public LocalDateTime getStageDate() { return stageDate; }
    public void setStageDate(LocalDateTime stageDate) { this.stageDate = stageDate; }

    public Application getApplication() { return application; }
    public void setApplication(Application application) { this.application = application; }
}
