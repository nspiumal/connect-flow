package com.connectflow.controller;

import com.connectflow.dto.BranchDTO;
import com.connectflow.service.BranchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/branches")
@RequiredArgsConstructor
@Tag(name = "Branches", description = "Branch Management APIs")
public class BranchController {

    private final BranchService branchService;

    @GetMapping
    @Operation(summary = "Get all branches")
    public ResponseEntity<List<BranchDTO>> getAllBranches() {
        List<BranchDTO> branches = branchService.getAllBranches();
        return ResponseEntity.ok(branches);
    }

    @GetMapping("/active")
    @Operation(summary = "Get all active branches")
    public ResponseEntity<List<BranchDTO>> getAllActiveBranches() {
        List<BranchDTO> branches = branchService.getAllActiveBranches();
        return ResponseEntity.ok(branches);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get branch by ID")
    public ResponseEntity<BranchDTO> getBranchById(@PathVariable UUID id) {
        Optional<BranchDTO> branch = branchService.getBranchById(id);
        return branch.map(ResponseEntity::ok)
            .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Create new branch")
    public ResponseEntity<BranchDTO> createBranch(@RequestBody BranchDTO branchDTO) {
        BranchDTO created = branchService.createBranch(branchDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update branch")
    public ResponseEntity<BranchDTO> updateBranch(@PathVariable UUID id, @RequestBody BranchDTO branchDTO) {
        BranchDTO updated = branchService.updateBranch(id, branchDTO);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete branch")
    public ResponseEntity<Void> deleteBranch(@PathVariable UUID id) {
        branchService.deleteBranch(id);
        return ResponseEntity.noContent().build();
    }
}

