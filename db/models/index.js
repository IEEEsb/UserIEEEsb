const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('..');

class User extends Model {}

User.init({
	id: { type: DataTypes.UUID, primaryKey: true, defaultValue: DataTypes.UUIDV4 },
	email: { type: DataTypes.STRING, unique: true, allowNull: false },
	password: { type: DataTypes.STRING, allowNull: false },
	firstName: { type: DataTypes.STRING, allowNull: false },
	lastName: { type: DataTypes.STRING },
	ieeeNumber: { type: DataTypes.STRING },
	forgotPasswordToken: { type: DataTypes.UUID },
}, {
	sequelize,
	modelName: 'User',
	tableName: 'users',
	defaultScope: {
		attributes: { exclude: ['password', 'forgotPasswordToken', 'createdAt', 'updatedAt'] },
	},
});

class ServiceRoles extends Model {}

ServiceRoles.init({
	roles: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
	servicePath: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
	user_id: { type: DataTypes.UUID, primaryKey: true, allowNull: false },
}, {
	sequelize,
	modelName: 'ServiceRoles',
	tableName: 'service_roles',
	defaultScope: {
		attributes: { exclude: ['createdAt', 'updatedAt'] },
	},
});

User.hasMany(ServiceRoles, { foreignKey: 'user_id', as: 'servicesRoles' });
ServiceRoles.belongsTo(User, { foreignKey: 'user_id', as: 'user', primaryKey: true, allowNull: false });

module.exports = {
	User,
	ServiceRoles,
};
