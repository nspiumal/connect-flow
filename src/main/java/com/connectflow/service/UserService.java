package com.connectflow.service;

import com.connectflow.dto.UserDTO;
import com.connectflow.model.User;
import com.connectflow.model.UserRole;
import com.connectflow.repository.UserRepository;
import com.connectflow.repository.UserRoleRepository;
import com.connectflow.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final BranchRepository branchRepository;

    /**
     * Get user by ID
     */
    public Optional<UserDTO> getUserById(UUID id) {
        return userRepository.findById(id).map(this::convertToDTO);
    }

    /**
     * Get user by email
     */
    public Optional<UserDTO> getUserByEmail(String email) {
        return userRepository.findByEmail(email).map(this::convertToDTO);
    }

    /**
     * Get all users
     */
    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Get users by role
     */
    public List<UserDTO> getUsersByRole(UserRole.Role role) {
        return userRoleRepository.findByRole(role).stream()
            .map(userRole -> userRepository.findById(userRole.getUserId()))
            .filter(Optional::isPresent)
            .map(Optional::get)
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Get users in a branch
     */
    public List<UserDTO> getUsersByBranch(UUID branchId) {
        return userRoleRepository.findByBranchId(branchId).stream()
            .map(userRole -> userRepository.findById(userRole.getUserId()))
            .filter(Optional::isPresent)
            .map(Optional::get)
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Authenticate a user by email and password
     */
    public Optional<UserDTO> authenticate(String email, String password) {
        if (email == null || password == null) {
            return Optional.empty();
        }
        String normalizedEmail = email.trim().toLowerCase();
        String normalizedPassword = password.trim();

        return userRepository.findByEmail(normalizedEmail)
            .filter(user -> normalizedPassword.equals(user.getPassword()))
            .map(this::convertToDTO);
    }

    /**
     * Convert User entity to UserDTO
     */
    private UserDTO convertToDTO(User user) {
        // Get user's primary role
        Optional<UserRole> userRole = userRoleRepository.findByUserId(user.getId()).stream().findFirst();

        UserRole.Role role = null;
        String branch = null;

        if (userRole.isPresent()) {
            role = userRole.get().getRole();
            if (userRole.get().getBranchId() != null) {
                branch = branchRepository.findById(userRole.get().getBranchId())
                    .map(b -> b.getName())
                    .orElse(null);
            }
        }

        return UserDTO.builder()
            .id(user.getId())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .phone(user.getPhone())
            .role(role)
            .branch(branch)
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .build();
    }
}
