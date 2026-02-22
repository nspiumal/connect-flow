package com.connectflow.service;

import com.connectflow.dto.CreateUserRequest;
import com.connectflow.dto.PageResponse;
import com.connectflow.dto.UserDTO;
import com.connectflow.model.User;
import com.connectflow.model.UserRole;
import com.connectflow.repository.UserRepository;
import com.connectflow.repository.UserRoleRepository;
import com.connectflow.repository.BranchRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
     * Get all users with pagination
     */
    public PageResponse<UserDTO> getAllUsersPaginated(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
            ? Sort.by(sortBy).descending()
            : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<User> userPage = userRepository.findAll(pageable);

        List<UserDTO> content = userPage.getContent().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());

        return new PageResponse<>(
            content,
            userPage.getNumber(),
            userPage.getSize(),
            userPage.getTotalElements(),
            userPage.getTotalPages(),
            userPage.isLast()
        );
    }

    /**
     * Create a new user with role and branch assignment
     */
    public UserDTO createUser(CreateUserRequest request) {
        // Validate required fields
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }
        if (request.getFullName() == null || request.getFullName().trim().isEmpty()) {
            throw new IllegalArgumentException("Full name is required");
        }
        if (request.getRole() == null) {
            throw new IllegalArgumentException("Role is required");
        }

        // Check if email already exists
        if (userRepository.findByEmail(request.getEmail().trim().toLowerCase()).isPresent()) {
            throw new IllegalArgumentException("Email already exists");
        }

        // Create the user
        User user = User.builder()
            .id(UUID.randomUUID())
            .fullName(request.getFullName().trim())
            .email(request.getEmail().trim().toLowerCase())
            .phone(request.getPhone())
            .password(request.getPassword().trim())
            .build();

        User savedUser = userRepository.save(user);

        // Create user role assignment
        UserRole userRole = UserRole.builder()
            .userId(savedUser.getId())
            .role(request.getRole())
            .branchId(request.getBranchId())
            .build();

        userRoleRepository.save(userRole);

        return convertToDTO(savedUser);
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
     * Set PIN for a user (typically for branch managers)
     */
    public UserDTO setPin(UUID userId, String pin) {
        if (pin == null || pin.trim().isEmpty()) {
            throw new IllegalArgumentException("PIN cannot be empty");
        }
        if (!pin.matches("^\\d{4,6}$")) {
            throw new IllegalArgumentException("PIN must be 4-6 digits");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        user.setPin(pin.trim());
        User updated = userRepository.save(user);
        return convertToDTO(updated);
    }

    /**
     * Verify PIN for a user
     */
    public boolean verifyPin(UUID userId, String pin) {
        if (pin == null || pin.trim().isEmpty()) {
            throw new IllegalArgumentException("PIN cannot be empty");
        }

        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        if (user.getPin() == null || user.getPin().trim().isEmpty()) {
            throw new RuntimeException("User does not have a PIN set");
        }

        return pin.trim().equals(user.getPin());
    }

    /**
     * Check if user has a PIN set
     */
    public boolean hasPinSet(UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        return user.getPin() != null && !user.getPin().trim().isEmpty();
    }

    /**
     * Convert User entity to UserDTO
     */
    private UserDTO convertToDTO(User user) {
        // Get user's primary role
        Optional<UserRole> userRole = userRoleRepository.findByUserId(user.getId()).stream().findFirst();

        UserRole.Role role = null;
        UUID branchId = null;
        String branch = null;

        if (userRole.isPresent()) {
            role = userRole.get().getRole();
            if (userRole.get().getBranchId() != null) {
                branchId = userRole.get().getBranchId();
                branch = branchRepository.findById(branchId)
                    .map(com.connectflow.model.Branch::getName)
                    .orElse(null);
            }
        }

        return UserDTO.builder()
            .id(user.getId())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .phone(user.getPhone())
            .role(role)
            .branchId(branchId)
            .branch(branch)
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .build();
    }
}
