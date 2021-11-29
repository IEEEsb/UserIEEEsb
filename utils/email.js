const nodemailer = require('nodemailer');

const configs = {};

module.exports.configEmail = (identifier, from, transport) => {
	configs[identifier] = {
		transport: nodemailer.createTransport(transport),
		from,
	};
};

module.exports.sendEmail = async (identifier, data) => {
	const config = configs[identifier];
	if (!config) {
		throw new Error('Config does not exists');
	}

	await config.transport.sendMail({
		from: config.from,
		to: data.to,
		subject: data.subject,
		text: data.text,
		html: data.html,
	});
};
