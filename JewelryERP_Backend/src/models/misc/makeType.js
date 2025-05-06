const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");

const MakeType = sequelize.define(
  "MakeType",
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
    make_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "make_types",
    timestamps: false,
  }
);

module.exports = MakeType;
