const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");
const CategoryGroup = require("../../models/categoryGoup/categoryGroup")

const Category = sequelize.define("Category", {
  category_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  category_code: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true, 
  },
  category_group_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: CategoryGroup, // Foreign key reference
      key: "id",
    },
  },
  netsuite_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
});

// Establishing Relationship (One Category Group -> Many Categories)
Category.belongsTo(CategoryGroup, { foreignKey: "category_group_id" });
CategoryGroup.hasMany(Category, { foreignKey: "category_group_id" });

module.exports = Category;
