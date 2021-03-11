require('dotenv').config({ path: 'variables.env' });
const Sequelize = require('sequelize');

const DBNAME = "VCACHATWEB";
const DBUSER =  "postgres";
const DBPASSWORD =  "vcaADMIN/*2019";
const DBHOST =  "10.240.55.4";

module.exports = new Sequelize(DBNAME, DBUSER, DBPASSWORD, {
    host: DBHOST,
    dialect: 'postgres',
    logging: false,
    define: {
        freezeTableName: true,
        timestamps: false
    },
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});