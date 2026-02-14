package com.connectflow.config;

import com.connectflow.model.Branch;
import com.connectflow.model.User;
import com.connectflow.model.UserRole;
import com.connectflow.repository.BranchRepository;
import com.connectflow.repository.UserRepository;
import com.connectflow.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.util.UUID;

@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) {
            return;
        }

        // Create branches
        Branch mainBranch = branchRepository.save(Branch.builder()
            .name("Main Branch")
            .address("123 Main Street")
            .phone("+1-555-1000")
            .isActive(true)
            .build());

        Branch eastBranch = branchRepository.save(Branch.builder()
            .name("East Branch")
            .address("456 East Avenue")
            .phone("+1-555-1001")
            .isActive(true)
            .build());

        // Create users
        User superAdmin = userRepository.save(User.builder()
            .id(UUID.randomUUID())
            .fullName("Super Administrator")
            .email("superadmin@connectflow.com")
            .phone("+1-555-0100")
            .password("SuperAdmin@123")
            .build());

        User admin = userRepository.save(User.builder()
            .id(UUID.randomUUID())
            .fullName("System Administrator")
            .email("admin@connectflow.com")
            .phone("+1-555-0101")
            .password("Admin@123")
            .build());

        User manager = userRepository.save(User.builder()
            .id(UUID.randomUUID())
            .fullName("Branch Manager")
            .email("manager@connectflow.com")
            .phone("+1-555-0102")
            .password("Manager@123")
            .build());

        User staff = userRepository.save(User.builder()
            .id(UUID.randomUUID())
            .fullName("Staff Member")
            .email("staff@connectflow.com")
            .phone("+1-555-0103")
            .password("Staff@123")
            .build());

        // Assign roles
        userRoleRepository.save(UserRole.builder()
            .userId(superAdmin.getId())
            .role(UserRole.Role.SUPERADMIN)
            .build());

        userRoleRepository.save(UserRole.builder()
            .userId(admin.getId())
            .role(UserRole.Role.ADMIN)
            .build());

        userRoleRepository.save(UserRole.builder()
            .userId(manager.getId())
            .role(UserRole.Role.MANAGER)
            .branchId(mainBranch.getId())
            .build());

        userRoleRepository.save(UserRole.builder()
            .userId(staff.getId())
            .role(UserRole.Role.STAFF)
            .branchId(eastBranch.getId())
            .build());
    }
}

