const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");

const MetalType = sequelize.define(
  "MetalType",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    metal_type: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "metal_types",
    timestamps: false, // Adds createdAt & updatedAt fields
  }
);

module.exports = MetalType;
