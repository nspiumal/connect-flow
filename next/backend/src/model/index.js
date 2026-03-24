'use strict';
const User = require('./User');
const Branch = require('./Branch');
const UserRole = require('./UserRole');
const Customer = require('./Customer');
const InterestRate = require('./InterestRate');
const ItemType = require('./ItemType');
const PawnTransaction = require('./PawnTransaction');
const PawnTransactionItem = require('./PawnTransactionItem');
const PawnTransactionItemImage = require('./PawnTransactionItemImage');
const PawnRedemption = require('./PawnRedemption');
const Blacklist = require('./Blacklist');
const TransactionEditHistory = require('./TransactionEditHistory');
const ActivityLogEntry = require('./ActivityLogEntry');
const TransactionProfit = require('./TransactionProfit');

// Branch <-> User (manager)
Branch.belongsTo(User, { foreignKey: 'manager_id', as: 'manager' });
User.hasMany(Branch, { foreignKey: 'manager_id', as: 'managedBranches' });

// UserRole <-> User
UserRole.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(UserRole, { foreignKey: 'user_id', as: 'roles' });

// UserRole <-> Branch
UserRole.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });
Branch.hasMany(UserRole, { foreignKey: 'branch_id', as: 'userRoles' });

// PawnTransaction <-> Branch
PawnTransaction.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });
Branch.hasMany(PawnTransaction, { foreignKey: 'branch_id', as: 'transactions' });

// PawnTransaction <-> Customer
PawnTransaction.belongsTo(Customer, { foreignKey: 'customer_id', as: 'customer' });
Customer.hasMany(PawnTransaction, { foreignKey: 'customer_id', as: 'transactions' });

// PawnTransaction <-> User (createdBy)
PawnTransaction.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// PawnTransaction <-> InterestRate
PawnTransaction.belongsTo(InterestRate, { foreignKey: 'interest_rate_id', as: 'interestRate' });

// PawnTransactionItem <-> PawnTransaction
PawnTransactionItem.belongsTo(PawnTransaction, { foreignKey: 'transaction_id', as: 'transaction', onDelete: 'CASCADE' });
PawnTransaction.hasMany(PawnTransactionItem, { foreignKey: 'transaction_id', as: 'items' });

// PawnTransactionItemImage <-> PawnTransactionItem
PawnTransactionItemImage.belongsTo(PawnTransactionItem, { foreignKey: 'item_id', as: 'item', onDelete: 'CASCADE' });
PawnTransactionItem.hasMany(PawnTransactionItemImage, { foreignKey: 'item_id', as: 'images' });

// PawnTransactionItemImage <-> PawnTransaction
PawnTransactionItemImage.belongsTo(PawnTransaction, { foreignKey: 'transaction_id', as: 'transaction' });

// PawnRedemption <-> PawnTransaction
PawnRedemption.belongsTo(PawnTransaction, { foreignKey: 'transaction_id', as: 'transaction' });
PawnTransaction.hasMany(PawnRedemption, { foreignKey: 'transaction_id', as: 'redemptions' });

// Blacklist <-> Branch
Blacklist.belongsTo(Branch, { foreignKey: 'branch_id', as: 'branch' });

// Blacklist <-> User (addedBy)
Blacklist.belongsTo(User, { foreignKey: 'added_by', as: 'addedByUser' });

// TransactionEditHistory <-> PawnTransaction
TransactionEditHistory.belongsTo(PawnTransaction, { foreignKey: 'transaction_id', as: 'transaction' });
PawnTransaction.hasMany(TransactionEditHistory, { foreignKey: 'transaction_id', as: 'editHistory' });

// TransactionProfit <-> PawnTransaction
TransactionProfit.belongsTo(PawnTransaction, { foreignKey: 'transaction_id', as: 'transaction' });
PawnTransaction.hasOne(TransactionProfit, { foreignKey: 'transaction_id', as: 'profit' });

module.exports = {
  User,
  Branch,
  UserRole,
  Customer,
  InterestRate,
  ItemType,
  PawnTransaction,
  PawnTransactionItem,
  PawnTransactionItemImage,
  PawnRedemption,
  Blacklist,
  TransactionEditHistory,
  ActivityLogEntry,
  TransactionProfit,
};
