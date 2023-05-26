const pg = require('pg');
const Sequelize = require('sequelize');

const { ConnectionError, ConnectionRefusedError, HostNotFoundError, HostNotReachableError, ConnectionTimedOutError, TimeoutError } = require('sequelize');

pg.types.setTypeParser(1114, str => str + 'Z');

require('dotenv').config();

const DBNAME = process.env.BACKUPDBNAME
const DBUSER = process.env.BACKUPDBUSER
const DBPORT = process.env.BACKUPDBPORT
const DBPASSWORD = process.env.BACKUPDBPASSWORD
const DBHOST = process.env.BACKUPDBHOST

module.exports = new Sequelize(DBNAME, DBUSER, DBPASSWORD, {
    host: DBHOST,
    port: DBPORT || 5432,
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
    },
    retry: {
        match: [ConnectionError, ConnectionRefusedError, HostNotFoundError, HostNotReachableError, ConnectionTimedOutError, TimeoutError],
        max: 3,
    }
});