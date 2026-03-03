package com.connectflow.service;

import com.connectflow.dto.BlacklistDTO;
import com.connectflow.dto.CustomerDTO;
import com.connectflow.dto.NicVerificationResponseDTO;
import com.connectflow.dto.PageResponse;
import com.connectflow.model.Blacklist;
import com.connectflow.model.Customer;
import com.connectflow.repository.BlacklistRepository;
import com.connectflow.repository.BranchRepository;
import com.connectflow.repository.CustomerRepository;
import com.connectflow.repository.UserRepository;
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
public class BlacklistService {

    private final BlacklistRepository blacklistRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;

    public List<BlacklistDTO> getAllBlacklisted() {
        return blacklistRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Get all blacklisted customers with pagination
     */
    public PageResponse<BlacklistDTO> getAllBlacklistedPaginated(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
            ? Sort.by(sortBy).descending()
            : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Blacklist> blacklistPage = blacklistRepository.findAll(pageable);

        List<BlacklistDTO> content = blacklistPage.getContent().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());

        return new PageResponse<>(
            content,
            blacklistPage.getNumber(),
            blacklistPage.getSize(),
            blacklistPage.getTotalElements(),
            blacklistPage.getTotalPages(),
            blacklistPage.isLast()
        );
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

    /**
     * Verify NIC - Check blocklist first, then fetch customer data if not blocked
     * This is a single API call for the transaction creation wizard
     */
    public NicVerificationResponseDTO verifyNic(String nic) {
        // Step 1: Check if NIC is blocked
        List<Blacklist> blockedEntries = blacklistRepository.findByCustomerNicAndIsActiveTrue(nic);

        if (!blockedEntries.isEmpty()) {
            // Customer is blocked - return blocked status with reason
            Blacklist firstBlock = blockedEntries.get(0);
            return NicVerificationResponseDTO.builder()
                .isBlocked(true)
                .blocklistReason(firstBlock.getReason())
                .customer(null)
                .message("Customer is blocked: " + firstBlock.getReason())
                .build();
        }

        // Step 2: NIC is not blocked - fetch customer data if exists
        Optional<Customer> customerOpt = customerRepository.findByNic(nic);

        if (customerOpt.isPresent()) {
            Customer customer = customerOpt.get();
            CustomerDTO customerDTO = CustomerDTO.builder()
                .id(customer.getId())
                .fullName(customer.getFullName())
                .nic(customer.getNic())
                .phone(customer.getPhone())
                .address(customer.getAddress())
                .customerType(customer.getCustomerType())
                .isActive(customer.getIsActive())
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();

            return NicVerificationResponseDTO.builder()
                .isBlocked(false)
                .blocklistReason(null)
                .customer(customerDTO)
                .message("Customer found and not blocked")
                .build();
        } else {
            // Customer doesn't exist yet - return success with null customer
            return NicVerificationResponseDTO.builder()
                .isBlocked(false)
                .blocklistReason(null)
                .customer(null)
                .message("NIC verified - no existing customer record")
                .build();
        }
    }

    /**
     * Search blacklisted customers by NIC with pagination
     */
    public PageResponse<BlacklistDTO> searchByNic(String nic, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
            ? Sort.by(sortBy).descending()
            : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Blacklist> blacklistPage = blacklistRepository.findByCustomerNicContainingIgnoreCase(nic, pageable);

        List<BlacklistDTO> content = blacklistPage.getContent().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());

        return new PageResponse<>(
            content,
            blacklistPage.getNumber(),
            blacklistPage.getSize(),
            blacklistPage.getTotalElements(),
            blacklistPage.getTotalPages(),
            blacklistPage.isLast()
        );
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

