const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");

const Gender = sequelize.define(
  "Gender",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    gender: {
      type: DataTypes.ENUM("KIDS", "LADIES", "GENTS"),
      allowNull: false,
    },
  },
  {
    tableName: "gender",
    timestamps: false,
  }
);

module.exports = Gender;
