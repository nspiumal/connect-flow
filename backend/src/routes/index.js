'use strict';
const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const AuthController = require('../controller/AuthController');
const HealthController = require('../controller/HealthController');
const UserController = require('../controller/UserController');
const BranchController = require('../controller/BranchController');
const CustomerController = require('../controller/CustomerController');
const InterestRateController = require('../controller/InterestRateController');
const ItemTypeController = require('../controller/ItemTypeController');
const PawnTransactionController = require('../controller/PawnTransactionController');
const PawnRedemptionController = require('../controller/PawnRedemptionController');
const BlacklistController = require('../controller/BlacklistController');
const ImageUploadController = require('../controller/ImageUploadController');
const ImageServeController = require('../controller/ImageServeController');
const ActivityLogController = require('../controller/ActivityLogController');
const ProfitedTransactionController = require('../controller/ProfitedTransactionController');
const RoleController = require('../controller/RoleController');
const PermissionController = require('../controller/PermissionController');

const { requirePermission, requireSuperAdmin } = require('../security/requirePermission');

// ── Rate limiters ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts, please try again later.' },
});

const pinLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many PIN verification attempts, please try again later.' },
});

const redeemLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many redemption requests, please slow down.' },
});

const imageLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many image requests, please slow down.' },
});

const nicVerifyLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many NIC verification requests, please slow down.' },
});

// ── Auth (public) ─────────────────────────────────────────────────────────────
router.post('/auth/login', authLimiter, AuthController.login);
router.get('/auth/me', AuthController.me);

// ── Health (public) ───────────────────────────────────────────────────────────
router.get('/health', HealthController.health);

// ── Users ────────────────────────────────────────────────────────────────────
router.get('/users', requirePermission('users.list.all'), UserController.getAll);
router.get('/users/dashboard-stats/admin', requirePermission('users.stats.admin'), UserController.getDashboardStatsAdmin);
router.get('/users/paginated', requirePermission('users.view'), UserController.getPaginated);
router.get('/users/filter', requirePermission('users.search'), UserController.filter);
router.get('/users/email/:email', requirePermission('users.lookup.byEmail'), UserController.getByEmail);
router.get('/users/role/:role', requirePermission('users.lookup.byRole'), UserController.getByRole);
router.get('/users/branch/:branchId', requirePermission('users.lookup.byBranch'), UserController.getByBranch);
router.get('/users/:id/has-pin', requirePermission('users.pin.status'), UserController.hasPin);
router.get('/users/:id', requirePermission('users.view'), UserController.getById);
router.post('/users', requirePermission('users.create'), UserController.create);
router.post('/users/:id', requirePermission('users.edit'), UserController.update);
router.patch('/users/:id/pin', pinLimiter, requirePermission('users.pin.set'), UserController.setPin);
router.post('/users/:id/verify-pin', pinLimiter, requirePermission('users.pin.verify'), UserController.verifyPin);

// ── Roles & Permissions (Super Admin only) ────────────────────────────────────
router.get('/roles', requirePermission('roles.view'), RoleController.getAll);
router.get('/roles/:id', requirePermission('roles.view'), RoleController.getById);
router.post('/roles', requireSuperAdmin, RoleController.create);
router.post('/roles/:id', requireSuperAdmin, RoleController.update);
router.delete('/roles/:id', requireSuperAdmin, RoleController.delete);
router.get('/roles/:name/permissions', requirePermission('roles.view'), RoleController.getPermissions);
router.post('/roles/:name/permissions', requireSuperAdmin, RoleController.setPermissions);

router.get('/permissions', PermissionController.getAll);
router.get('/permissions/grouped', PermissionController.getGrouped);

// ── Branches ─────────────────────────────────────────────────────────────────
router.get('/branches', requirePermission('branches.list.all'), BranchController.getAll);
router.get('/branches/paginated', requirePermission('branches.view'), BranchController.getPaginated);
router.get('/branches/active', requirePermission('branches.list.active'), BranchController.getActive);
router.get('/branches/:id', requirePermission('branches.getById'), BranchController.getById);
router.post('/branches', requirePermission('branches.create'), BranchController.create);
router.post('/branches/:id', requirePermission('branches.edit'), BranchController.update);
router.delete('/branches/:id', requirePermission('branches.delete'), BranchController.delete);

