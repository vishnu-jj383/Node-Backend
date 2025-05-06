const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db"); // Adjust path as needed
const MaterialType = require("../../models/materialItems/materialType"); // Ensure correct path

const Shape = sequelize.define(
  "Shape",
  {
    shape_name: {
      type: DataTypes.STRING,
      allowNull: false, // Required field
    },
    material_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: MaterialType, // Foreign key relationship
        key: "id",
      },
    },
    netsuite_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "shapes",
    timestamps: true, // Enables createdAt and updatedAt fields
  }
);

// Establish Relationships with an Alias
Shape.belongsTo(MaterialType, {
  foreignKey: "material_type_id",
  as: "materialType",
});

MaterialType.hasMany(Shape, {
  foreignKey: "material_type_id",
  as: "shapes", 
});

module.exports = Shape;
