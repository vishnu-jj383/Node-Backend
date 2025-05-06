const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");
const MaterialType = require("../../models/materialItems/materialType");

const MetalClass = sequelize.define(
  "MetalClass",
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
    metal_class: {
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
    tableName: "metal_classes",
    timestamps: false,
  }
);

MetalClass.belongsTo(MaterialType, { foreignKey: "material_type_id", as: "materialType" });
MaterialType.hasMany(MetalClass, { foreignKey: "material_type_id" });

module.exports = MetalClass;
