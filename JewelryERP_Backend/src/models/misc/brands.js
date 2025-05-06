const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");

const Brands = sequelize.define(
  "Brands",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    netsuite_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    brand_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "brands",
    timestamps: true,
  }
);

module.exports = Brands;
