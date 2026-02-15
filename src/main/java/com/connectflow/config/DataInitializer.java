package com.connectflow.config;

import com.connectflow.model.Blacklist;
import com.connectflow.model.Branch;
import com.connectflow.model.InterestRate;
import com.connectflow.model.PawnTransaction;
import com.connectflow.model.User;
import com.connectflow.model.UserRole;
import com.connectflow.repository.BlacklistRepository;
import com.connectflow.repository.BranchRepository;
import com.connectflow.repository.InterestRateRepository;
import com.connectflow.repository.PawnTransactionRepository;
import com.connectflow.repository.UserRepository;
import com.connectflow.repository.UserRoleRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.UUID;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final BranchRepository branchRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final InterestRateRepository interestRateRepository;
    private final BlacklistRepository blacklistRepository;
    private final PawnTransactionRepository pawnTransactionRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void run(String... args) {
        log.info("Starting data initialization...");

        // Ensure branches exist
        Branch mainBranch = branchRepository.findByIsActiveTrueOrderByName().stream()
            .filter(b -> "Main Branch".equalsIgnoreCase(b.getName()))
            .findFirst()
            .orElseGet(() -> {
                log.info("Creating Main Branch...");
                Branch saved = branchRepository.save(Branch.builder()
                    .name("Main Branch")
                    .address("123 Main Street")
                    .phone("+1-555-1000")
                    .isActive(true)
                    .build());
                log.info("Main Branch created with ID: {}", saved.getId());
                return saved;
            });

        log.info("Main Branch exists: {} (ID: {})", mainBranch.getName(), mainBranch.getId());

        Branch eastBranch = branchRepository.findByIsActiveTrueOrderByName().stream()
            .filter(b -> "East Branch".equalsIgnoreCase(b.getName()))
            .findFirst()
            .orElseGet(() -> {
                log.info("Creating East Branch...");
                Branch saved = branchRepository.save(Branch.builder()
                    .name("East Branch")
                    .address("456 East Avenue")
                    .phone("+1-555-1001")
                    .isActive(true)
                    .build());
                log.info("East Branch created with ID: {}", saved.getId());
                return saved;
            });

        log.info("East Branch exists: {} (ID: {})", eastBranch.getName(), eastBranch.getId());

        long branchCount = branchRepository.count();
        log.info("Total branches in database: {}", branchCount);

        // Initialize interest rates if they don't exist
        long rateCount = interestRateRepository.count();
        log.info("Existing interest rates count: {}", rateCount);

        if (rateCount == 0) {
            log.info("Creating sample interest rates...");

            interestRateRepository.save(InterestRate.builder()
                .name("Standard 3-Month")
                .ratePercent(new BigDecimal("6.50"))
                .periodMonths(3)
                .customerType("Regular")
                .isActive(true)
                .build());

            interestRateRepository.save(InterestRate.builder()
                .name("Standard 6-Month")
                .ratePercent(new BigDecimal("8.50"))
                .periodMonths(6)
                .customerType("Regular")
                .isActive(true)
                .build());

            interestRateRepository.save(InterestRate.builder()
                .name("Standard 12-Month")
                .ratePercent(new BigDecimal("10.00"))
                .periodMonths(12)
                .customerType("Regular")
                .isActive(true)
                .build());

            interestRateRepository.save(InterestRate.builder()
                .name("VIP 6-Month")
                .ratePercent(new BigDecimal("7.00"))
                .periodMonths(6)
                .customerType("VIP")
                .isActive(true)
                .build());

            interestRateRepository.save(InterestRate.builder()
                .name("VIP 12-Month")
                .ratePercent(new BigDecimal("8.50"))
                .periodMonths(12)
                .customerType("VIP")
                .isActive(true)
                .build());

            interestRateRepository.save(InterestRate.builder()
                .name("Loyal Customer 6-Month")
                .ratePercent(new BigDecimal("7.50"))
                .periodMonths(6)
                .customerType("Loyal")
                .isActive(true)
                .build());

            interestRateRepository.save(InterestRate.builder()
                .name("Loyal Customer 12-Month")
                .ratePercent(new BigDecimal("9.00"))
                .periodMonths(12)
                .customerType("Loyal")
                .isActive(true)
                .build());

            interestRateRepository.save(InterestRate.builder()
                .name("Special Rate 24-Month")
                .ratePercent(new BigDecimal("11.00"))
                .periodMonths(24)
                .customerType("Regular")
                .isActive(true)
                .build());

            long finalRateCount = interestRateRepository.count();
            log.info("Created {} interest rates", finalRateCount);
        } else {
            log.info("Interest rates already exist, skipping creation");
        }

        // Only create users if they don't exist
        long userCount = userRepository.count();
        log.info("Existing users count: {}", userCount);

        if (userCount > 0) {
            log.info("Users already exist, skipping user creation");
            return;
        }

        // Create users
        User superAdmin = userRepository.save(User.builder()
            .id(UUID.randomUUID())
            .fullName("Super Administrator")
            .email("superadmin@connectflow.com")
            .phone("+1-555-0100")
            .password("SuperAdmin@123")
            .build());

        User admin = userRepository.save(User.builder()
            .id(UUID.randomUUID())
            .fullName("System Administrator")
            .email("admin@connectflow.com")
            .phone("+1-555-0101")
            .password("Admin@123")
            .build());

        User manager = userRepository.save(User.builder()
            .id(UUID.randomUUID())
            .fullName("Branch Manager")
            .email("manager@connectflow.com")
            .phone("+1-555-0102")
            .password("Manager@123")
            .build());

        User staff = userRepository.save(User.builder()
            .id(UUID.randomUUID())
            .fullName("Staff Member")
            .email("staff@connectflow.com")
            .phone("+1-555-0103")
            .password("Staff@123")
            .build());

        // Assign roles
        // SUPERADMIN - assign to Main Branch as default for operations
        userRoleRepository.save(UserRole.builder()
            .userId(superAdmin.getId())
            .role(UserRole.Role.SUPERADMIN)
            .branchId(mainBranch.getId())
            .build());

        // ADMIN - assign to Main Branch as default for operations
        userRoleRepository.save(UserRole.builder()
            .userId(admin.getId())
            .role(UserRole.Role.ADMIN)
            .branchId(mainBranch.getId())
            .build());

        // MANAGER - assign to Main Branch
        userRoleRepository.save(UserRole.builder()
            .userId(manager.getId())
            .role(UserRole.Role.MANAGER)
            .branchId(mainBranch.getId())
            .build());

        // STAFF - assign to East Branch
        userRoleRepository.save(UserRole.builder()
            .userId(staff.getId())
            .role(UserRole.Role.STAFF)
            .branchId(eastBranch.getId())
            .build());

        // Initialize blacklist entries
        long blacklistCount = blacklistRepository.count();
        log.info("Existing blacklist entries count: {}", blacklistCount);

        if (blacklistCount == 0) {
            log.info("Creating sample blacklist entries...");

            blacklistRepository.save(Blacklist.builder()
                .customerName("John Doe")
                .customerNic("123456789V")
                .reason("Fraudulent pawn transaction - fake gold items")
                .policeReportNumber("PR-2025-001")
                .policeReportDate(LocalDate.of(2025, 12, 15))
                .branchId(mainBranch.getId())
                .addedBy(manager.getId())
                .isActive(true)
                .build());

            blacklistRepository.save(Blacklist.builder()
                .customerName("Jane Smith")
                .customerNic("987654321V")
                .reason("Failed to repay loan - absconded")
                .policeReportNumber("PR-2025-002")
                .policeReportDate(LocalDate.of(2025, 11, 20))
                .branchId(eastBranch.getId())
                .addedBy(staff.getId())
                .isActive(true)
                .build());

            blacklistRepository.save(Blacklist.builder()
                .customerName("Mike Johnson")
                .customerNic("456789123V")
                .reason("Stolen items pawned - confirmed by police")
                .policeReportNumber("PR-2025-003")
                .policeReportDate(LocalDate.of(2026, 1, 10))
                .branchId(mainBranch.getId())
                .addedBy(admin.getId())
                .isActive(true)
                .build());

            blacklistRepository.save(Blacklist.builder()
                .customerName("Sarah Williams")
                .customerNic("789123456V")
                .reason("Multiple fraudulent transactions")
                .branchId(eastBranch.getId())
                .addedBy(manager.getId())
                .isActive(true)
                .build());

            blacklistRepository.save(Blacklist.builder()
                .customerName("David Brown")
                .customerNic("321654987V")
                .reason("Identity fraud - using fake NIC")
                .policeReportNumber("PR-2026-001")
                .policeReportDate(LocalDate.of(2026, 2, 1))
                .branchId(mainBranch.getId())
                .addedBy(superAdmin.getId())
                .isActive(false)
                .build());

            long finalBlacklistCount = blacklistRepository.count();
            log.info("Created {} blacklist entries", finalBlacklistCount);
        } else {
            log.info("Blacklist entries already exist, skipping creation");
        }

        // Initialize pawn transactions if they don't exist
        long transactionCount = pawnTransactionRepository.count();
        log.info("Existing pawn transactions count: {}", transactionCount);

        if (transactionCount == 0) {
            log.info("Creating sample pawn transactions...");

            // Get interest rates
            InterestRate rate6Month = interestRateRepository.findAll().stream()
                .filter(r -> r.getPeriodMonths() == 6 && "Regular".equals(r.getCustomerType()))
                .findFirst()
                .orElse(null);

            InterestRate rate12Month = interestRateRepository.findAll().stream()
                .filter(r -> r.getPeriodMonths() == 12 && "Regular".equals(r.getCustomerType()))
                .findFirst()
                .orElse(null);

            // Sample image URLs (placeholder images)
            String imageUrls1 = null;
            String imageUrls2 = null;
            String imageUrls3 = null;
            try {
                imageUrls1 = objectMapper.writeValueAsString(Arrays.asList(
                    "https://via.placeholder.com/300x200/FFD700/000000?text=Gold+Ring",
                    "https://via.placeholder.com/300x200/FFD700/000000?text=Detail+View"
                ));
                imageUrls2 = objectMapper.writeValueAsString(Arrays.asList(
                    "https://via.placeholder.com/300x200/FFD700/000000?text=Gold+Necklace"
                ));
                imageUrls3 = objectMapper.writeValueAsString(Arrays.asList(
                    "https://via.placeholder.com/300x200/FFD700/000000?text=Gold+Bracelet",
                    "https://via.placeholder.com/300x200/FFD700/000000?text=Bracelet+Close"
                ));
            } catch (Exception e) {
                log.warn("Could not create image URLs JSON", e);
            }

            // Transaction 1 - Active
            pawnTransactionRepository.save(PawnTransaction.builder()
                .pawnId("PW0001")
                .branchId(mainBranch.getId())
                .customerName("Rajesh Kumar")
                .customerNic("852369741V")
                .customerAddress("45 Temple Road, Colombo")
                .customerPhone("+94-77-1234567")
                .customerType("Regular")
                .itemDescription("22K Gold Ring with Ruby Stone - 15.5g")
                .itemWeightGrams(new BigDecimal("15.50"))
                .itemKarat(22)
                .appraisedValue(new BigDecimal("125000"))
                .loanAmount(new BigDecimal("100000"))
                .interestRateId(rate6Month != null ? rate6Month.getId() : null)
                .interestRatePercent(rate6Month != null ? rate6Month.getRatePercent() : new BigDecimal("8.50"))
                .periodMonths(6)
                .pawnDate(LocalDate.now().minusDays(10))
                .maturityDate(LocalDate.now().plusMonths(6).minusDays(10))
                .status("Active")
                .remarks("High-quality gold item, excellent condition")
                .imageUrls(imageUrls1)
                .createdBy(manager.getId())
                .build());

            // Transaction 2 - Active
            pawnTransactionRepository.save(PawnTransaction.builder()
                .pawnId("PW0002")
                .branchId(mainBranch.getId())
                .customerName("Priya Sharma")
                .customerNic("963258741V")
                .customerAddress("12 Lake View, Kandy")
                .customerPhone("+94-71-9876543")
                .customerType("VIP")
                .itemDescription("24K Gold Necklace - 28.3g")
                .itemWeightGrams(new BigDecimal("28.30"))
                .itemKarat(24)
                .appraisedValue(new BigDecimal("280000"))
                .loanAmount(new BigDecimal("220000"))
                .interestRateId(rate6Month != null ? rate6Month.getId() : null)
                .interestRatePercent(new BigDecimal("7.00"))
                .periodMonths(6)
                .pawnDate(LocalDate.now().minusDays(5))
                .maturityDate(LocalDate.now().plusMonths(6).minusDays(5))
                .status("Active")
                .remarks("VIP customer - reduced interest rate")
                .imageUrls(imageUrls2)
                .createdBy(staff.getId())
                .build());

            // Transaction 3 - Active (East Branch)
            pawnTransactionRepository.save(PawnTransaction.builder()
                .pawnId("PW0003")
                .branchId(eastBranch.getId())
                .customerName("Mohamed Hassan")
                .customerNic("741852963V")
                .customerAddress("78 Beach Road, Negombo")
                .customerPhone("+94-76-5551234")
                .customerType("Regular")
                .itemDescription("22K Gold Bracelet Set (2 pieces) - 42.0g")
                .itemWeightGrams(new BigDecimal("42.00"))
                .itemKarat(22)
                .appraisedValue(new BigDecimal("350000"))
                .loanAmount(new BigDecimal("280000"))
                .interestRateId(rate12Month != null ? rate12Month.getId() : null)
                .interestRatePercent(rate12Month != null ? rate12Month.getRatePercent() : new BigDecimal("10.00"))
                .periodMonths(12)
                .pawnDate(LocalDate.now().minusDays(15))
                .maturityDate(LocalDate.now().plusMonths(12).minusDays(15))
                .status("Active")
                .remarks("Customer requested 12-month loan period")
                .imageUrls(imageUrls3)
                .createdBy(staff.getId())
                .build());

            // Transaction 4 - Completed
            pawnTransactionRepository.save(PawnTransaction.builder()
                .pawnId("PW0004")
                .branchId(mainBranch.getId())
                .customerName("Sita Perera")
                .customerNic("654987321V")
                .customerAddress("89 Hill Street, Galle")
                .customerPhone("+94-75-3216549")
                .customerType("Regular")
                .itemDescription("18K Gold Earrings - 8.5g")
                .itemWeightGrams(new BigDecimal("8.50"))
                .itemKarat(18)
                .appraisedValue(new BigDecimal("60000"))
                .loanAmount(new BigDecimal("45000"))
                .interestRateId(rate6Month != null ? rate6Month.getId() : null)
                .interestRatePercent(new BigDecimal("8.50"))
                .periodMonths(6)
                .pawnDate(LocalDate.now().minusMonths(7))
                .maturityDate(LocalDate.now().minusMonths(1))
                .status("Completed")
                .remarks("Loan repaid in full with interest")
                .imageUrls(imageUrls1)
                .createdBy(manager.getId())
                .build());

            // Transaction 5 - Active
            pawnTransactionRepository.save(PawnTransaction.builder()
                .pawnId("PW0005")
                .branchId(eastBranch.getId())
                .customerName("Kumar Fernando")
                .customerNic("987456123V")
                .customerAddress("23 Market Street, Matara")
                .customerPhone("+94-77-8887777")
                .customerType("Loyal")
                .itemDescription("22K Gold Chain - 20.0g")
                .itemWeightGrams(new BigDecimal("20.00"))
                .itemKarat(22)
                .appraisedValue(new BigDecimal("165000"))
                .loanAmount(new BigDecimal("130000"))
                .interestRateId(rate6Month != null ? rate6Month.getId() : null)
                .interestRatePercent(new BigDecimal("7.50"))
                .periodMonths(6)
                .pawnDate(LocalDate.now().minusDays(2))
                .maturityDate(LocalDate.now().plusMonths(6).minusDays(2))
                .status("Active")
                .remarks("Loyal customer - preferential rate applied")
                .imageUrls(imageUrls2)
                .createdBy(staff.getId())
                .build());

            long finalTransactionCount = pawnTransactionRepository.count();
            log.info("Created {} pawn transactions", finalTransactionCount);
        } else {
            log.info("Pawn transactions already exist, skipping creation");
        }
    }
}

