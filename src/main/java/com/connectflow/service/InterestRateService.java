package com.connectflow.service;

import com.connectflow.dto.InterestRateDTO;
import com.connectflow.model.InterestRate;
import com.connectflow.repository.InterestRateRepository;
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
public class InterestRateService {

    private final InterestRateRepository interestRateRepository;

    /**
     * Get all interest rates
     */
    public List<InterestRateDTO> getAllRates() {
        return interestRateRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Get all active interest rates
     */
    public List<InterestRateDTO> getActiveRates() {
        return interestRateRepository.findByIsActiveTrue().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Get interest rate by ID
     */
    public Optional<InterestRateDTO> getRateById(UUID id) {
        return interestRateRepository.findById(id).map(this::convertToDTO);
    }

    /**
     * Get rates by customer type
     */
    public List<InterestRateDTO> getRatesByCustomerType(String customerType) {
        return interestRateRepository.findByCustomerType(customerType).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Create a new interest rate
     */
    public InterestRateDTO createRate(InterestRateDTO dto) {
        InterestRate rate = InterestRate.builder()
            .name(dto.getName())
            .ratePercent(dto.getRatePercent())
            .periodMonths(dto.getPeriodMonths())
            .customerType(dto.getCustomerType())
            .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
            .build();

        InterestRate saved = interestRateRepository.save(rate);
        return convertToDTO(saved);
    }

    /**
     * Update an existing interest rate
     */
    public InterestRateDTO updateRate(UUID id, InterestRateDTO dto) {
        InterestRate rate = interestRateRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Interest rate not found with id: " + id));

        rate.setName(dto.getName());
        rate.setRatePercent(dto.getRatePercent());
        rate.setPeriodMonths(dto.getPeriodMonths());
        rate.setCustomerType(dto.getCustomerType());
        if (dto.getIsActive() != null) {
            rate.setIsActive(dto.getIsActive());
        }

        InterestRate updated = interestRateRepository.save(rate);
        return convertToDTO(updated);
    }

    /**
     * Toggle active status of an interest rate
     */
    public void toggleActive(UUID id) {
        InterestRate rate = interestRateRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Interest rate not found with id: " + id));

        rate.setIsActive(!rate.getIsActive());
        interestRateRepository.save(rate);
    }

    /**
     * Delete an interest rate
     */
    public void deleteRate(UUID id) {
        interestRateRepository.deleteById(id);
    }

    /**
     * Convert InterestRate entity to DTO
     */
    private InterestRateDTO convertToDTO(InterestRate rate) {
        return InterestRateDTO.builder()
            .id(rate.getId())
            .name(rate.getName())
            .ratePercent(rate.getRatePercent())
            .periodMonths(rate.getPeriodMonths())
            .customerType(rate.getCustomerType())
            .isActive(rate.getIsActive())
            .createdAt(rate.getCreatedAt())
            .updatedAt(rate.getUpdatedAt())
            .build();
    }
}