// ── Customers ─────────────────────────────────────────────────────────────────
router.get('/customers', requirePermission('customers.list.all'), CustomerController.getAll);
router.get('/customers/search', requirePermission('customers.search'), CustomerController.search);
router.get('/customers/search/advanced', requirePermission('customers.search.advanced'), CustomerController.searchAdvanced);
router.get('/customers/filter', requirePermission('customers.view'), CustomerController.filter);
router.get('/customers/type/:type', requirePermission('customers.getByType'), CustomerController.getByType);
router.get('/customers/nic/:nic', requirePermission('customers.getByNic'), CustomerController.getByNic);
router.get('/customers/check-nic/:nic', requirePermission('customers.checkNic'), CustomerController.checkNic);
router.get('/customers/:id', requirePermission('customers.getById'), CustomerController.getById);
router.post('/customers', requirePermission('customers.create'), CustomerController.create);
router.post('/customers/:id', requirePermission('customers.edit'), CustomerController.update);
router.delete('/customers/:id', requirePermission('customers.delete'), CustomerController.delete);

// ── Interest Rates ────────────────────────────────────────────────────────────
router.get('/interest-rates', requirePermission('interestRates.view'), InterestRateController.getAll);
router.get('/interest-rates/active', requirePermission('interestRates.list.active'), InterestRateController.getActive);
router.get('/interest-rates/default', requirePermission('interestRates.getDefault'), InterestRateController.getDefault);
router.get('/interest-rates/:id', requirePermission('interestRates.view'), InterestRateController.getById);
router.post('/interest-rates', requirePermission('interestRates.create'), InterestRateController.create);
router.post('/interest-rates/:id', requirePermission('interestRates.edit'), InterestRateController.update);
router.patch('/interest-rates/:id/toggle-active', requirePermission('interestRates.toggleActive'), InterestRateController.toggleActive);
router.delete('/interest-rates/:id', requirePermission('interestRates.delete'), InterestRateController.delete);

// ── Item Types ────────────────────────────────────────────────────────────────
router.get('/item-types', requirePermission('itemTypes.list.active'), ItemTypeController.getAll);
router.get('/item-types/search', requirePermission('itemTypes.view'), ItemTypeController.search);
router.get('/item-types/active', requirePermission('itemTypes.list.active'), ItemTypeController.getActive);
router.get('/item-types/:id', requirePermission('itemTypes.getById'), ItemTypeController.getById);
router.post('/item-types', requirePermission('itemTypes.create'), ItemTypeController.create);
router.post('/item-types/:id', requirePermission('itemTypes.edit'), ItemTypeController.update);
router.patch('/item-types/:id/toggle-active', requirePermission('itemTypes.toggleActive'), ItemTypeController.toggleActive);
router.delete('/item-types/:id', requirePermission('itemTypes.delete'), ItemTypeController.delete);

