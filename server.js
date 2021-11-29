const express = require('express');
const morgan = require('morgan');

const Utils = require('./utils');
const Api = require('./api');

const { PORT, GATEWAY_URL, GATEWAY_SECRET, SERVICE_SECRET, SERVICE_NAME, SERVICE_PATH, SERVICE_URL, EMAIL_FROM, EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD } = process.env;

Utils.email.configEmail('ieee', EMAIL_FROM, {
	host: EMAIL_HOST,
	port: EMAIL_PORT,
	secure: false,
	requireTLS: true,
	tls: {
		rejectUnauthorized: false,
	},
	auth: {
		user: EMAIL_USER,
		pass: EMAIL_PASSWORD,
	},
});

const app = express();

app.use(Utils.auth.authentication);

morgan.token('user', (req) => {
	if (req.userId) return `User: ${req.userId}`;
	if (req.servicePath) return `Service: ${req.servicePath}`;
	return 'not logged in';
});
app.use(morgan('[:date[iso]] :remote-addr (:user) :method :url :status :res[content-length] B - :response-time ms'));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false }));

app.use('/api', Api);

Utils.errors.handleErrors(app);

app.listen(PORT, async () => {
	console.log(`Server listening on port ${PORT}`);
	try {
		await Utils.uServices.init(GATEWAY_SECRET, GATEWAY_URL, {
			name: SERVICE_NAME,
			path: SERVICE_PATH,
			url: SERVICE_URL,
			secret: SERVICE_SECRET,
			roles: Utils.controller.ROLES,
		});
	} catch (err) {
		console.log(err);
	}
});
