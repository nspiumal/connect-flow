package com.connectflow.controller;

import com.connectflow.dto.LoginRequest;
import com.connectflow.dto.LoginResponse;
import com.connectflow.dto.UserDTO;
import com.connectflow.service.UserService;
import com.connectflow.security.JwtService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@Tag(name = "Auth", description = "Authentication APIs")
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;

    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        Optional<UserDTO> user = userService.authenticate(request.getEmail(), request.getPassword());
        if (user.isPresent()) {
            String token = jwtService.generateToken(user.get().getEmail());
            return ResponseEntity.ok(new LoginResponse(user.get(), token));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}
