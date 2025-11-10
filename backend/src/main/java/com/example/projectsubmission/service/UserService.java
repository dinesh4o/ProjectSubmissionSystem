package com.example.projectsubmission.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.projectsubmission.model.User;
import com.example.projectsubmission.model.UserRole;
import com.example.projectsubmission.repository.UserRepository;

@Service
@Transactional
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public Optional<User> login(String username, String password) {
        return userRepository.findByUsername(username)
                .filter(u -> u.getPassword().equals(password));
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public User create(String username, String password, UserRole role) {
        User user = new User(username, password, role);
        return userRepository.save(user);
    }

    public Optional<User> update(String username, String newUsername, String password, UserRole role) {
        return userRepository.findByUsername(username).map(u -> {
            // If username is changing, we need to delete old and create new (since username is primary key)
            if (newUsername != null && !newUsername.isBlank() && !newUsername.equals(username)) {
                // Check if new username already exists
                if (userRepository.findByUsername(newUsername).isPresent()) {
                    throw new IllegalArgumentException("Username already exists: " + newUsername);
                }
                User newUser = new User(newUsername, 
                    password != null && !password.isBlank() ? password : u.getPassword(),
                    role != null ? role : u.getRole());
                userRepository.deleteById(username);
                return userRepository.save(newUser);
            } else {
                // Username not changing, just update password and role
                if (password != null && !password.isBlank()) {
                    u.setPassword(password);
                }
                if (role != null) {
                    u.setRole(role);
                }
                return userRepository.save(u);
            }
        });
    }

    public void delete(String username) {
        userRepository.deleteById(username);
    }
}


