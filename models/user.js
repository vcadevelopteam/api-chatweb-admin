const sequelize = require('sequelize');
const db = require('../config/database');

const User = db.define('usr', {
    userid: {
        primaryKey: true,
        type: sequelize.INTEGER
    },
    usr: {
        type: sequelize.STRING
    },
    doctype: {
        type: sequelize.STRING
    },
    docnum: {
        type: sequelize.STRING
    },
    pwd: {
        type: sequelize.STRING,
    },
    firstname: {
        type: sequelize.INTEGER
    },
    lastname: {
        type: sequelize.STRING
    },
    email: {
        type: sequelize.STRING
    },
    status: {
        type: sequelize.STRING
    },
    company: {
        type: sequelize.STRING
    },
    corporation: {
        type: sequelize.STRING
    },
})
module.exports = User;