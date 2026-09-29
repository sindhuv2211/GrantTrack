package com.example.GrantTrack.Controller;

import com.example.GrantTrack.model.ApplicationStatus;

public class StatusUpdateForm {
    private ApplicationStatus status;
    private String remarks;
    private Double approvedAmount;

    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public Double getApprovedAmount() { return approvedAmount; }
    public void setApprovedAmount(Double approvedAmount) { this.approvedAmount = approvedAmount; }
}
