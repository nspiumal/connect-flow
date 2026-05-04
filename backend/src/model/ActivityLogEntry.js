'use strict';
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Activity log entry model - matches Java ActivityLogEntry entity and 'activity_log' table.
 */
const ActivityLogEntry = sequelize.define('ActivityLogEntry', {
  id: { 
    type: DataTypes.CHAR(36), 
    primaryKey: true, 
    defaultValue: DataTypes.UUIDV4 
  },
  userName: { 
    type: DataTypes.STRING(255), 
    field: 'user_name' 
  },
  userEmail: { 
    type: DataTypes.STRING(255), 
    field: 'user_email' 
  },
  action: { 
    type: DataTypes.STRING(100), 
    nullable: false 
  },
  description: { 
    type: DataTypes.STRING(500) 
  },
  httpMethod: { 
    type: DataTypes.STRING(10), 
    field: 'http_method' 
  },
  endpoint: { 
    type: DataTypes.STRING(500) 
  },
  ipAddress: { 
    type: DataTypes.STRING(50), 
    field: 'ip_address' 
  },
  status: { 
    type: DataTypes.STRING(20) 
  },
  errorMessage: { 
    type: DataTypes.STRING(1000), 
    field: 'error_message' 
  },
}, {
  tableName: 'activity_log',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = ActivityLogEntry;
