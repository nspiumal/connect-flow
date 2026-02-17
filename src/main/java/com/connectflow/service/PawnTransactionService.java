package com.connectflow.service;

import com.connectflow.dto.BlacklistDTO;
import com.connectflow.dto.CreatePawnTransactionRequest;
import com.connectflow.dto.PageResponse;
import com.connectflow.dto.PawnTransactionDTO;
import com.connectflow.model.Customer;
import com.connectflow.model.PawnTransaction;
import com.connectflow.repository.BranchRepository;
import com.connectflow.repository.CustomerRepository;
import com.connectflow.repository.InterestRateRepository;
import com.connectflow.repository.PawnTransactionRepository;
import com.connectflow.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PawnTransactionService {

    private final PawnTransactionRepository pawnTransactionRepository;
    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final InterestRateRepository interestRateRepository;
    private final BlacklistService blacklistService;
    private final ObjectMapper objectMapper;
    private final AtomicInteger pawnIdCounter = new AtomicInteger(1);

    /**
     * Get all transactions
     */
    public List<PawnTransactionDTO> getAllTransactions() {
        return pawnTransactionRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get transactions with pagination
     */
    public PageResponse<PawnTransactionDTO> getAllTransactionsPaginated(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<PawnTransaction> transactionPage = pawnTransactionRepository.findAll(pageable);

        List<PawnTransactionDTO> content = transactionPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new PageResponse<>(
                content,
                transactionPage.getNumber(),
                transactionPage.getSize(),
                transactionPage.getTotalElements(),
                transactionPage.getTotalPages(),
                transactionPage.isLast()
        );
    }

    /**
     * Get transaction by ID
     */
    public Optional<PawnTransactionDTO> getTransactionById(UUID id) {
        return pawnTransactionRepository.findById(id).map(this::convertToDTO);
    }

    /**
     * Get transaction by pawn ID
     */
    public Optional<PawnTransactionDTO> getTransactionByPawnId(String pawnId) {
        return pawnTransactionRepository.findByPawnId(pawnId).map(this::convertToDTO);
    }

    /**
     * Get transactions by branch
     */
    public List<PawnTransactionDTO> getTransactionsByBranch(UUID branchId) {
        return pawnTransactionRepository.findByBranchId(branchId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    /**
     * Get transactions by branch with pagination
     */
    public PageResponse<PawnTransactionDTO> getTransactionsByBranchPaginated(UUID branchId, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<PawnTransaction> transactionPage = pawnTransactionRepository.findByBranchId(branchId, pageable);

        List<PawnTransactionDTO> content = transactionPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new PageResponse<>(
                content,
                transactionPage.getNumber(),
                transactionPage.getSize(),
                transactionPage.getTotalElements(),
                transactionPage.getTotalPages(),
                transactionPage.isLast()
        );
    }

    /**
     * Get transactions by status
     */
    public PageResponse<PawnTransactionDTO> getTransactionsByStatus(String status, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<PawnTransaction> transactionPage = pawnTransactionRepository.findByStatus(status, pageable);

        List<PawnTransactionDTO> content = transactionPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new PageResponse<>(
                content,
                transactionPage.getNumber(),
                transactionPage.getSize(),
                transactionPage.getTotalElements(),
                transactionPage.getTotalPages(),
                transactionPage.isLast()
        );
    }

    /**
     * Search transactions
     */
    public PageResponse<PawnTransactionDTO> searchTransactions(String search, UUID branchId, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<PawnTransaction> transactionPage;

        if (branchId != null) {
            transactionPage = pawnTransactionRepository.searchTransactionsByBranch(branchId, search, pageable);
        } else {
            transactionPage = pawnTransactionRepository.searchTransactions(search, pageable);
        }

        List<PawnTransactionDTO> content = transactionPage.getContent().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return new PageResponse<>(
                content,
                transactionPage.getNumber(),
                transactionPage.getSize(),
                transactionPage.getTotalElements(),
                transactionPage.getTotalPages(),
                transactionPage.isLast()
        );
    }

    /**
     * Create new pawn transaction
     * Automatically creates or updates customer record
     * Checks if customer is blacklisted before creation
     */
    public PawnTransactionDTO createTransaction(CreatePawnTransactionRequest request, UUID branchId, UUID createdBy) {
        // Validate required fields
        if (request.getCustomerName() == null || request.getCustomerName().trim().isEmpty()) {
            throw new IllegalArgumentException("Customer name is required");
        }
        if (request.getCustomerNic() == null || request.getCustomerNic().trim().isEmpty()) {
            throw new IllegalArgumentException("Customer NIC is required");
        }
        if (request.getItemDescription() == null || request.getItemDescription().trim().isEmpty()) {
            throw new IllegalArgumentException("Item description is required");
        }

        // ✅ CHECK BLACKLIST BY NIC
        String nic = request.getCustomerNic().trim();
        List<BlacklistDTO> blacklistedByNic = blacklistService.checkByNic(nic);
        if (!blacklistedByNic.isEmpty()) {
            log.warn("Customer with NIC {} is blacklisted. Blocking transaction creation.", nic);
            throw new IllegalArgumentException("Customer is blacklisted. Cannot create transaction for NIC: " + nic + ". Reason: " + blacklistedByNic.get(0).getReason());
        }

        // ✅ CHECK BLACKLIST BY MOBILE NUMBER (if provided)
        if (request.getCustomerPhone() != null && !request.getCustomerPhone().trim().isEmpty()) {
            String phone = request.getCustomerPhone().trim();
            // Note: This would require adding a phone-based search to BlacklistService
            // For now, we log this for manual review
            log.info("Blacklist check for phone {} would be performed if implemented", phone);
        }

        // Log customer creation via pawn transaction
        log.info("Creating pawn transaction with customer details - Name: {}, NIC: {}, Type: {}",
                request.getCustomerName(), request.getCustomerNic(), request.getCustomerType());

        // Create or update customer
        Customer customer = createOrUpdateCustomer(request);
        log.info("Customer created/updated with ID: {}", customer.getId());

        // Generate pawn ID
        String pawnId = generatePawnId();

        // Calculate dates if not provided
        java.time.LocalDate pawnDate = request.getPawnDate();
        java.time.LocalDate maturityDate = request.getMaturityDate();

        if (pawnDate == null) {
            pawnDate = java.time.LocalDate.now();
            log.info("Pawn date not provided, using today: {}", pawnDate);
        }

        if (maturityDate == null && request.getPeriodMonths() != null) {
            maturityDate = pawnDate.plusMonths(request.getPeriodMonths());
            log.info("Maturity date not provided, calculated: {}", maturityDate);
        }

        // Get interest rate percent - use provided value or fetch from database
        java.math.BigDecimal interestRatePercent = request.getInterestRatePercent();
        if (interestRatePercent == null && request.getInterestRateId() != null) {
            log.info("Interest rate percent not provided, fetching from database for rate ID: {}", request.getInterestRateId());
            var optionalRate = interestRateRepository.findById(request.getInterestRateId());
            if (optionalRate.isPresent()) {
                interestRatePercent = optionalRate.get().getRatePercent();
                log.info("Fetched interest rate percent: {}", interestRatePercent);
            } else {
                log.warn("Interest rate not found for ID: {}", request.getInterestRateId());
                // Use default if not found
                interestRatePercent = new java.math.BigDecimal("8.50");
            }
        }

        if (interestRatePercent == null) {
            // Final fallback
            interestRatePercent = new java.math.BigDecimal("8.50");
            log.warn("No interest rate percent available, using default: {}", interestRatePercent);
        }

        // Convert image URLs list to JSON string
        String imageUrlsJson = null;
        if (request.getImageUrls() != null && !request.getImageUrls().isEmpty()) {
            try {
                imageUrlsJson = objectMapper.writeValueAsString(request.getImageUrls());
            } catch (JsonProcessingException e) {
                log.error("Failed to serialize image URLs", e);
            }
        }

        PawnTransaction transaction = PawnTransaction.builder()
                .pawnId(pawnId)
                .branchId(branchId)
                .customerId(customer.getId()) // Link to customer
                .customer(customer) // Set customer reference
                .customerName(request.getCustomerName().trim())
                .customerNic(request.getCustomerNic().trim())
                .customerAddress(request.getCustomerAddress())
                .customerPhone(request.getCustomerPhone())
                .customerType(request.getCustomerType() != null ? request.getCustomerType() : "Regular")
                .itemDescription(request.getItemDescription().trim())
                .itemWeightGrams(request.getItemWeightGrams())
                .itemKarat(request.getItemKarat() != null ? request.getItemKarat() : 24)
                .appraisedValue(request.getAppraisedValue())
                .loanAmount(request.getLoanAmount())
                .interestRateId(request.getInterestRateId())
                .interestRatePercent(interestRatePercent) // Use resolved rate percent
                .periodMonths(request.getPeriodMonths() != null ? request.getPeriodMonths() : 6)
                .pawnDate(pawnDate)
                .maturityDate(maturityDate)
                .status("Active")
                .remarks(request.getRemarks())
                .imageUrls(imageUrlsJson)
                .createdBy(createdBy)
                .build();

        PawnTransaction saved = pawnTransactionRepository.save(transaction);
        return convertToDTO(saved);
    }

    /**
     * Create or update customer based on NIC
     */
    private Customer createOrUpdateCustomer(CreatePawnTransactionRequest request) {
        // Check if customer exists by NIC
        Optional<Customer> existingCustomer = customerRepository.findByNic(request.getCustomerNic());

        if (existingCustomer.isPresent()) {
            // Update existing customer
            Customer customer = existingCustomer.get();
            customer.setFullName(request.getCustomerName().trim());
            customer.setPhone(request.getCustomerPhone());
            customer.setAddress(request.getCustomerAddress());
            customer.setCustomerType(request.getCustomerType() != null ? request.getCustomerType() : "Regular");
            customer.setIsActive(true);
            log.info("Updated existing customer with NIC: {}", request.getCustomerNic());
            return customerRepository.save(customer);
        } else {
            // Create new customer
            Customer newCustomer = Customer.builder()
                    .fullName(request.getCustomerName().trim())
                    .nic(request.getCustomerNic().trim())
                    .phone(request.getCustomerPhone())
                    .address(request.getCustomerAddress())
                    .customerType(request.getCustomerType() != null ? request.getCustomerType() : "Regular")
                    .isActive(true)
                    .build();
            log.info("Created new customer with NIC: {}", request.getCustomerNic());
            return customerRepository.save(newCustomer);
        }
    }

    /**
     * Update transaction status
     */
    public PawnTransactionDTO updateTransactionStatus(UUID id, String status) {
        PawnTransaction transaction = pawnTransactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + id));

        transaction.setStatus(status);
        PawnTransaction updated = pawnTransactionRepository.save(transaction);
        return convertToDTO(updated);
    }

    /**
     * Update transaction remarks
     */
    public PawnTransactionDTO updateTransactionRemarks(UUID id, String remarks) {
        PawnTransaction transaction = pawnTransactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + id));

        transaction.setRemarks(remarks);
        PawnTransaction updated = pawnTransactionRepository.save(transaction);
        return convertToDTO(updated);
    }

    /**
     * Update transaction block reason and automatically add customer to blacklist with optional police report
     */
    public PawnTransactionDTO updateBlockReason(UUID id, String blockReason, String policeReportNumber,
                                                 String policeReportDate, UUID branchId, UUID userId) {
        PawnTransaction transaction = pawnTransactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found with id: " + id));

        transaction.setStatus("Blocked");
        PawnTransaction updated = pawnTransactionRepository.save(transaction);
        log.info("Transaction {} blocked with reason: {}", id, blockReason);

        // Automatically add customer to blacklist with police report details
        try {
            BlacklistDTO blacklistEntry = new BlacklistDTO();
            blacklistEntry.setCustomerName(transaction.getCustomerName());
            blacklistEntry.setCustomerNic(transaction.getCustomerNic());
            blacklistEntry.setReason(blockReason);
            blacklistEntry.setPoliceReportNumber(policeReportNumber);

            // Convert policeReportDate string to LocalDate if provided
            if (policeReportDate != null && !policeReportDate.trim().isEmpty()) {
                try {
                    blacklistEntry.setPoliceReportDate(java.time.LocalDate.parse(policeReportDate));
                } catch (Exception e) {
                    log.warn("Failed to parse police report date: {}", policeReportDate);
                }
            }

            blacklistEntry.setBranchId(branchId);
            blacklistEntry.setAddedBy(userId);
            blacklistEntry.setIsActive(true);

            blacklistService.addToBlacklist(blacklistEntry);
            log.info("Customer {} added to blacklist with reason: {}, police report: {}",
                    transaction.getCustomerNic(), blockReason, policeReportNumber);
        } catch (Exception e) {
            log.error("Failed to add customer to blacklist: {}", e.getMessage());
            // Continue even if blacklist fails - transaction is still blocked
        }

        return convertToDTO(updated);
    }

    /**
     * Generate unique pawn ID
     */
    private synchronized String generatePawnId() {
        // Get the highest pawn ID number from database
        List<PawnTransaction> allTransactions = pawnTransactionRepository.findAll();
        int maxNumber = 0;

        for (PawnTransaction t : allTransactions) {
            if (t.getPawnId() != null && t.getPawnId().startsWith("PW")) {
                try {
                    String numberPart = t.getPawnId().substring(2);
                    int number = Integer.parseInt(numberPart);
                    if (number > maxNumber) {
                        maxNumber = number;
                    }
                } catch (Exception e) {
                    log.warn("Could not parse pawn ID: {}", t.getPawnId());
                }
            }
        }

        int nextNumber = maxNumber + 1;
        return String.format("PW%04d", nextNumber);
    }

    /**
     * Convert entity to DTO
     */
    private PawnTransactionDTO convertToDTO(PawnTransaction transaction) {
        // Parse image URLs from JSON
        List<String> imageUrls = new ArrayList<>();
        if (transaction.getImageUrls() != null && !transaction.getImageUrls().isEmpty()) {
            try {
                imageUrls = objectMapper.readValue(transaction.getImageUrls(), new TypeReference<List<String>>() {});
            } catch (JsonProcessingException e) {
                log.error("Failed to parse image URLs", e);
            }
        }

        // Get branch name
        String branchName = branchRepository.findById(transaction.getBranchId())
                .map(b -> b.getName())
                .orElse(null);

        // Get creator name
        String createdByName = userRepository.findById(transaction.getCreatedBy())
                .map(u -> u.getFullName())
                .orElse(null);

        // Get interest rate name
        String interestRateName = null;
        if (transaction.getInterestRateId() != null) {
            interestRateName = interestRateRepository.findById(transaction.getInterestRateId())
                    .map(r -> r.getName())
                    .orElse(null);
        }

        return PawnTransactionDTO.builder()
                .id(transaction.getId())
                .pawnId(transaction.getPawnId())
                .branchId(transaction.getBranchId())
                .branchName(branchName)
                .customerName(transaction.getCustomerName())
                .customerNic(transaction.getCustomerNic())
                .customerAddress(transaction.getCustomerAddress())
                .customerPhone(transaction.getCustomerPhone())
                .customerType(transaction.getCustomerType())
                .itemDescription(transaction.getItemDescription())
                .itemWeightGrams(transaction.getItemWeightGrams())
                .itemKarat(transaction.getItemKarat())
                .appraisedValue(transaction.getAppraisedValue())
                .loanAmount(transaction.getLoanAmount())
                .interestRateId(transaction.getInterestRateId())
                .interestRateName(interestRateName)
                .interestRatePercent(transaction.getInterestRatePercent())
                .periodMonths(transaction.getPeriodMonths())
                .pawnDate(transaction.getPawnDate())
                .maturityDate(transaction.getMaturityDate())
                .status(transaction.getStatus())
                .remarks(transaction.getRemarks())
                .imageUrls(imageUrls)
                .createdBy(transaction.getCreatedBy())
                .createdByName(createdByName)
                .createdAt(transaction.getCreatedAt())
                .updatedAt(transaction.getUpdatedAt())
                .build();
    }
}

