const { Router } = require('express');
const { CustomError } = require('./errors');
const Auth = require('./auth');

const { SERVICE_PATH } = process.env;

const serviceAuthRequiredError = new CustomError('Tienes que autenticarte como servicio para hacer esto', 'service_auth_required', 401);
const userAuthRequiredError = new CustomError('Tienes que autenticarte como usuario para hacer esto', 'auth_required', 401);
const notHasRolesError = new CustomError('No estás autorizado para hacer esto', 'user_not_has_roles', 403);

module.exports.ROLES = ['admin'];

module.exports.loadSelfUser = async (req, res, next) => {
	try {
		if (!req.userId) {
			throw userAuthRequiredError;
		}
		req.params.userId = req.userId;
		return next();
	} catch (error) {
		return next(error);
	}
};

module.exports.AllLoggedIn = (...modes) => async (req, res, next) => {
	try {
		for (const mode of modes) {
			if (mode === 'Service') {
				if (!req.servicePath) {
					throw serviceAuthRequiredError;
				}
			} else if (mode === 'User') {
				if (!req.userId) {
					throw userAuthRequiredError;
				}
			} else {
				throw new CustomError('El modo de autenticacion no está soportado', 'invalid_auth_mode', 500);
			}
		}
		return next();
	} catch (error) {
		return next(error);
	}
};

module.exports.AnyLoggedIn = (...modes) => async (req, res, next) => {
	try {
		for (const mode of modes) {
			if (mode === 'Service') {
				if (req.servicePath) {
					return next();
				}
			} else if (mode === 'User') {
				if (req.userId) {
					return next();
				}
			} else {
				throw new CustomError('El modo de autenticacion no está soportado', 'invalid_auth_mode', 500);
			}
		}
		throw new CustomError(`Tienes que autenticarte con alguno de estos métodos (${modes.join(',')}}) para hacer esto`, 'auth_required', 401);
	} catch (error) {
		return next(error);
	}
};

module.exports.userHasAllRoles = (...roles) => async (req, res, next) => {
	try {
		if (!req.userId) {
			throw userAuthRequiredError;
		}
		if (!(await Auth.userHasAllRoles(SERVICE_PATH, req.userId, roles))) {
			throw notHasRolesError;
		}
		return next();
	} catch (error) {
		return next(error);
	}
};

module.exports.userHasAnyRoles = (...roles) => async (req, res, next) => {
	try {
		if (!req.userId) {
			throw userAuthRequiredError;
		}

		if (!(await Auth.userHasAnyRoles(SERVICE_PATH, req.userId, roles))) {
			throw notHasRolesError;
		}
		return next();
	} catch (error) {
		return next(error);
	}
};

class Controller {
	constructor() {
		this.router = new Router();
	}

	get(path, ...callbacks) {
		this.router.get(path, ...callbacks);
	}

	post(path, ...callbacks) {
		this.router.post(path, ...callbacks);
	}

	patch(path, ...callbacks) {
		this.router.patch(path, ...callbacks);
	}

	put(path, ...callbacks) {
		this.router.put(path, ...callbacks);
	}

	delete(path, ...callbacks) {
		this.router.delete(path, ...callbacks);
	}

	all(path, ...callbacks) {
		this.router.all(path, ...callbacks);
	}

	use(...args) {
		this.router.use(...args);
	}

	mount(app, path) {
		app.use(path, this.router);
	}
}

module.exports.Controller = Controller;
