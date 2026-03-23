package com.connectflow.dto;

import com.connectflow.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUserRequest {
    private String fullName;
    private String email;
    private String phone;
    private String password;
    private UserRole.Role role;
    private UUID branchId;
}

