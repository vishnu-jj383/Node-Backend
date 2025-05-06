const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db"); 
const MetalClass = require("./metalClass");
const MaterialType = require("./materialType");

const MetalColor = sequelize.define(
  "MetalColor",
  {
    netsuite_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    metal_color_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    metal_color_code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    metal_class_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: MetalClass,
        key: "id",
      },
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
    tableName: "metal_colors",
    timestamps: false,
  }
);

MetalColor.belongsTo(MetalClass, { foreignKey: "metal_class_id", as: "metalClass" });
MetalColor.belongsTo(MaterialType, { foreignKey: "material_type_id", as: "materialType" });

module.exports = MetalColor;
