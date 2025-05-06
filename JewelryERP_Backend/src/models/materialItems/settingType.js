const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");

const SettingType = sequelize.define("SettingType", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    unique: true,
  },
  netsuiteId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  settingType: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
});

module.exports = SettingType;
