package com.connectflow.service;

import com.connectflow.dto.BranchDTO;
import com.connectflow.model.Branch;
import com.connectflow.repository.BranchRepository;
import com.connectflow.repository.UserRepository;
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
public class BranchService {

    private final BranchRepository branchRepository;
    private final UserRepository userRepository;

    /**
     * Get all active branches
     */
    public List<BranchDTO> getAllActiveBranches() {
        return branchRepository.findByIsActiveTrueOrderByName().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Get all branches
     */
    public List<BranchDTO> getAllBranches() {
        return branchRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Get branch by ID
     */
    public Optional<BranchDTO> getBranchById(UUID id) {
        return branchRepository.findById(id).map(this::convertToDTO);
    }

    /**
     * Create new branch
     */
    public BranchDTO createBranch(BranchDTO branchDTO) {
        Branch branch = Branch.builder()
            .name(branchDTO.getName())
            .address(branchDTO.getAddress())
            .phone(branchDTO.getPhone())
            .managerId(branchDTO.getManagerId())
            .isActive(branchDTO.getIsActive() != null ? branchDTO.getIsActive() : true)
            .build();

        Branch saved = branchRepository.save(branch);
        return convertToDTO(saved);
    }

    /**
     * Update branch
     */
    public BranchDTO updateBranch(UUID id, BranchDTO branchDTO) {
        Branch branch = branchRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Branch not found"));

        if (branchDTO.getName() != null) branch.setName(branchDTO.getName());
        if (branchDTO.getAddress() != null) branch.setAddress(branchDTO.getAddress());
        if (branchDTO.getPhone() != null) branch.setPhone(branchDTO.getPhone());
        if (branchDTO.getManagerId() != null) branch.setManagerId(branchDTO.getManagerId());
        if (branchDTO.getIsActive() != null) branch.setIsActive(branchDTO.getIsActive());

        Branch updated = branchRepository.save(branch);
        return convertToDTO(updated);
    }

    /**
     * Delete branch
     */
    public void deleteBranch(UUID id) {
        branchRepository.deleteById(id);
    }

    /**
     * Convert Branch entity to BranchDTO
     */
    private BranchDTO convertToDTO(Branch branch) {
        String managerName = branch.getManagerId() != null
            ? userRepository.findById(branch.getManagerId())
                .map(u -> u.getFullName())
                .orElse(null)
            : null;

        return BranchDTO.builder()
            .id(branch.getId())
            .name(branch.getName())
            .address(branch.getAddress())
            .phone(branch.getPhone())
            .managerId(branch.getManagerId())
            .managerName(managerName)
            .isActive(branch.getIsActive())
            .createdAt(branch.getCreatedAt())
            .updatedAt(branch.getUpdatedAt())
            .build();
    }
}

