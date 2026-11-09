const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
    "User",
    {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },

        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },

        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },

        password_hash: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        provider: {
            type: DataTypes.ENUM("local", "google", "github"),
            defaultValue: "local",
        },

        provider_id: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        email_verified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },

        verification_token_hash: {
        type: DataTypes.STRING,
        allowNull: true,
        },

        verification_expiry: {
        type: DataTypes.DATE,
        allowNull: true,
        },

        reset_token_hash: {
        type: DataTypes.STRING,
      allowNull: true,
        },

      reset_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
      },
    },
    {
        tableName: "users",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
    }
);

module.exports = User;