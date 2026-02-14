package com.connectflow.dto;

import com.connectflow.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private UUID id;
    private String fullName;
    private String email;
    private String phone;
    private UserRole.Role role;
    private String branch;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}

