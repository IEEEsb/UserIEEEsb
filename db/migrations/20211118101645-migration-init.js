module.exports = {
	up: async (queryInterface, Sequelize) => {
		await queryInterface.createTable('users', {
			id: { type: Sequelize.DataTypes.UUID, primaryKey: true, defaultValue: Sequelize.DataTypes.UUIDV4 },
			email: { type: Sequelize.DataTypes.STRING, unique: true, allowNull: false },
			password: { type: Sequelize.DataTypes.STRING, allowNull: false },
			firstName: { type: Sequelize.DataTypes.STRING, allowNull: false },
			lastName: { type: Sequelize.DataTypes.STRING },
			ieeeNumber: { type: Sequelize.DataTypes.STRING },
			forgotPasswordToken: { type: Sequelize.DataTypes.UUID },
			createdAt: {
				allowNull: false,
				type: Sequelize.DataTypes.DATE,
			},
			updatedAt: {
				allowNull: false,
				type: Sequelize.DataTypes.DATE,
			},
		});

		await queryInterface.createTable('service_roles', {
			roles: { type: Sequelize.DataTypes.ARRAY(Sequelize.DataTypes.STRING), defaultValue: [] },
			servicePath: { type: Sequelize.DataTypes.STRING, primaryKey: true, allowNull: false },
			user_id: {
				type: Sequelize.DataTypes.UUID,
				references: {
					model: {
						tableName: 'users',
					},
					key: 'id',
				},
				primaryKey: true,
				allowNull: false,
			},
			createdAt: {
				allowNull: false,
				type: Sequelize.DataTypes.DATE,
			},
			updatedAt: {
				allowNull: false,
				type: Sequelize.DataTypes.DATE,
			},
		});
	},

	down: async (queryInterface) => {
		await queryInterface.dropTable('service_roles');
		await queryInterface.dropTable('users');
	},
};
