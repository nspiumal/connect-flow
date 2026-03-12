package com.connectflow.service;

import com.connectflow.dto.InterestRateDTO;
import com.connectflow.model.InterestRate;
import com.connectflow.repository.InterestRateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
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
     * Create a new interest rate
     */
    public InterestRateDTO createRate(InterestRateDTO dto) {
        boolean isActive = dto.getIsActive() == null || dto.getIsActive();

        InterestRate rate = InterestRate.builder()
            .name(dto.getName())
            .ratePercent(dto.getRatePercent())
            .firstMonthRatePercent(resolveFirstMonthRatePercent(dto.getRatePercent(), dto.getFirstMonthRatePercent()))
            .isActive(isActive)
            .isDefault(Boolean.FALSE)
            .build();

        InterestRate saved = interestRateRepository.save(rate);

        if (saved.getIsActive()) {
            applyDefaultOnCreateOrActivate(saved, Boolean.TRUE.equals(dto.getIsDefault()));
        }

        return convertToDTO(interestRateRepository.save(saved));
    }

    /**
     * Update an existing interest rate
     */
    public InterestRateDTO updateRate(UUID id, InterestRateDTO dto) {
        InterestRate rate = interestRateRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Interest rate not found with id: " + id));

        boolean wasActive = Boolean.TRUE.equals(rate.getIsActive());
        boolean wasDefault = Boolean.TRUE.equals(rate.getIsDefault());

        rate.setName(dto.getName());
        rate.setRatePercent(dto.getRatePercent());
        rate.setFirstMonthRatePercent(resolveFirstMonthRatePercent(dto.getRatePercent(), dto.getFirstMonthRatePercent()));

        boolean targetActive = dto.getIsActive() != null ? dto.getIsActive() : wasActive;
        boolean requestedDefault = Boolean.TRUE.equals(dto.getIsDefault());

        if (!targetActive) {
            if (wasActive && wasDefault) {
                UUID replacementId = dto.getReplacementDefaultRateId();
                if (replacementId == null) {
                    throw new RuntimeException("Default active rate cannot be inactivated without selecting a replacement default rate");
                }
                InterestRate replacement = interestRateRepository.findById(replacementId)
                    .orElseThrow(() -> new RuntimeException("Replacement rate not found with id: " + replacementId));
                if (!Boolean.TRUE.equals(replacement.getIsActive())) {
                    throw new RuntimeException("Replacement default rate must be active");
                }
                if (replacement.getId().equals(rate.getId())) {
                    throw new RuntimeException("Replacement default rate must be different from the current rate");
                }

                rate.setIsActive(false);
                rate.setIsDefault(false);
                interestRateRepository.save(rate);

                setAsActiveDefault(replacement);
                return convertToDTO(rate);
            }

            rate.setIsActive(false);
            rate.setIsDefault(false);
            return convertToDTO(interestRateRepository.save(rate));
        }

        rate.setIsActive(true);

        if (requestedDefault) {
            setAsActiveDefault(rate);
        } else if (!wasActive) {
            applyDefaultOnCreateOrActivate(rate, false);
        }

        InterestRate updated = interestRateRepository.save(rate);
        ensureOneActiveDefault();
        return convertToDTO(updated);
    }

    /**
     * Toggle active status of an interest rate
     */
    public void toggleActive(UUID id, UUID replacementDefaultRateId) {
        InterestRate rate = interestRateRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Interest rate not found with id: " + id));

        if (Boolean.TRUE.equals(rate.getIsActive())) {
            // Deactivate flow
            if (Boolean.TRUE.equals(rate.getIsDefault())) {
                if (replacementDefaultRateId == null) {
                    throw new RuntimeException("Please select another active rate as default before deactivating the current default rate");
                }

                InterestRate replacement = interestRateRepository.findById(replacementDefaultRateId)
                    .orElseThrow(() -> new RuntimeException("Replacement rate not found with id: " + replacementDefaultRateId));

                if (!Boolean.TRUE.equals(replacement.getIsActive())) {
                    throw new RuntimeException("Replacement default rate must be active");
                }
                if (replacement.getId().equals(rate.getId())) {
                    throw new RuntimeException("Replacement default rate must be different from the current default rate");
                }

                rate.setIsActive(false);
                rate.setIsDefault(false);
                interestRateRepository.save(rate);

                setAsActiveDefault(replacement);
                return;
            }

            rate.setIsActive(false);
            rate.setIsDefault(false);
            interestRateRepository.save(rate);
            ensureOneActiveDefault();
            return;
        }

        // Activate flow
        rate.setIsActive(true);
        interestRateRepository.save(rate);
        applyDefaultOnCreateOrActivate(rate, false);
    }

    /**
     * Delete an interest rate
     */
    public void deleteRate(UUID id) {
        InterestRate rate = interestRateRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Interest rate not found with id: " + id));

        boolean deletingActiveDefault = Boolean.TRUE.equals(rate.getIsActive()) && Boolean.TRUE.equals(rate.getIsDefault());

        interestRateRepository.deleteById(id);

        if (deletingActiveDefault) {
            ensureOneActiveDefault();
        }
    }

    private void applyDefaultOnCreateOrActivate(InterestRate target, boolean forceAsDefault) {
        Optional<InterestRate> activeDefault = interestRateRepository.findByIsActiveTrueAndIsDefaultTrue();

        if (forceAsDefault || activeDefault.isEmpty()) {
            setAsActiveDefault(target);
            return;
        }

        target.setIsDefault(false);
        interestRateRepository.save(target);
    }

    private void setAsActiveDefault(InterestRate target) {
        List<InterestRate> activeRates = interestRateRepository.findByIsActiveTrue();
        for (InterestRate rate : activeRates) {
            boolean shouldBeDefault = rate.getId().equals(target.getId());
            if (!Boolean.valueOf(shouldBeDefault).equals(rate.getIsDefault())) {
                rate.setIsDefault(shouldBeDefault);
                interestRateRepository.save(rate);
            }
        }
    }

    private void ensureOneActiveDefault() {
        List<InterestRate> activeRates = interestRateRepository.findByIsActiveTrueOrderByCreatedAtAsc();
        if (activeRates.isEmpty()) {
            return;
        }

        List<InterestRate> defaults = activeRates.stream()
            .filter(r -> Boolean.TRUE.equals(r.getIsDefault()))
            .collect(Collectors.toList());

        if (defaults.size() == 1) {
            return;
        }

        InterestRate chosen = defaults.isEmpty() ? activeRates.get(0) : defaults.get(0);
        setAsActiveDefault(chosen);
    }

    /**
     * Convert InterestRate entity to DTO
     */
    private InterestRateDTO convertToDTO(InterestRate rate) {
        return InterestRateDTO.builder()
            .id(rate.getId())
            .name(rate.getName())
            .ratePercent(rate.getRatePercent())
            .firstMonthRatePercent(rate.getFirstMonthRatePercent())
            .isActive(rate.getIsActive())
            .isDefault(rate.getIsDefault())
            .createdAt(rate.getCreatedAt())
            .updatedAt(rate.getUpdatedAt())
            .build();
    }

    private BigDecimal resolveFirstMonthRatePercent(BigDecimal normalRatePercent, BigDecimal firstMonthRatePercent) {
        if (firstMonthRatePercent != null) {
            return firstMonthRatePercent;
        }
        if (normalRatePercent == null) {
            return BigDecimal.ZERO;
        }
        return normalRatePercent.divide(new BigDecimal("12"), 2, RoundingMode.HALF_UP);
    }
}

