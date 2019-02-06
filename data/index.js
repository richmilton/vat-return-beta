const Sequelize = require ("sequelize");
const Op = Sequelize.Op;
require('dotenv').config();

let dbOptions = {
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {maxConnections: 10, minConnections: 1},
  dialectOptions: {dialect: process.env.DBDIALECT}
};

let sqAdmin = new Sequelize(process.env.ADMIN_DBNAME,
  process.env.ADMIN_DBUSER,
  process.env.ADMIN_DBPASSWORD,
  {
    host: process.env.ADMIN_DBHOST,
    dialect: process.env.DBDIALECT,
    operatorsAliases: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

let sqPl = new Sequelize(process.env.PL_DBNAME,
  process.env.PL_DBUSER,
  process.env.PL_DBPASSWORD,
  {
    host: process.env.PL_DBHOST,
    dialect: process.env.DBDIALECT,
    operatorsAliases: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });

let data = {};
data.sqAdmin = sqAdmin;
data.sqPl = sqPl;
data.Sequelize = Sequelize;


module.exports = data;
