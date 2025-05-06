//#region imports
const { statusCodes } = require("../../utils/constants");
const { Op } = require("sequelize");
const CategoryGroup = require("../../models/categoryGoup/categoryGroup");
const Category = require("../../models/category/category");
const Subcategory = require("../../models/subcategory/subcategory");

//#endregion

//#region modules

/*
 * Create a new category group
 * Supports both single and multiple document insertion
 */
module.exports.addCategoryGroup = async (req) => {
  let categoryGroups = req.body;

  // Ensure the request contains data
  if (
    !categoryGroups ||
    (Array.isArray(categoryGroups) && categoryGroups.length === 0)
  ) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No category group data provided." },
    };
  }

  let insertedData;

  // If the input is a single object, convert it to an array for consistency
  if (!Array.isArray(categoryGroups)) {
    categoryGroups = [categoryGroups];
  }

  // Extract category_group_code and category_group_name values for duplicate check
  const categoryGroupCodes = categoryGroups.map((cg) => cg.category_group_code);
  const categoryGroupNames = categoryGroups.map((cg) => cg.category_group_name);

  // Check for existing records with the same category_group_code or category_group_name
  const existingRecords = await CategoryGroup.findAll({
    where: {
      [Op.or]: [
        { category_group_code: { [Op.in]: categoryGroupCodes } },
        { category_group_name: { [Op.in]: categoryGroupNames } },
      ],
    },
  });

  // Extract existing values to compare
  const existingCodes = new Set(
    existingRecords.map((r) => r.category_group_code)
  );
  const existingNames = new Set(
    existingRecords.map((r) => r.category_group_name)
  );

  const newCategoryGroups = categoryGroups.filter(
    (cg) =>
      !existingCodes.has(cg.category_group_code) &&
      !existingNames.has(cg.category_group_name)
  );

  if (newCategoryGroups.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: {
        message: "All records already exist!",
      },
    };
  }

  // Insert the category groups into the database
  insertedData = await CategoryGroup.bulkCreate(categoryGroups, {
    validate: true, // Ensures validation before insertion
    ignoreDuplicates: true, // Prevents inserting duplicates if unique constraints exist
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Category group(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllCategoryGroups = async () => {
  // Fetch all category groups from the database
  const categoryGroups = await CategoryGroup.findAll({
    attributes: [
      "id",
      "category_group_code",
      "category_group_name",
      "netsuite_id",
    ],
  });

  // Check if data exists
  if (categoryGroups.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No category groups found!",
        data: [],
      },
    };
  }
  // Return the fetched category groups
  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Category groups retrieved successfully!",
      data: categoryGroups,
    },
  };
};

module.exports.addCategory = async (req, res) => {
  let categories = req.body;

  // Convert single object to array if necessary
  if (!Array.isArray(categories)) {
    categories = [categories];
  }

  // Extract category codes and names
  const categoryCodes = categories.map((category) => category.category_code);
  const categoryNames = categories.map((category) => category.category_name);

  // Check for existing records
  const existingCategories = await Category.findAll({
    where: {
      [Op.or]: [
        { category_code: categoryCodes },
        { category_name: categoryNames },
      ],
    },
  });

  if (existingCategories.length > 0) {
    return {
      status: statusCodes.CONFLICT,
      data: {
        message: "Duplicate entry found for category code or name.",
        errorDetails: existingCategories,
      },
    };
  }

  // Bulk Insert
  const newCategories = await Category.bulkCreate(categories, {
    validate: true,
    individualHooks: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Categories created successfully!",
      data: newCategories,
    },
  };
};

