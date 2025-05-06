const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");
const Category = require("../../models/category/category");
const CategoryGroup = require("../../models/categoryGoup/categoryGroup");

const Subcategory = sequelize.define("Subcategory", {
  subcategory_code: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  subcategory_name: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  category_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Category,
      key: "id",
    },
  },
  netsuite_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  category_group_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: CategoryGroup,
      key: "id",
    },
  },
}, {
  tableName: "subcategories",
  timestamps: true,
});

// ✅ Fix: Use the same alias in associations and queries
Subcategory.belongsTo(CategoryGroup, { foreignKey: "category_group_id", as: "categoryGroup" });
CategoryGroup.hasMany(Subcategory, { foreignKey: "category_group_id", as: "subcategories" });

Subcategory.belongsTo(Category, { foreignKey: "category_id", as: "category" });
Category.hasMany(Subcategory, { foreignKey: "category_id", as: "subcategories" });

module.exports = Subcategory;
