package com.connectflow.service;

import com.connectflow.dto.PageResponse;
import com.connectflow.dto.SetProfitRequest;
import com.connectflow.dto.TransactionProfitDTO;
import com.connectflow.model.Customer;
import com.connectflow.model.PawnTransaction;
import com.connectflow.model.TransactionProfit;
import com.connectflow.model.User;
import com.connectflow.repository.PawnTransactionRepository;
import com.connectflow.repository.TransactionProfitRepository;
import com.connectflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class TransactionProfitService {

    private final TransactionProfitRepository transactionProfitRepository;
    private final PawnTransactionRepository pawnTransactionRepository;
    private final UserRepository userRepository;

    /**
     * Set transaction as profited
     */
    public TransactionProfitDTO setProfitForTransaction(UUID transactionId, SetProfitRequest request, UUID userId) {
        log.info("Setting profit for transaction: {}", transactionId);

        PawnTransaction transaction = pawnTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if profit already recorded for this transaction
        Optional<TransactionProfit> existingProfit = transactionProfitRepository.findByTransactionId(transactionId);
        if (existingProfit.isPresent()) {
            log.warn("Profit already recorded for transaction: {}", transactionId);
            throw new RuntimeException("Profit already recorded for this transaction");
        }

        TransactionProfit profit = TransactionProfit.builder()
                .transactionId(transactionId)
                .profitAmount(request.getProfitAmount())
                .profitNotes(request.getNotes())
                .profitRecordedDate(LocalDateTime.now())
                .profitRecordedBy(userId)
                .build();

        TransactionProfit savedProfit = transactionProfitRepository.save(profit);
        log.info("Profit set successfully for transaction: {}", transactionId);

        return convertToDTO(savedProfit, transaction, user);
    }

    /**
     * Get profit record by transaction ID
     */
    public Optional<TransactionProfitDTO> getProfitByTransactionId(UUID transactionId) {
        log.info("Getting profit for transaction: {}", transactionId);
        return transactionProfitRepository.findByTransactionId(transactionId)
                .map(profit -> {
                    PawnTransaction transaction = pawnTransactionRepository.findById(profit.getTransactionId()).orElse(null);
                    User user = userRepository.findById(profit.getProfitRecordedBy()).orElse(null);
                    return convertToDTO(profit, transaction, user);
                });
    }

    /**
     * Get all profited transactions
     */
    public List<TransactionProfitDTO> getAllProfitedTransactions() {
        log.info("Fetching all profited transactions");
        return transactionProfitRepository.findAllByOrderByProfitRecordedDateDesc()
                .stream()
                .map(profit -> {
                    PawnTransaction transaction = pawnTransactionRepository.findById(profit.getTransactionId()).orElse(null);
                    User user = userRepository.findById(profit.getProfitRecordedBy()).orElse(null);
                    return convertToDTO(profit, transaction, user);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get all profited transactions with pagination
     */
    public PageResponse<TransactionProfitDTO> getAllProfitedTransactionsPaginated(
            int page, int size, String sortBy, String sortDir) {
        log.info("Fetching profited transactions - page: {}, size: {}", page, size);

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<TransactionProfit> profitPage = transactionProfitRepository.findAll(pageable);

        List<TransactionProfitDTO> content = profitPage.getContent().stream()
                .map(profit -> {
                    PawnTransaction transaction = pawnTransactionRepository.findById(profit.getTransactionId()).orElse(null);
                    User user = userRepository.findById(profit.getProfitRecordedBy()).orElse(null);
                    return convertToDTO(profit, transaction, user);
                })
                .collect(Collectors.toList());

        return new PageResponse<>(
                content,
                profitPage.getNumber(),
                profitPage.getSize(),
                profitPage.getTotalElements(),
                profitPage.getTotalPages(),
                profitPage.isLast()
        );
    }

    /**
     * Search profited transactions with filters
     */
    public PageResponse<TransactionProfitDTO> searchProfitedTransactions(
            String pawnId,
            String customerNic,
            int page,
            int size,
            String sortBy,
            String sortDir) {
        log.info("Searching profited transactions - pawnId: {}, nic: {}", pawnId, customerNic);

        List<TransactionProfit> allProfits = transactionProfitRepository.findAll();

        List<TransactionProfitDTO> filtered = allProfits.stream()
                .map(profit -> {
                    PawnTransaction transaction = pawnTransactionRepository.findById(profit.getTransactionId()).orElse(null);
                    User user = userRepository.findById(profit.getProfitRecordedBy()).orElse(null);
                    return convertToDTO(profit, transaction, user);
                })
                .filter(dto -> {
                    if (pawnId != null && !pawnId.isEmpty()) {
                        if (dto.getPawnId() == null || !dto.getPawnId().toLowerCase().contains(pawnId.toLowerCase())) {
                            return false;
                        }
                    }
                    if (customerNic != null && !customerNic.isEmpty()) {
                        if (dto.getCustomerNic() == null || !dto.getCustomerNic().toLowerCase().contains(customerNic.toLowerCase())) {
                            return false;
                        }
                    }
                    return true;
                })
                .sorted((a, b) -> sortDir.equalsIgnoreCase("desc")
                        ? b.getProfitRecordedDate().compareTo(a.getProfitRecordedDate())
                        : a.getProfitRecordedDate().compareTo(b.getProfitRecordedDate()))
                .skip((long) page * size)
                .limit(size)
                .collect(Collectors.toList());

        return new PageResponse<>(
                filtered,
                page,
                size,
                allProfits.size(),
                (allProfits.size() + size - 1) / size,
                (page + 1) * size >= allProfits.size()
        );
    }

    /**
     * Convert to DTO
     */
    private TransactionProfitDTO convertToDTO(TransactionProfit profit, PawnTransaction transaction, User user) {
        Customer customer = transaction != null ? transaction.getCustomer() : null;

        return TransactionProfitDTO.builder()
                .id(profit.getId())
                .transactionId(profit.getTransactionId())
                .pawnId(transaction != null ? transaction.getPawnId() : null)
                .customerName(customer != null ? customer.getFullName() : null)
                .customerNic(customer != null ? customer.getNic() : null)
                .profitAmount(profit.getProfitAmount())
                .profitNotes(profit.getProfitNotes())
                .profitRecordedDate(profit.getProfitRecordedDate())
                .profitRecordedBy(profit.getProfitRecordedBy())
                .recordedByName(user != null ? user.getFullName() : null)
                .createdAt(profit.getCreatedAt())
                .updatedAt(profit.getUpdatedAt())
                .build();
    }
}

