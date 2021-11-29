const { isCelebrateError } = require('celebrate');
const Sequelize = require('sequelize');

class CustomError extends Error {
	constructor(message, code, httpStatus) {
		super(message);
		this.errObject = { message, code };
		this.httpStatus = httpStatus;
	}
}

module.exports.CustomError = CustomError;

function IsErrorCheckerHandler(err) {
	if (err instanceof Error) {
		console.log(err);
		throw err;
	}

	throw new CustomError('No existe el endpoint que has introducido', 'unknown_endpoint', 400);
}

function JWTErrorHandler(err, req, res, next) {
	if (err.name !== 'JsonWebTokenError') {
		return next(err);
	}
	return res.status(400).send({
		message: 'El token que has introducido no es válido',
		code: 'invalid_jwt_token',
		violations: err.message,
	});
}

function CustomErrorHandler(err, req, res, next) {
	if (!(err instanceof CustomError)) {
		return next(err);
	}
	return res.status(err.httpStatus).send(err.errObject);
}

function CelebrateErrorHandler(err, req, res, next) {
	if (!isCelebrateError(err)) {
		return next(err);
	}
	return res.status(400).send({
		message: 'Alguno de los campos que has introducido no es válido',
		code: 'invalid_fields',
		violations: Object.fromEntries(err.details),
	});
}

function ParserErrorHandler(err, req, res, next) {
	if (err.type !== 'entity.parse.failed') {
		return next(err);
	}
	return res.status(400).send({
		message: "Invalid JSON object in the request's body",
		code: 'invalid_json_body',
	});
}

function SequelizeErrorHandler(err, req, res, next) {
	if (!(err instanceof Sequelize.BaseError)) {
		return next(err);
	}
	console.log(err);
	if (err instanceof Sequelize.UniqueConstraintError) {
		return res.status(400).send({
			message: 'El objeto que has intentado introducir ya existe',
			code: 'sequelize_unique_error',
		});
	}

	return res.status(400).send({
		message: 'Sequelize Error',
		code: 'sequelize_error',
	});
}

// eslint-disable-next-line no-unused-vars
function GlobalErrorHandler(err, req, res, next) {
	console.error(err);
	return res.status(500).send({
		message: 'Internal server error',
		code: 'internal_server_error',
	});
}

module.exports.handleErrors = (app) => {
	app.use(IsErrorCheckerHandler);
	app.use(JWTErrorHandler);
	app.use(CustomErrorHandler);
	app.use(CelebrateErrorHandler);
	app.use(ParserErrorHandler);
	app.use(SequelizeErrorHandler);
	app.use(GlobalErrorHandler);
};
