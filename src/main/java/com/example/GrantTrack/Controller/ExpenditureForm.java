package com.example.GrantTrack.Controller;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ExpenditureForm {
    private String description;
    private BigDecimal amount;
    private LocalDate expenditureDate;

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public LocalDate getExpenditureDate() { return expenditureDate; }
    public void setExpenditureDate(LocalDate expenditureDate) { this.expenditureDate = expenditureDate; }
}
