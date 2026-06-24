'use strict';
const { Sequelize } = require('sequelize');
require('dotenv').config();

const isCloudDb = !!process.env.DB_URL;

const sequelize = isCloudDb
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
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASS,
      {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        dialect: process.env.DB_DIALECT || 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        define: { underscored: true, timestamps: true, freezeTableName: true },
        timezone: '+00:00',
      }
    );

module.exports = sequelize;
