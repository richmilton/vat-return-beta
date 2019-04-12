const Sequelize = require ("sequelize");
require('dotenv').config();

const sqAdmin = new Sequelize(process.env.ADMIN_DBNAME,
  process.env.ADMIN_DBUSER,
  process.env.ADMIN_DBPASSWORD,
  {
    host: process.env.ADMIN_DBHOST,
    dialect: process.env.DBDIALECT,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

const sqPl = new Sequelize(process.env.PL_DBNAME,
  process.env.PL_DBUSER,
  process.env.PL_DBPASSWORD,
  {
    host: process.env.PL_DBHOST,
    dialect: process.env.DBDIALECT,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

const data = {
  sqAdmin,
  sqPl,
  Sequelize,
};

module.exports = data;
