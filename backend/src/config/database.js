'use strict';
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize("postgres://neondb_owner:npg_vLDfXAgUh69t@ep-lively-salad-a1dszp17-pooler.ap-southeast-1.aws.neon.tech/connect_flow?sslmode=require", {
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
});

module.exports = sequelize;
