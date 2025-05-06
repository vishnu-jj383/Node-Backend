const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");

const Role = sequelize.define(
  "Role",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      unique: true,
    },
    roleName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    type: {
      type: DataTypes.ENUM("management","marketing","productDevelopment"),
    },
  },
  {
    tableName: "Roles",
    timestamps: false,
  }
);

module.exports = Role;
