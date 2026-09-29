package com.example.GrantTrack.Controller;

import com.example.GrantTrack.model.Expenditure;
import com.example.GrantTrack.service.ExpenditureService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications/{applicationId}/expenditures")
public class ExpenditureController {

    private final ExpenditureService expenditureService;

    public ExpenditureController(ExpenditureService expenditureService) {
        this.expenditureService = expenditureService;
    }

    @PostMapping
    public ResponseEntity<Expenditure> add(@PathVariable Long applicationId,
                                            @Valid @RequestBody Expenditure expenditure) {
        return ResponseEntity.status(HttpStatus.CREATED).body(expenditureService.add(applicationId, expenditure));
    }

    @GetMapping
    public ResponseEntity<List<Expenditure>> getAll(@PathVariable Long applicationId) {
        return ResponseEntity.ok(expenditureService.getAll(applicationId));
    }

    @GetMapping("/budget")
    public ResponseEntity<Map<String, BigDecimal>> getBudget(@PathVariable Long applicationId) {
        return ResponseEntity.ok(expenditureService.getBudget(applicationId));
    }
}
