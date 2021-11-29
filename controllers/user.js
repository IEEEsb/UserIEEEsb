const { Joi } = require('celebrate');
const ejs = require('ejs');
const { v4: uuidv4 } = require('uuid');
const Sequelize = require('sequelize');

const { FORGOT_PASSWORD_URL } = process.env;

const Utils = require('../utils');
const { User, ServiceRoles } = require('../db/models');
const { sequelize } = require('../db');

const { CustomError } = Utils.errors;
const { validate } = Utils.validators;
const { Service } = Utils.uServices.services;

const controller = new Utils.controller.Controller();

const createUserValidate = validate({
	body: Joi.object({
		firstName: Joi.string().required().trim().label('Nombre'),
		lastName: Joi.string().allow('').trim().label('Apellidos'),
		email: Joi.string().email().trim().lowercase().label('Email'),
		ieeeNumber: Joi.string().label('Número del IEEE'),
		password: Joi.string().length(64).hex().required().label('Contraseña'),
	}),
});

controller.post('/register', createUserValidate, async (req, res, next) => {
	try {
		const hashedPassword = Utils.auth.hash(req.body.password);
		await User.create({ ...req.body, password: hashedPassword });

		return res.sendStatus(204);
	} catch (error) {
		if (error instanceof Sequelize.UniqueConstraintError) {
			return next(new CustomError('Este email ya está registrado en la base de datos', 'email_already_registered', 400));
		}
		return next(error);
	}
});

const checkCredentialsValidate = validate({
	body: Joi.object({
		email: Joi.string().email().trim().lowercase().required().label('Email'),
		password: Joi.string().required().label('Contraseña'),
	}),
});
controller.post('/checkCredentials', Utils.controller.AllLoggedIn('Service'), checkCredentialsValidate, async (req, res, next) => {
	try {
		const { email, password } = req.body;

		const user = await User.findOne({ attributes: ['id', 'password'], where: { email: email.toLowerCase() } });
		if (!user) {
			throw new CustomError('El email o la contraseña son incorrectos', 'wrong_email_password', 400);
		}

		const hashedPassword = Utils.auth.hash(password);

		if (user.password !== hashedPassword) {
			throw new CustomError('El email o la contraseña son incorrectos', 'wrong_email_password', 400);
		}

		return res.send({ userId: user.id });
	} catch (error) {
		return next(error);
	}
});

const userValidate = validate({
	body: Joi.object({
		firstName: Joi.string().trim().label('Nombre'),
		lastName: Joi.string().allow('').trim().label('Apellidos'),
		email: Joi.string().email().trim().lowercase().label('Email'),
		ieeeNumber: Joi.string().label('Número del IEEE'),
	}),
});
controller.patch('/self', Utils.controller.loadSelfUser, userValidate, updateUser);
controller.patch('/:userId', Utils.controller.userHasAllRoles('admin'), userValidate, updateUser);
async function updateUser(req, res, next) {
	try {
		const [nRows, [user]] = await User.update(req.body, { where: { id: req.params.userId }, returning: ['id', 'email', 'firstName', 'lastName', 'ieeeNumber'] });
		if (nRows <= 0) {
			throw new CustomError('El usuario no existe', 'user_not_exist', 400);
		}

		// Utils.events.emitToUser(req.params.userId, 'user:self');

		res.send({ user });
	} catch (error) {
		next(error);
	}
}

controller.get('/all', Utils.controller.userHasAllRoles('admin'), async (req, res, next) => {
	try {
		const users = await User.findAll();

		res.send({ users });
	} catch (error) {
		next(error);
	}
});

controller.get('/self', Utils.controller.loadSelfUser, getUser);
controller.get('/:userId', Utils.controller.userHasAllRoles('admin'), getUser);
async function getUser(req, res, next) {
	try {
		const user = await User.findOne({ where: { id: req.params.userId } });
		if (!user) {
			throw new CustomError('El usuario no existe', 'user_not_exist', 400);
		}

		res.send({ user });
	} catch (error) {
		next(error);
	}
}

controller.get('/self/roles', Utils.controller.loadSelfUser, getUserRoles);
controller.get('/:userId/roles', Utils.controller.userHasAllRoles('admin'), getUserRoles);
async function getUserRoles(req, res, next) {
	try {
		const user = await User.findOne({ where: { id: req.params.userId }, include: ['servicesRoles'] });
		if (!user) {
			throw new CustomError('El usuario no existe', 'user_not_exist', 400);
		}

		const roles = user.servicesRoles.reduce((_roles, serviceRoles) => {
			_roles[serviceRoles.servicePath] = serviceRoles.roles;
			return _roles;
		}, {});

		return res.send({ roles });
	} catch (error) {
		return next(error);
	}
}

