// const fs = require('fs');

console.log(process.env.DB_HOSTNAME);

module.exports = {
	development: {
		username: 'database_dev',
		password: 'database_dev',
		database: 'database_dev',
		host: '127.0.0.1',
		port: 5432,
		dialect: 'postgres',
		dialectOptions: {
			bigNumberStrings: true,
		},
	},
	test: {
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		host: process.env.DB_HOSTNAME,
		port: process.env.DB_PORT,
		dialect: 'postgres',
		logging: true,
		dialectOptions: {
			bigNumberStrings: true,
		},
	},
	production: {
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		host: process.env.DB_HOSTNAME,
		port: process.env.DB_PORT,
		dialect: 'postgres',
		dialectOptions: {
			bigNumberStrings: true,
			ssl: {
				// ca: fs.readFileSync(`${__dirname}/postgres-ca-master.crt`),
			},
		},
	},
};
