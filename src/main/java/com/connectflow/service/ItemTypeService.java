package com.connectflow.service;

import com.connectflow.dto.ItemTypeDTO;
import com.connectflow.model.ItemType;
import com.connectflow.repository.ItemTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class ItemTypeService {

    private final ItemTypeRepository itemTypeRepository;

    /**
     * Search item types with pagination and filtering
     * Uses advanced search with optional filters
     * Follows same pattern as UserRepository and CustomerRepository
     */
    public Page<ItemTypeDTO> searchItemTypes(String name, Boolean isActive, Pageable pageable) {
        log.info("Searching item types with name='{}', isActive={}, page={}, size={}",
                 name, isActive, pageable.getPageNumber(), pageable.getPageSize());

        try {
            // Use advanced search with all filters
            Page<ItemType> result = itemTypeRepository.advancedSearch(name, null, isActive, pageable);

            log.info("Search returned {} items from {} total pages: {}",
                     result.getNumberOfElements(), result.getTotalElements(), result.getTotalPages());
            return result.map(this::convertToDTO);
        } catch (Exception e) {
            log.error("Error searching item types: {}", e.getMessage(), e);
            throw e;
        }
    }

    /**
     * Get all item types
     */
    public List<ItemTypeDTO> getAllItemTypes() {
        log.info("Fetching all item types");
        return itemTypeRepository.findAllByOrderByNameAsc().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Get all active item types
     */
    public List<ItemTypeDTO> getActiveItemTypes() {
        log.info("Fetching active item types");
        return itemTypeRepository.findByIsActiveTrueOrderByNameAsc().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    /**
     * Get item type by ID
     */
    public Optional<ItemTypeDTO> getItemTypeById(UUID id) {
        log.info("Fetching item type by ID: {}", id);
        return itemTypeRepository.findById(id).map(this::convertToDTO);
    }

    /**
     * Create a new item type
     */
    public ItemTypeDTO createItemType(ItemTypeDTO dto) {
        log.info("Creating new item type: {}", dto.getName());

        // Check if item type with same name already exists
        Optional<ItemType> existing = itemTypeRepository.findByNameIgnoreCase(dto.getName());
        if (existing.isPresent()) {
            throw new RuntimeException("Item type with name '" + dto.getName() + "' already exists");
        }

        ItemType itemType = ItemType.builder()
            .name(dto.getName())
            .description(dto.getDescription())
            .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
            .createdBy(dto.getCreatedBy())
            .build();

        ItemType saved = itemTypeRepository.save(itemType);
        log.info("Item type created with ID: {}", saved.getId());

        return convertToDTO(saved);
    }

    /**
     * Update an existing item type
     */
    public ItemTypeDTO updateItemType(UUID id, ItemTypeDTO dto) {
        log.info("Updating item type with ID: {}", id);

        ItemType itemType = itemTypeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Item type not found with ID: " + id));

        // Check if new name conflicts with another item type
        if (!itemType.getName().equalsIgnoreCase(dto.getName())) {
            if (itemTypeRepository.existsByNameIgnoreCaseAndIdNot(dto.getName(), id)) {
                throw new RuntimeException("Item type with name '" + dto.getName() + "' already exists");
            }
        }

        itemType.setName(dto.getName());
        itemType.setDescription(dto.getDescription());

        ItemType updated = itemTypeRepository.save(itemType);
        log.info("Item type updated: {}", updated.getName());

        return convertToDTO(updated);
    }

    /**
     * Toggle active status of an item type
     */
    public void toggleActive(UUID id) {
        log.info("Toggling active status for item type ID: {}", id);

        ItemType itemType = itemTypeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Item type not found with ID: " + id));

        itemType.setIsActive(!itemType.getIsActive());
        itemTypeRepository.save(itemType);

        log.info("Item type '{}' is now {}", itemType.getName(), itemType.getIsActive() ? "active" : "inactive");
    }

    /**
     * Delete an item type
     */
    public void deleteItemType(UUID id) {
        log.info("Deleting item type with ID: {}", id);

        ItemType itemType = itemTypeRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Item type not found with ID: " + id));

        // TODO: Check if item type is used in any transactions before deleting
        // For now, we'll just soft delete by marking as inactive
        itemType.setIsActive(false);
        itemTypeRepository.save(itemType);

        log.info("Item type '{}' marked as inactive", itemType.getName());
    }

    /**
     * Convert ItemType entity to DTO
     */
    private ItemTypeDTO convertToDTO(ItemType itemType) {
        return ItemTypeDTO.builder()
            .id(itemType.getId())
            .name(itemType.getName())
            .description(itemType.getDescription())
            .isActive(itemType.getIsActive())
            .createdBy(itemType.getCreatedBy())
            .createdAt(itemType.getCreatedAt())
            .updatedAt(itemType.getUpdatedAt())
            .build();
    }
}

