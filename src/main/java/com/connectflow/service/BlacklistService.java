package com.connectflow.service;

import com.connectflow.dto.BlacklistDTO;
import com.connectflow.model.Blacklist;
import com.connectflow.model.Branch;
import com.connectflow.model.User;
import com.connectflow.repository.BlacklistRepository;
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
public class BlacklistService {

    private final BlacklistRepository blacklistRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;

    public List<BlacklistDTO> getAllBlacklisted() {
        return blacklistRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<BlacklistDTO> getActiveBlacklisted() {
        return blacklistRepository.findByIsActiveTrue().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public Optional<BlacklistDTO> getById(UUID id) {
        return blacklistRepository.findById(id).map(this::convertToDTO);
    }

    public List<BlacklistDTO> getByBranch(UUID branchId) {
        return blacklistRepository.findByBranchId(branchId).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public List<BlacklistDTO> checkByNic(String nic) {
        return blacklistRepository.findByCustomerNicAndIsActiveTrue(nic).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    public BlacklistDTO addToBlacklist(BlacklistDTO dto) {
        Blacklist blacklist = Blacklist.builder()
            .customerName(dto.getCustomerName())
            .customerNic(dto.getCustomerNic())
            .reason(dto.getReason())
            .policeReportNumber(dto.getPoliceReportNumber())
            .policeReportDate(dto.getPoliceReportDate())
            .branchId(dto.getBranchId())
            .addedBy(dto.getAddedBy())
            .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
            .build();

        Blacklist saved = blacklistRepository.save(blacklist);
        return convertToDTO(saved);
    }

    public BlacklistDTO updateBlacklist(UUID id, BlacklistDTO dto) {
        Blacklist blacklist = blacklistRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Blacklist entry not found with id: " + id));

        blacklist.setCustomerName(dto.getCustomerName());
        blacklist.setCustomerNic(dto.getCustomerNic());
        blacklist.setReason(dto.getReason());
        blacklist.setPoliceReportNumber(dto.getPoliceReportNumber());
        blacklist.setPoliceReportDate(dto.getPoliceReportDate());
        if (dto.getIsActive() != null) {
            blacklist.setIsActive(dto.getIsActive());
        }

        Blacklist updated = blacklistRepository.save(blacklist);
        return convertToDTO(updated);
    }

    public void toggleActive(UUID id) {
        Blacklist blacklist = blacklistRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Blacklist entry not found with id: " + id));

        blacklist.setIsActive(!blacklist.getIsActive());
        blacklistRepository.save(blacklist);
    }

    public void deleteBlacklist(UUID id) {
        blacklistRepository.deleteById(id);
    }

    private BlacklistDTO convertToDTO(Blacklist blacklist) {
        BlacklistDTO dto = BlacklistDTO.builder()
            .id(blacklist.getId())
            .customerName(blacklist.getCustomerName())
            .customerNic(blacklist.getCustomerNic())
            .reason(blacklist.getReason())
            .policeReportNumber(blacklist.getPoliceReportNumber())
            .policeReportDate(blacklist.getPoliceReportDate())
            .branchId(blacklist.getBranchId())
            .addedBy(blacklist.getAddedBy())
            .isActive(blacklist.getIsActive())
            .createdAt(blacklist.getCreatedAt())
            .build();

        // Fetch branch name
        if (blacklist.getBranchId() != null) {
            branchRepository.findById(blacklist.getBranchId())
                .ifPresent(branch -> dto.setBranchName(branch.getName()));
        }

        // Fetch user name
        if (blacklist.getAddedBy() != null) {
            userRepository.findById(blacklist.getAddedBy())
                .ifPresent(user -> dto.setAddedByName(user.getFullName()));
        }

        return dto;
    }
}

