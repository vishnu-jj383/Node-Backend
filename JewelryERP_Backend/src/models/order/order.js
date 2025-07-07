const { DataTypes } = require("sequelize");
const { sequelize } = require("../../configuration/db");
const Customer = require("../../models/customer/customer");
const ProductType = require("../../models/misc/productTypes");
const Gender = require("../../models/misc/gender");
const CategoryGroup = require("../../models/categoryGoup/categoryGroup");
const Category = require("../../models/category/category");
const Subcategory = require("../../models/subcategory/subcategory");
const Brand = require("../../models/misc/brands");
const Style = require("../../models/misc/styles");
const Occasion = require("../../models/misc/occasion");
const MetalType = require("../../models/materialItems/metalType");
const MetalColor = require("../../models/materialItems/metalColor");
const User = require("../auth/userModel");

const Order = sequelize.define("Order", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    unique: true,
  },
  orderNo: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false,
    defaultValue: function() {
      return 'ORD100';
    },
  },
  promiseDate: {
    type: DataTypes.DATE,
  },
  orderDate: {
    type: DataTypes.DATE,
  },
 statusDate: {
    type: DataTypes.DATE,
  },
  requiredDesignCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  customerId: {
    type: DataTypes.INTEGER,
    references: {
      model: Customer,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
  productTypeId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: ProductType,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  },
  genderId: {
    type: DataTypes.INTEGER,
    references: {
      model: Gender,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  },
  categoryGroupId: {
    type: DataTypes.INTEGER,
    references: {
      model: CategoryGroup,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  },
  categoryId: {
    type: DataTypes.INTEGER,
    references: {
      model: Category,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  },
  subcategoryId: {
    type: DataTypes.INTEGER,
    references: {
      model: Subcategory,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  },
  brandId: {
    type: DataTypes.INTEGER,
    references: {
      model: Brand,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  },
  styleId: {
    type: DataTypes.INTEGER,
    references: {
      model: Style,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  },
  occasionId: {
    type: DataTypes.INTEGER,
    references: {
      model: Occasion,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  },
  metalTypeId: {
    type: DataTypes.INTEGER,
    references: {
      model: MetalType,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  },
  metalColorId: {
    type: DataTypes.INTEGER,
    references: {
      model: MetalColor,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  },
  status: {
    type: DataTypes.ENUM("Pending", "Initiated", "Approved", "Rejected"),
    defaultValue: "Pending",
  },
  orderStatus: {
    type: DataTypes.ENUM("order","sketch", "cad","render","design"),
    defaultValue: "order",
  },
  expectedGrossWt: {
    type: DataTypes.FLOAT,
  },
  expectedNetWt: {
    type: DataTypes.FLOAT,
  },
  remarks: {
    type: DataTypes.TEXT,
  },
  diamondRange: {
    type: DataTypes.STRING,
  },
  colorStoneRange: {
    type: DataTypes.STRING,
  },
  priority: {
    type: DataTypes.STRING,
  },
  isItemReceived: {
    type: DataTypes.STRING,
  },
  imageUrls: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    comment: "Stores an array of image URLs",
  },
  reason:{
    type: DataTypes.STRING,
  },
  title:{
    type: DataTypes.STRING,
  },
  empId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "RESTRICT",
  },
  isExclusive:{
    type: DataTypes.BOOLEAN,
  },
});

// Hooks for incrementing orderNo with a prefix 'ORD' and starting from 'ORD100'
Order.beforeCreate(async (order, options) => {
    const lastOrder = await Order.findOne({
      order: [['id', 'DESC']],
      attributes: ['orderNo']
    });
    
    const lastOrderNo = lastOrder ? parseInt(lastOrder.orderNo.replace('ORD', '')) : 99;
    order.orderNo = `ORD${lastOrderNo + 1}`;
  });

// Establishing Relationships
Order.belongsTo(Customer, { foreignKey: "customerId" });
Customer.hasMany(Order, { foreignKey: "customerId" });

Order.belongsTo(ProductType, { foreignKey: "productTypeId" });
ProductType.hasMany(Order, { foreignKey: "productTypeId" });

Order.belongsTo(Gender, { foreignKey: "genderId" });
Gender.hasMany(Order, { foreignKey: "genderId" });

Order.belongsTo(CategoryGroup, { foreignKey: "categoryGroupId" });
CategoryGroup.hasMany(Order, { foreignKey: "categoryGroupId" });

Order.belongsTo(Category, { foreignKey: "categoryId" });
Category.hasMany(Order, { foreignKey: "categoryId" });

Order.belongsTo(Subcategory, { foreignKey: "subcategoryId" });
Subcategory.hasMany(Order, { foreignKey: "subcategoryId" });

Order.belongsTo(Brand, { foreignKey: "brandId" });
Brand.hasMany(Order, { foreignKey: "brandId" });

Order.belongsTo(Style, { foreignKey: "styleId" });
Style.hasMany(Order, { foreignKey: "styleId" });

Order.belongsTo(Occasion, { foreignKey: "occasionId" });
Occasion.hasMany(Order, { foreignKey: "occasionId" });

Order.belongsTo(MetalType, { foreignKey: "metalTypeId" });
MetalType.hasMany(Order, { foreignKey: "metalTypeId" });

Order.belongsTo(MetalColor, { foreignKey: "metalColorId" });
MetalColor.hasMany(Order, { foreignKey: "metalColorId" });

Order.belongsTo(User, { foreignKey: "empId" }); // New relationship
User.hasMany(Order, { foreignKey: "empId" });


module.exports = Order;