// ── Pawn Transactions ─────────────────────────────────────────────────────────
router.get('/pawn-transactions', requirePermission('tickets.list.all'), PawnTransactionController.getAll);
router.get('/pawn-transactions/paginated', requirePermission('tickets.view'), PawnTransactionController.getPaginated);
router.get('/pawn-transactions/search', requirePermission('tickets.search.basic'), PawnTransactionController.search);
router.get('/pawn-transactions/search/advanced', requirePermission('tickets.search.advanced'), PawnTransactionController.searchAdvanced);
router.get('/pawn-transactions/pattern-config', requirePermission('tickets.patternConfig'), PawnTransactionController.getPatternConfig);
router.get('/pawn-transactions/pawn-id/:pawnId', requirePermission('tickets.getByPawnId'), PawnTransactionController.getByPawnId);
router.get('/pawn-transactions/branch/:branchId', requirePermission('tickets.getByBranch'), PawnTransactionController.getByBranch);
router.get('/pawn-transactions/:id/outstanding-balance', requirePermission('tickets.balance.view'), PawnTransactionController.getOutstandingBalance);
router.get('/pawn-transactions/:id/edit-history', requirePermission('tickets.view.history'), PawnTransactionController.getEditHistory);
router.get('/pawn-transactions/:id/profit', requirePermission('profit.view.byTicket'), ProfitedTransactionController.getByTransactionId);
router.post('/pawn-transactions/:id/profit', requirePermission('profit.record'), ProfitedTransactionController.setProfitForTransaction);
router.get('/pawn-transactions/:id', requirePermission('tickets.view.detail'), PawnTransactionController.getById);
router.post('/pawn-transactions', requirePermission('tickets.create'), PawnTransactionController.create);
router.post('/pawn-transactions/:id', requirePermission('tickets.update'), PawnTransactionController.update);
router.patch('/pawn-transactions/:id/status', requirePermission('tickets.status.change'), PawnTransactionController.changeStatus);
router.patch('/pawn-transactions/:id/details', requirePermission('tickets.edit'), PawnTransactionController.updateDetails);
router.patch('/pawn-transactions/:id/remarks', requirePermission('tickets.edit.remarks'), PawnTransactionController.updateRemarks);
router.delete('/pawn-transactions/:id', requirePermission('tickets.delete'), PawnTransactionController.delete);

// ── Pawn Redemptions ──────────────────────────────────────────────────────────
router.get('/pawn-redemptions/outstanding-balance/:transactionId', requirePermission('redemption.view.balance'), PawnRedemptionController.getOutstandingBalance);
router.get('/pawn-redemptions/:transactionId/history', requirePermission('redemption.history'), PawnRedemptionController.getHistory);
router.post('/pawn-redemptions/:transactionId/redeem', redeemLimiter, requirePermission('redemption.process'), PawnRedemptionController.redeem);

// ── Blacklist ─────────────────────────────────────────────────────────────────
router.get('/blacklist', requirePermission('blacklist.list.active'), BlacklistController.getAll);
router.get('/blacklist/paginated', requirePermission('blacklist.view'), BlacklistController.getPaginated);
router.get('/blacklist/active', requirePermission('blacklist.list.active'), BlacklistController.getActive);
router.get('/blacklist/search', requirePermission('blacklist.search'), BlacklistController.search);
router.get('/blacklist/filter', requirePermission('blacklist.search'), BlacklistController.filter);
router.get('/blacklist/check/:nic', requirePermission('blacklist.checkNic'), BlacklistController.check);
router.get('/blacklist/verify/:nic', nicVerifyLimiter, requirePermission('blacklist.verifyNic'), BlacklistController.verify);
router.get('/blacklist/branch/:branchId', requirePermission('blacklist.getByBranch'), BlacklistController.getByBranch);
router.get('/blacklist/:id', requirePermission('blacklist.getById'), BlacklistController.getById);
router.post('/blacklist', requirePermission('blacklist.create'), BlacklistController.create);
router.post('/blacklist/:id', requirePermission('blacklist.edit'), BlacklistController.update);
router.patch('/blacklist/:id/toggle-active', requirePermission('blacklist.toggleActive'), BlacklistController.toggleActive);
router.delete('/blacklist/:id', requirePermission('blacklist.delete'), BlacklistController.delete);

// ── Images ────────────────────────────────────────────────────────────────────
router.post('/images/upload', ...ImageUploadController.upload);
router.get('/images/serve/:filename', imageLimiter, ImageServeController.serveImage);

// ── Activity Logs ─────────────────────────────────────────────────────────────
router.get('/activity-logs', requirePermission('activityLogs.view'), ActivityLogController.getLogs);

// ── Profits ───────────────────────────────────────────────────────────────────
router.get('/profits', requirePermission('profit.list.all'), ProfitedTransactionController.getAll);
router.get('/profits/search', requirePermission('profit.search'), ProfitedTransactionController.search);
router.get('/profited-transactions/paginated', requirePermission('profit.view.list'), ProfitedTransactionController.getPaginated);
router.post('/profits', requirePermission('profit.create'), ProfitedTransactionController.setProfit);

module.exports = router;