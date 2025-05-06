const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");

const CategoryGroup = sequelize.define(
  "categoryGroup",
  {
    category_group_code: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    category_group_name: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    netsuite_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    tableName: "categoryGroups", // Explicitly define table name
    timestamps: true, // Enable createdAt & updatedAt timestamps
  }
);

module.exports = CategoryGroup;
