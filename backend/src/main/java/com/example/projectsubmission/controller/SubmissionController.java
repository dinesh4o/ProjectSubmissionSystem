package com.example.projectsubmission.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.projectsubmission.model.Submission;
import com.example.projectsubmission.service.SubmissionService;
import com.example.projectsubmission.storage.FileStorageService;

@RestController
@RequestMapping("/api/submissions")
public class SubmissionController {
    private final SubmissionService submissionService;
    private final FileStorageService fileStorageService;

    @Value("${app.base-url:}")
    private String baseUrl; // e.g., https://your-backend.onrender.com

    public SubmissionController(SubmissionService submissionService, FileStorageService fileStorageService) {
        this.submissionService = submissionService;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) String student,
                                  @RequestParam(required = false) Long projectId) {
        try {
            if (student != null && !student.isBlank()) {
                return ResponseEntity.ok(submissionService.findByStudent(student));
            }
            if (projectId != null) {
                return ResponseEntity.ok(submissionService.findByProject(projectId));
            }
            return ResponseEntity.ok(submissionService.findAll());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to load submissions: " + e.getMessage()));
        }
    }

    @PostMapping
    public ResponseEntity<?> upload(@RequestParam Long projectId,
                                    @RequestParam String student,
                                    @RequestParam("file") MultipartFile file) {
        try {
            if (file == null || file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File is required"));
            }
            if (student == null || student.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Student is required"));
            }
            if (projectId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Project ID is required"));
            }
            
            String originalFilename = file.getOriginalFilename();
            if (originalFilename == null || originalFilename.isBlank()) {
                originalFilename = "file";
            }
            
            String storedName = fileStorageService.store(file, student);
            String fileUrl = (baseUrl != null && !baseUrl.isBlank() ? baseUrl : "") + "/files/" + storedName;
            Submission created = submissionService.create(student, projectId, originalFilename, fileUrl);
            return ResponseEntity.ok(created);
        } catch (IOException e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create submission: " + e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            submissionService.delete(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete submission: " + e.getMessage()));
        }
    }
}


