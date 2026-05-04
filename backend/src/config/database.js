'use strict';
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = process.env.DB_URL
  ? new Sequelize(process.env.DB_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: { underscored: true, timestamps: true, freezeTableName: true },
    timezone: '+00:00',
  })
  : new Sequelize(
    process.env.DB_NAME || 'connect_flow',
    process.env.DB_USER || 'connectflow',
    process.env.DB_PASS || 'connectflow123',
    {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      dialect: process.env.DB_DIALECT || 'mysql',
      logging: process.env.NODE_ENV === 'development' ? console.log : false,
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      define: { underscored: true, timestamps: true, freezeTableName: true },
      timezone: '+00:00',
    }
  );

module.exports = sequelize;
