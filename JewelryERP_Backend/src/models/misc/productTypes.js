const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");


const ProductType = sequelize.define(
  "ProductType",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    product_types: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    netsuite_id: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
  },
  {
    tableName: "product_types",
    timestamps: false,
  }
);

module.exports = ProductType;
