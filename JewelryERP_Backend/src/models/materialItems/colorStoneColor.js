const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");
const MaterialType = require("../../models/materialItems/materialType");

const ColorStoneColor = sequelize.define(
  "ColorStoneColor",
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
    colorstone_color: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    material_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: MaterialType,
        key: "id",
      },
    },
  },
  {
    tableName: "colorstone_colors",
    timestamps: false,
  }
);

ColorStoneColor.belongsTo(MaterialType, { foreignKey: "material_type_id", as: "materialType" });
MaterialType.hasMany(ColorStoneColor, { foreignKey: "material_type_id" });

module.exports = ColorStoneColor;