const rolesValidate = validate({
	body: Joi.object({
		roles: Joi.object().required().pattern(Joi.string().trim().lowercase(), Joi.array().required().items(Joi.string())),
	}).required(),
});

controller.patch('/:userId/roles', Utils.controller.userHasAllRoles('admin'), rolesValidate, async (req, res, next) => {
	const t = await sequelize.transaction();
	try {
		const user = await User.findOne({ where: { id: req.params.userId } });
		if (!user) {
			throw new CustomError('El usuario no existe', 'user_not_exist', 400);
		}
		const services = await Service.getAllServices();
		for (const servicePath in req.body.roles) {
			const service = services.find((_service) => _service.path === servicePath);
			if (!service) {
				throw new CustomError(`El servicio '${servicePath}' no existe`, 'service_not_exist', 400);
			}
			if (!req.body.roles[servicePath].every((role) => service.roles.includes(role))) {
				throw new CustomError('Alguno de los roles que has introducido no es válido', 'role_not_valid', 400);
			}
			await ServiceRoles.upsert({ roles: req.body.roles[servicePath], servicePath, user_id: req.params.userId }, {
				transaction: t,
			});
		}
		await t.commit();

		return res.sendStatus(204);
	} catch (error) {
		await t.rollback();
		return next(error);
	}
});

const forgotPasswordValidate = validate({
	body: Joi.object({
		email: Joi.string().email().trim().required().label('Email'),
	}),
});
controller.post('/forgotPassword', forgotPasswordValidate, async (req, res, next) => {
	try {
		const token = uuidv4();

		const [nRows] = await User.update({ forgotPasswordToken: token }, { where: { email: req.body.email } });
		if (nRows === 0) {
			throw new CustomError('Este email no está asociado a ningún usuario', 'email_not_exist', 400);
		}

		const html = await ejs.renderFile('./emails/forgotPassword.html', { token, url: FORGOT_PASSWORD_URL });
		const text = await ejs.renderFile('./emails/forgotPassword.txt', { token, url: FORGOT_PASSWORD_URL });

		await Utils.email.sendEmail('ieee', {
			to: req.body.email,
			subject: 'Restablecer contraseña',
			text,
			html,
		});

		return res.sendStatus(204);
	} catch (error) {
		return next(error);
	}
});

const changePasswordTokenValidate = validate({
	params: Joi.object({
		token: Joi.string().trim().guid().required().label('Token'),
	}),
	body: Joi.object({
		password: Joi.string().length(64).hex().required().label('Contraseña'),
	}),
});
controller.post('/changePassword/:token', changePasswordTokenValidate, async (req, res, next) => {
	try {
		const hashedPassword = Utils.auth.hash(req.body.password);

		const [nRows] = await User.update({ forgotPasswordToken: null }, { where: { forgotPasswordToken: req.params.token, password: hashedPassword } });
		if (nRows === 0) {
			throw new CustomError('El token que has introducido no existe en nuestra base de datos', 'token_not_exist', 400);
		}

		return res.sendStatus(204);
	} catch (error) {
		return next(error);
	}
});

const changePasswordValidate = validate({
	body: Joi.object({
		currentPassword: Joi.string().length(64).hex().required().label('Contraseña Actual'),
		newPassword: Joi.string().length(64).hex().required().label('Contraseña Nueva'),
	}),
});
controller.post('/self/changePassword', Utils.controller.loadSelfUser, changePasswordValidate, changePassword);
controller.post('/:userId/changePassword', Utils.controller.userHasAllRoles('admin'), changePasswordValidate, changePassword);
async function changePassword(req, res, next) {
	try {
		const currentHashedPassword = Utils.auth.hash(req.body.currentPassword);
		const newHashedPassword = Utils.auth.hash(req.body.newPassword);

		const [nRows] = await User.update({ password: newHashedPassword }, { where: { id: req.params.userId, password: currentHashedPassword } });
		if (nRows === 0) {
			throw new CustomError('El usuario no existe', 'user_not_exist', 400);
		}

		return res.sendStatus(204);
	} catch (error) {
		return next(error);
	}
}

module.exports.controller = controller;
