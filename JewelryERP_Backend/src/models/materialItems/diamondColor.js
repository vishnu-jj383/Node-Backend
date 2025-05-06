const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");
const MaterialType = require("../../models/materialItems/materialType");

const DiamondColor = sequelize.define(
  "DiamondColor",
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
    diamond_color: {
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
    tableName: "diamond_colors",
    timestamps: false,
  }
);

DiamondColor.belongsTo(MaterialType, { foreignKey: "material_type_id", as: "materialType" });
MaterialType.hasMany(DiamondColor, { foreignKey: "material_type_id" });

module.exports = DiamondColor;
