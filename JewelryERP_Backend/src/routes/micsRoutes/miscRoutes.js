//#region imports
const miscRouter = require("express").Router();
const { validate, catchErrors } = require("../../errorHandlers");
const miscController=require('../../controllers/misc')

//#endregion

//#region routing

miscRouter.post("/brands",catchErrors(miscController.addBrand))

miscRouter.get("/brands",catchErrors(miscController.getAllBrands))

miscRouter.post("/gender",catchErrors(miscController.addGender))

miscRouter.get("/gender",catchErrors(miscController.getAllGenders))

miscRouter.post("/occasion",catchErrors(miscController.addOccasion))

miscRouter.get("/occasion",catchErrors(miscController.getAllOccasions))

miscRouter.post("/productType",catchErrors(miscController.addProductType))

miscRouter.get("/productType",catchErrors(miscController.getAllProductTypes))

miscRouter.post("/makeType",catchErrors(miscController.addMakeType))

miscRouter.get("/makeType",catchErrors(miscController.getAllMakeTypes))

miscRouter.post("/styles",catchErrors(miscController.addStyles))

miscRouter.get("/styles",catchErrors(miscController.getAllStyles))

//#endregion

module.exports = miscRouter;
