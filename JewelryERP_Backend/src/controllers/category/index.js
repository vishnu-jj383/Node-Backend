//#region imports
let categoryService = require("./controller");
//#endregion

//#region routes
module.exports.addCategoryGroup = async (req, res) => {
  let result = await categoryService.addCategoryGroup(req);
  res.status(result.status).send(result.data);
};

module.exports.getAllCategoryGroups = async (req, res) => {
  let result = await categoryService.getAllCategoryGroups(req);
  res.status(result.status).send(result.data);
};

module.exports.addCategory = async (req, res) => {
  let result = await categoryService.addCategory(req);
  res.status(result.status).send(result.data);
};

module.exports.getAllCategories = async (req, res) => {
  let result = await categoryService.getAllCategories(req.body.categoryGroupId);
  res.status(result.status).send(result.data);
};

module.exports.addSubcategory = async (req, res) => {
  let result = await categoryService.addSubcategory(req);
  res.status(result.status).send(result.data);
};

module.exports.getAllSubcategories = async (req, res) => {
  let result = await categoryService.getAllSubcategories(req.body.categoryId);
  res.status(result.status).send(result.data);
};
//#endregion
