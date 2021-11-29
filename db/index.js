const { Sequelize } = require('sequelize');

const { DB_HOSTNAME, DB_USERNAME, DB_PASSWORD, DB_NAME } = process.env;

const sequelize = new Sequelize(DB_NAME, DB_USERNAME, DB_PASSWORD, {
	host: DB_HOSTNAME,
	dialect: 'postgres',
	logQueryParameters: true,
});

module.exports = {
	sequelize,
};