module.exports.getAllCategories = async (categoryGroupId) => {
  const whereCondition = categoryGroupId ? { category_group_id:categoryGroupId } : {};
  const categories = await Category.findAll({
    attributes: ["id", "category_name", "category_code", "netsuite_id"],
    where: whereCondition,
    include: [
      {
        model: CategoryGroup,
        attributes: ["category_group_name"],
        as: "categoryGroup",
      },
    ],
    raw: true, // Flatten the response
    nest: true, // Ensures nesting for included models
  });
 
  // Flatten the categoryGroup field
  const formattedCategories = categories.map((category) => ({
    id: category.id,
    category_name: category.category_name,
    category_code: category.category_code,
    netsuite_id: category.netsuite_id,
    category_group_name: category.categoryGroup.category_group_name, // Extract and rename
  }));
  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Categories retrieved successfully",
      data: formattedCategories,
    },
  };
};

module.exports.addSubcategory = async (req, res) => {
  let subcategories = req.body;

  // Convert single object to array if necessary
  if (!Array.isArray(subcategories)) {
    subcategories = [subcategories];
  }

  // Extract subcategory codes and names
  const subcategoryCodes = subcategories.map((sub) => sub.subcategory_code);
  const subcategoryNames = subcategories.map((sub) => sub.subcategory_name);

  // Check for existing records
  const existingSubcategories = await Subcategory.findAll({
    where: {
      [Op.or]: [
        { subcategory_code: subcategoryCodes },
        { subcategory_name: subcategoryNames },
      ],
    },
  });

  if (existingSubcategories.length > 0) {
    return {
      status: statusCodes.CONFLICT,
      data: {
        message: "Duplicate entry found for subcategory code or name.",
        errorDetails: existingSubcategories,
      },
    };
  }

  // Bulk Insert
  const newSubcategories = await Subcategory.bulkCreate(subcategories, {
    validate: true,
    individualHooks: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Subcategories created successfully!",
      data: newSubcategories,
    },
  };
};

module.exports.addSubcategory = async (req, res) => {
  let subcategories = req.body;

  // Convert single object to array if necessary
  if (!Array.isArray(subcategories)) {
    subcategories = [subcategories];
  }

  // Extract subcategory codes and names
  const subcategoryCodes = subcategories.map((sub) => sub.subcategory_code);
  const subcategoryNames = subcategories.map((sub) => sub.subcategory_name);

  // Check for existing records
  const existingSubcategories = await Subcategory.findAll({
    where: {
      [Op.or]: [
        { subcategory_code: subcategoryCodes },
        { subcategory_name: subcategoryNames },
      ],
    },
  });

  if (existingSubcategories.length > 0) {
    return {
      status: statusCodes.CONFLICT,
      data: {
        message: "Duplicate entry found for subcategory code or name.",
        errorDetails: existingSubcategories,
      },
    };
  }

  // Bulk Insert
  const newSubcategories = await Subcategory.bulkCreate(subcategories, {
    validate: true,
    individualHooks: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Subcategories created successfully!",
      data: newSubcategories,
    },
  };
};

module.exports.getAllSubcategories = async (categoryId) => {
  const whereCondition = categoryId ? { category_id:categoryId } : {};
  const subcategories = await Subcategory.findAll({
    attributes: ["id", "subcategory_name", "subcategory_code", "netsuite_id"],
    where:whereCondition,
    include: [
      {
        model: Category,
        attributes: ["category_name"],
        as: "category",
      },
      {
        model: CategoryGroup,
        attributes: ["category_group_name"],
        as: "categoryGroup",
      },
    ],
    raw: true, // Flatten the response
    nest: true, // Ensures nesting for included models
  });

  // Flatten the category and categoryGroup fields
  const formattedSubcategories = subcategories.map((subcategory) => ({
    id: subcategory.id,
    subcategory_name: subcategory.subcategory_name,
    subcategory_code: subcategory.subcategory_code,
    netsuite_id: subcategory.netsuite_id,
    category_name: subcategory.category.category_name, // Extract and rename
    category_group_name: subcategory.categoryGroup.category_group_name, // Extract and rename
  }));

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Subcategories retrieved successfully",
      data: formattedSubcategories,
    },
  };
};
//#endregion
