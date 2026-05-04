'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TransactionEditHistory = sequelize.define('TransactionEditHistory', {
  id:                    { type: DataTypes.CHAR(36),        primaryKey: true, defaultValue: DataTypes.UUIDV4 },
  transactionId:         { type: DataTypes.CHAR(36),        field: 'transaction_id' },
  pawnId:                { type: DataTypes.STRING,          field: 'pawn_id' },
  editedBy:              { type: DataTypes.CHAR(36),        field: 'edited_by' },
  editedByName:          { type: DataTypes.STRING,          field: 'edited_by_name' },
  editType:              { type: DataTypes.STRING(50),      field: 'edit_type' },

  previousStatus:        { type: DataTypes.STRING(50),      field: 'previous_status' },
  newStatus:             { type: DataTypes.STRING(50),      field: 'new_status' },

  previousAddress:       { type: DataTypes.STRING,          field: 'previous_address' },
  newAddress:            { type: DataTypes.STRING,          field: 'new_address' },

  previousPhone:         { type: DataTypes.STRING,          field: 'previous_phone' },
  newPhone:              { type: DataTypes.STRING,          field: 'new_phone' },

  previousLoanAmount:    { type: DataTypes.DECIMAL(18, 2),  field: 'previous_loan_amount' },
  newLoanAmount:         { type: DataTypes.DECIMAL(18, 2),  field: 'new_loan_amount' },

  previousInterestRateId:{ type: DataTypes.CHAR(36),        field: 'previous_interest_rate_id' },
  newInterestRateId:     { type: DataTypes.CHAR(36),        field: 'new_interest_rate_id' },

  previousPeriodMonths:  { type: DataTypes.INTEGER,         field: 'previous_period_months' },
  newPeriodMonths:       { type: DataTypes.INTEGER,         field: 'new_period_months' },

  previousMaturityDate:  { type: DataTypes.DATEONLY,        field: 'previous_maturity_date' },
  newMaturityDate:       { type: DataTypes.DATEONLY,        field: 'new_maturity_date' },

  previousRemarks:       { type: DataTypes.TEXT,            field: 'previous_remarks' },
  newRemarks:            { type: DataTypes.TEXT,            field: 'new_remarks' },

  blockReason:           { type: DataTypes.TEXT,            field: 'block_reason' },
  policeReportNumber:    { type: DataTypes.STRING,          field: 'police_report_number' },
  policeReportDate:      { type: DataTypes.DATEONLY,        field: 'police_report_date' },

  createdAt:             { type: DataTypes.DATE, defaultValue: DataTypes.NOW, field: 'created_at' },
}, {
  tableName: 'transaction_edit_history',
  timestamps: false,
});

module.exports = TransactionEditHistory;
