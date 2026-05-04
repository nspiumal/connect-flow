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
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at'
  }
}, {
  tableName: 'activity_log',
  timestamps: false, // We'll manage createdAt manually as a field since we don't have updatedAt
});

module.exports = ActivityLogEntry;
