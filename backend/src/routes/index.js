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

// ── Health (public) ───────────────────────────────────────────────────────────
router.get('/health', HealthController.health);

// ── Users ────────────────────────────────────────────────────────────────────
router.get('/users', UserController.getAll);
router.get('/users/paginated', UserController.getPaginated);
router.get('/users/filter', UserController.filter);
router.get('/users/email/:email', UserController.getByEmail);
router.get('/users/role/:role', UserController.getByRole);
router.get('/users/branch/:branchId', UserController.getByBranch);
router.get('/users/:id/has-pin', UserController.hasPin);
router.get('/users/:id', UserController.getById);
router.post('/users', UserController.create);
router.put('/users/:id', UserController.update);
router.patch('/users/:id/pin', pinLimiter, UserController.setPin);
router.post('/users/:id/verify-pin', pinLimiter, UserController.verifyPin);

// ── Branches ─────────────────────────────────────────────────────────────────
router.get('/branches', BranchController.getAll);
router.get('/branches/:id', BranchController.getById);
router.post('/branches', BranchController.create);
router.put('/branches/:id', BranchController.update);
router.delete('/branches/:id', BranchController.delete);

// ── Customers ─────────────────────────────────────────────────────────────────
router.get('/customers', CustomerController.getAll);
router.get('/customers/search', CustomerController.search);
router.get('/customers/search/advanced', CustomerController.searchAdvanced);
router.get('/customers/filter', CustomerController.filter);
router.get('/customers/type/:type', CustomerController.getByType);
router.get('/customers/nic/:nic', CustomerController.getByNic);
router.get('/customers/check-nic/:nic', CustomerController.checkNic);
router.get('/customers/:id', CustomerController.getById);
router.post('/customers', CustomerController.create);
router.put('/customers/:id', CustomerController.update);
router.delete('/customers/:id', CustomerController.delete);

// ── Interest Rates ────────────────────────────────────────────────────────────
router.get('/interest-rates', InterestRateController.getAll);
router.get('/interest-rates/default', InterestRateController.getDefault);
router.get('/interest-rates/:id', InterestRateController.getById);
router.post('/interest-rates', InterestRateController.create);
router.put('/interest-rates/:id', InterestRateController.update);
router.delete('/interest-rates/:id', InterestRateController.delete);

// ── Item Types ────────────────────────────────────────────────────────────────
router.get('/item-types', ItemTypeController.getAll);
router.get('/item-types/:id', ItemTypeController.getById);
router.post('/item-types', ItemTypeController.create);
router.put('/item-types/:id', ItemTypeController.update);
router.delete('/item-types/:id', ItemTypeController.delete);

// ── Pawn Transactions ─────────────────────────────────────────────────────────
router.get('/pawn-transactions', PawnTransactionController.getAll);
router.get('/pawn-transactions/paginated', PawnTransactionController.getPaginated);
router.get('/pawn-transactions/search', PawnTransactionController.search);
router.get('/pawn-transactions/pattern-config', PawnTransactionController.getPatternConfig);
router.get('/pawn-transactions/pawn-id/:pawnId', PawnTransactionController.getByPawnId);
router.get('/pawn-transactions/branch/:branchId', PawnTransactionController.getByBranch);
router.get('/pawn-transactions/:id/outstanding-balance', PawnTransactionController.getOutstandingBalance);
router.get('/pawn-transactions/:id/edit-history', PawnTransactionController.getEditHistory);
router.get('/pawn-transactions/:id', PawnTransactionController.getById);
router.post('/pawn-transactions', PawnTransactionController.create);
router.put('/pawn-transactions/:id', PawnTransactionController.update);
router.patch('/pawn-transactions/:id/status', PawnTransactionController.changeStatus);
router.delete('/pawn-transactions/:id', PawnTransactionController.delete);

// ── Pawn Redemptions ──────────────────────────────────────────────────────────
router.get('/pawn-redemptions/outstanding-balance/:transactionId', PawnRedemptionController.getOutstandingBalance);
router.get('/pawn-redemptions/:transactionId/history', PawnRedemptionController.getHistory);
router.post('/pawn-redemptions/:transactionId/redeem', redeemLimiter, PawnRedemptionController.redeem);

// ── Blacklist ─────────────────────────────────────────────────────────────────
router.get('/blacklist', BlacklistController.getAll);
router.get('/blacklist/paginated', BlacklistController.getPaginated);
router.get('/blacklist/active', BlacklistController.getActive);
router.get('/blacklist/search', BlacklistController.search);
router.get('/blacklist/filter', BlacklistController.filter);
router.get('/blacklist/check/:nic', BlacklistController.check);
router.get('/blacklist/verify/:nic', nicVerifyLimiter, BlacklistController.verify);
router.get('/blacklist/branch/:branchId', BlacklistController.getByBranch);
router.get('/blacklist/:id', BlacklistController.getById);
router.post('/blacklist', BlacklistController.create);
router.put('/blacklist/:id', BlacklistController.update);
router.patch('/blacklist/:id/toggle-active', BlacklistController.toggleActive);
router.delete('/blacklist/:id', BlacklistController.delete);

// ── Images ────────────────────────────────────────────────────────────────────
router.post('/images/upload', ...ImageUploadController.upload);
router.get('/images/serve/:filename', imageLimiter, ImageServeController.serveImage);

// ── Activity Logs ─────────────────────────────────────────────────────────────
router.get('/activity-logs', ActivityLogController.getLogs);

// ── Profits ───────────────────────────────────────────────────────────────────
router.get('/profits', ProfitedTransactionController.getAll);
router.get('/profits/search', ProfitedTransactionController.search);
router.post('/profits', ProfitedTransactionController.setProfit);

module.exports = router;
