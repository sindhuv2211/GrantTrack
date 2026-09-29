package com.example.GrantTrack.Controller;

import com.example.GrantTrack.Repository.FacultyRepository;
import com.example.GrantTrack.model.*;
import com.example.GrantTrack.service.ApplicationService;
import com.example.GrantTrack.service.ExpenditureService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.math.BigDecimal;
import java.util.List;

@Controller
public class WebController {

    private final ApplicationService applicationService;
    private final ExpenditureService expenditureService;
    private final FacultyRepository facultyRepository;

    public WebController(ApplicationService applicationService,
                         ExpenditureService expenditureService,
                         FacultyRepository facultyRepository) {
        this.applicationService = applicationService;
        this.expenditureService = expenditureService;
        this.facultyRepository = facultyRepository;
    }

    // ── Dashboard ──────────────────────────────────────────────────────────────

    @GetMapping("/")
    public String dashboard(Model model) {
        List<Application> apps = applicationService.getAll();
        model.addAttribute("apps", apps);
        model.addAttribute("total",      apps.size());
        model.addAttribute("submitted",  apps.stream().filter(a -> a.getStatus() == ApplicationStatus.SUBMITTED).count());
        model.addAttribute("underReview",apps.stream().filter(a -> a.getStatus() == ApplicationStatus.UNDER_REVIEW).count());
        model.addAttribute("approved",   apps.stream().filter(a -> a.getStatus() == ApplicationStatus.APPROVED).count());
        model.addAttribute("rejected",   apps.stream().filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count());
        model.addAttribute("nearDeadline", applicationService.getNearingDeadline().size());
        return "index";
    }

    // ── Applications ───────────────────────────────────────────────────────────

    @GetMapping("/applications")
    public String applications(Model model) {
        model.addAttribute("apps", applicationService.getAll());
        return "applications";
    }

    @GetMapping("/applications/new")
    public String newApplicationForm(Model model) {
        model.addAttribute("application", new Application());
        model.addAttribute("faculties", facultyRepository.findAll());
        model.addAttribute("statuses", ApplicationStatus.values());
        return "application-form";
    }

    @PostMapping("/applications/new")
    public String createApplication(@ModelAttribute Application application,
                                    @RequestParam Long facultyId,
                                    @RequestParam(required = false) BigDecimal approvedAmount,
                                    RedirectAttributes ra) {
        try {
            Faculty f = new Faculty();
            f.setId(facultyId);
            application.setFaculty(f);
            if (approvedAmount != null) application.setApprovedAmount(approvedAmount);
            applicationService.create(application);
            ra.addFlashAttribute("success", "Application submitted successfully.");
        } catch (ResponseStatusException e) {
            ra.addFlashAttribute("error", e.getReason());
            ra.addFlashAttribute("formData", application);
        }
        return "redirect:/applications";
    }

    @GetMapping("/applications/{id}")
    public String applicationDetail(@PathVariable Long id, Model model) {
        Application app = applicationService.getById(id);
        List<Stage> stages = applicationService.getStages(id);
        model.addAttribute("app", app);
        model.addAttribute("stages", stages);
        model.addAttribute("statuses", ApplicationStatus.values());
        model.addAttribute("statusForm", new StatusUpdateForm());

        if (app.getStatus() == ApplicationStatus.APPROVED) {
            List<Expenditure> expenditures = expenditureService.getAll(id);
            java.util.Map<String, BigDecimal> budget = expenditureService.getBudget(id);
            model.addAttribute("expenditures", expenditures);
            model.addAttribute("budget", budget);
            model.addAttribute("expForm", new ExpenditureForm());
        }
        return "application-detail";
    }

    @PostMapping("/applications/{id}/status")
    public String updateStatus(@PathVariable Long id,
                               @ModelAttribute StatusUpdateForm form,
                               RedirectAttributes ra) {
        try {
            applicationService.changeStatus(id, form.getStatus(), form.getRemarks(), form.getApprovedAmount());
            ra.addFlashAttribute("success", "Status updated to " + form.getStatus() + ".");
        } catch (ResponseStatusException e) {
            ra.addFlashAttribute("error", e.getReason());
        }
        return "redirect:/applications/" + id;
    }

    @PostMapping("/applications/{id}/delete")
    public String deleteApplication(@PathVariable Long id, RedirectAttributes ra) {
        try {
            applicationService.delete(id);
            ra.addFlashAttribute("success", "Application deleted.");
        } catch (ResponseStatusException e) {
            ra.addFlashAttribute("error", e.getReason());
        }
        return "redirect:/applications";
    }

    // ── Expenditure ────────────────────────────────────────────────────────────

    @PostMapping("/applications/{id}/expenditures")
    public String addExpenditure(@PathVariable Long id,
                                 @ModelAttribute ExpenditureForm form,
                                 RedirectAttributes ra) {
        try {
            Expenditure exp = new Expenditure();
            exp.setDescription(form.getDescription());
            exp.setAmount(form.getAmount());
            exp.setExpenditureDate(form.getExpenditureDate());
            expenditureService.add(id, exp);
            ra.addFlashAttribute("success", "Expenditure added successfully.");
        } catch (ResponseStatusException e) {
            ra.addFlashAttribute("error", e.getReason());
        }
        return "redirect:/applications/" + id;
    }

    // ── Faculty ────────────────────────────────────────────────────────────────

    @GetMapping("/faculty")
    public String faculty(Model model) {
        model.addAttribute("faculties", facultyRepository.findAll());
        model.addAttribute("newFaculty", new Faculty());
        return "faculty";
    }

    @PostMapping("/faculty/new")
    public String createFaculty(@ModelAttribute Faculty faculty, RedirectAttributes ra) {
        try {
            facultyRepository.save(faculty);
            ra.addFlashAttribute("success", "Faculty added successfully.");
        } catch (Exception e) {
            ra.addFlashAttribute("error", "Failed to add faculty: " + e.getMessage());
        }
        return "redirect:/faculty";
    }
}
