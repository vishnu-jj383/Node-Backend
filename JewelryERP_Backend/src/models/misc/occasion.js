const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");

const Occasion = sequelize.define(
  "Occasion",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    occasion: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    netsuite_id: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: true,
    },
  },
  {
    tableName: "occasion",
    timestamps: false,
  }
);

module.exports = Occasion;
