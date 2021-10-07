const pg = require('pg');
pg.types.setTypeParser(1114, str => str);

require('dotenv').config();
const Sequelize = require('sequelize');

const DBNAME = process.env.DBNAME
const DBUSER = process.env.DBUSER
const DBPASSWORD = process.env.DBPASSWORD
const DBHOST = process.env.DBHOST

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