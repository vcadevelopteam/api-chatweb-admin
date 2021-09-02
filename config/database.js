require('dotenv').config({ path: 'variables.env' });
const Sequelize = require('sequelize');

const DBNAME = "laraigodev";
const DBUSER = "admin";
const DBPASSWORD = "Sistemas247";
const DBHOST = "d5f3bbe9-f872-48c5-93b0-768afcc6a391.4b2136ddd30a46e9b7bdb2b2db7f8cd0.private.databases.appdomain.cloud";

module.exports = new Sequelize(DBNAME, DBUSER, DBPASSWORD, {
    host: DBHOST,
    port: 30503,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
        ssl: {
            require: true,
            // Ref.: https://github.com/brianc/node-postgres/issues/2009
            rejectUnauthorized: false,
        },
        keepAlive: true,
    },
    ssl: true,
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