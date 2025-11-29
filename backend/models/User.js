module.exports = (sequelize, Sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    openid: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    nickname: {
      type: Sequelize.STRING,
      allowNull: true
    },
    avatar: {
      type: Sequelize.STRING,
      allowNull: true
    },
    createdAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    updatedAt: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW,
      onUpdate: Sequelize.NOW
    }
  }, {
    tableName: 'users',
    timestamps: true
  });

  return User;
};
