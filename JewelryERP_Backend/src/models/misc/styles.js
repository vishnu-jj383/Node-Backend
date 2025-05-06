const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");

const Styles = sequelize.define(
  "Styles",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    style_name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    netsuite_id: {
      type: DataTypes.INTEGER,
      unique: true,
    },
  },
  {
    tableName: "styles",
    timestamps: false,
  }
);

module.exports = Styles;
