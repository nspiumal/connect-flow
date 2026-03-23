package com.connectflow.controller;

import com.connectflow.aop.ActivityLog;
import com.connectflow.dto.ItemTypeDTO;
import com.connectflow.service.ItemTypeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/item-types")
@RequiredArgsConstructor
@Tag(name = "Item Types", description = "Item Type Management APIs")
public class ItemTypeController {

    private final ItemTypeService itemTypeService;

    // ...existing code...

    @GetMapping("/search")
    @Operation(summary = "Search item types with pagination and filtering")
    public ResponseEntity<Page<ItemTypeDTO>> searchItemTypes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Boolean isActive,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        log.info("GET /item-types/search - Searching with filters: name={}, isActive={}, page={}, size={}, sortBy={}, sortDir={}",
                 name, isActive, page, size, sortBy, sortDir);

        try {
            // Create sort direction
            Sort.Direction direction = Sort.Direction.fromString(sortDir.toUpperCase());
            Sort sort = Sort.by(direction, sortBy);
            Pageable pageable = PageRequest.of(page, size, sort);

            // Call service with filters
            Page<ItemTypeDTO> result = itemTypeService.searchItemTypes(name, isActive, pageable);

            log.info("Search returned {} items, total pages: {}", result.getNumberOfElements(), result.getTotalPages());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("Error searching item types: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @GetMapping
    @Operation(summary = "Get all item types")
    public ResponseEntity<List<ItemTypeDTO>> getAllItemTypes() {
        log.info("GET /item-types - Fetching all item types");
        List<ItemTypeDTO> itemTypes = itemTypeService.getAllItemTypes();
        log.info("Returning {} item types", itemTypes.size());
        return ResponseEntity.ok(itemTypes);
    }

    // ...existing code...

    @GetMapping("/active")
    @Operation(summary = "Get all active item types")
    public ResponseEntity<List<ItemTypeDTO>> getActiveItemTypes() {
        log.info("GET /item-types/active - Fetching active item types");
        List<ItemTypeDTO> itemTypes = itemTypeService.getActiveItemTypes();
        log.info("Returning {} active item types", itemTypes.size());
        return ResponseEntity.ok(itemTypes);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get item type by ID")
    public ResponseEntity<ItemTypeDTO> getItemTypeById(@PathVariable UUID id) {
        log.info("GET /item-types/{} - Fetching item type", id);
        return itemTypeService.getItemTypeById(id)
            .map(ResponseEntity::ok)
            .orElseGet(() -> {
                log.warn("Item type not found with ID: {}", id);
                return ResponseEntity.notFound().build();
            });
    }

    @PostMapping
    @Operation(summary = "Create a new item type")
    @ActivityLog(action = "CREATE_ITEM_TYPE", description = "Created new item type")
    public ResponseEntity<ItemTypeDTO> createItemType(@RequestBody ItemTypeDTO dto) {
        log.info("POST /item-types - Creating new item type: {}", dto.getName());
        try {
            ItemTypeDTO created = itemTypeService.createItemType(dto);
            log.info("Item type created successfully with ID: {}", created.getId());
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (RuntimeException e) {
            log.error("Error creating item type: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing item type")
    @ActivityLog(action = "UPDATE_ITEM_TYPE", description = "Updated item type")
    public ResponseEntity<ItemTypeDTO> updateItemType(
            @PathVariable UUID id,
            @RequestBody ItemTypeDTO dto) {
        log.info("PUT /item-types/{} - Updating item type", id);
        try {
            ItemTypeDTO updated = itemTypeService.updateItemType(id, dto);
            log.info("Item type updated successfully");
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            log.error("Error updating item type: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @PatchMapping("/{id}/toggle-active")
    @Operation(summary = "Toggle the active status of an item type")
    @ActivityLog(action = "TOGGLE_ITEM_TYPE", description = "Toggled item type active status")
    public ResponseEntity<ItemTypeDTO> toggleItemTypeActive(@PathVariable UUID id) {
        log.info("PATCH /item-types/{}/toggle-active - Toggling status", id);
        try {
            itemTypeService.toggleActive(id);
            log.info("Item type status toggled successfully");
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            log.error("Error toggling item type status: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an item type")
    @ActivityLog(action = "DELETE_ITEM_TYPE", description = "Deleted item type")
    public ResponseEntity<Void> deleteItemType(@PathVariable UUID id) {
        log.info("DELETE /item-types/{} - Deleting item type", id);
        try {
            itemTypeService.deleteItemType(id);
            log.info("Item type deleted successfully");
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            log.error("Error deleting item type: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}

