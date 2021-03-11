const sequelize = require('sequelize');
const db = require('../config/database');

const OrgUser = db.define('orguser', {
    corpid: {
        type: sequelize.INTEGER
    },
    orgid: {
        primaryKey: true,
        type: sequelize.INTEGER
    },
    userid: {
        type: sequelize.INTEGER
    },
    roleid: {
        primaryKey: true,
        type: sequelize.INTEGER
    },
    supervisor: {
        primaryKey: true,
        type: sequelize.INTEGER
    },
    bydefault: {
        type: sequelize.BOOLEAN
    },
    type: {
        type: sequelize.STRING
    },
})
module.exports = OrgUser;