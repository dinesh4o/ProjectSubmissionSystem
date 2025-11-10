package com.example.projectsubmission.service;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.projectsubmission.model.Project;
import com.example.projectsubmission.repository.ProjectRepository;

@Service
@Transactional
public class ProjectService {
    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    public List<Project> findAll() {
        try {
            return projectRepository.findAll();
        } catch (Exception e) {
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    public List<Project> findByTeacher(String teacher) {
        try {
            if (teacher == null || teacher.isBlank()) {
                return Collections.emptyList();
            }
            return projectRepository.findByTeacher(teacher);
        } catch (Exception e) {
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    public Project create(Project project) {
        if (project == null) {
            throw new IllegalArgumentException("Project cannot be null");
        }
        try {
            // Ensure description is never null for H2 compatibility
            if (project.getDescription() == null) {
                project.setDescription("");
            }
            return projectRepository.save(project);
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Database error while saving project: " + e.getMessage(), e);
        }
    }

    public void delete(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Project ID cannot be null");
        }
        projectRepository.deleteById(id);
    }
}


