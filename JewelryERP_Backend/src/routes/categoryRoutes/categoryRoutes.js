//#region imports
const categoryRouter = require("express").Router();
const { validate, catchErrors } = require("../../errorHandlers");
const categoryController=require('../../controllers/category')

//#endregion

//#region routing

categoryRouter.post("/categoryGroup",catchErrors(categoryController.addCategoryGroup))

categoryRouter.get("/categoryGroup",catchErrors(categoryController.getAllCategoryGroups))

categoryRouter.post("/category",catchErrors(categoryController.addCategory))

categoryRouter.post("/getAllcategories",catchErrors(categoryController.getAllCategories))

categoryRouter.post("/subcategory",catchErrors(categoryController.addSubcategory))

categoryRouter.post("/getAllSubcategories",catchErrors(categoryController.getAllSubcategories))

//#endregion

module.exports = categoryRouter;
