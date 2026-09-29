package com.example.GrantTrack.exception;

import java.time.LocalDateTime;
import java.util.Map;

public class ApiErrorResponse {
    private String message;
    private Map<String, String> errors;
    private int status;
    private LocalDateTime timestamp;

    public ApiErrorResponse(String message, int status) {
        this.message = message;
        this.status = status;
        this.timestamp = LocalDateTime.now();
    }

    public ApiErrorResponse(String message, Map<String, String> errors, int status) {
        this.message = message;
        this.errors = errors;
        this.status = status;
        this.timestamp = LocalDateTime.now();
    }

    public String getMessage() { return message; }
    public Map<String, String> getErrors() { return errors; }
    public int getStatus() { return status; }
    public LocalDateTime getTimestamp() { return timestamp; }
}
