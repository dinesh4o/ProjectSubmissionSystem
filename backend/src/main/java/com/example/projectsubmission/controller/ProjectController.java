package com.example.projectsubmission.controller;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.projectsubmission.model.Project;
import com.example.projectsubmission.service.ProjectService;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {
    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) String teacher) {
        try {
            List<Project> projects;
            if (teacher != null && !teacher.isBlank()) {
                projects = projectService.findByTeacher(teacher);
            } else {
                projects = projectService.findAll();
            }
            // Always return a list, even if empty
            return ResponseEntity.ok(projects != null ? projects : Collections.emptyList());
        } catch (Exception e) {
            e.printStackTrace();
            String errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getName();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to load projects: " + errorMsg, 
                                                          "details", e.getClass().getSimpleName()));
        }
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Map<String, String> body) {
        try {
            String teacher = body.get("teacher");
            String title = body.get("title");
            String description = body.getOrDefault("description", "");
            
            if (teacher == null || teacher.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Teacher is required"));
            }
            if (title == null || title.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Title is required"));
            }
            
            Project p = new Project(teacher, title, description == null ? "" : description);
            Project created = projectService.create(p);
            
            // Return created project or empty if null
            if (created == null) {
                return ResponseEntity.status(500).body(Map.of("error", "Project was not created"));
            }
            
            return ResponseEntity.ok(created);
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            e.printStackTrace();
            String causeMsg = e.getCause() != null ? e.getCause().getMessage() : "";
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create project: " + e.getMessage(), 
                                                          "cause", causeMsg));
        } catch (Exception e) {
            e.printStackTrace();
            String errorMsg = e.getMessage() != null ? e.getMessage() : e.getClass().getName();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create project: " + errorMsg,
                                                          "type", e.getClass().getSimpleName()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            projectService.delete(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete project: " + e.getMessage()));
        }
    }
}


