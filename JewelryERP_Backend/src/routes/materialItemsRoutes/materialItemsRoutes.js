//#region imports
const materialItemsRouter = require("express").Router();
const { validate, catchErrors } = require("../../errorHandlers");
const materialItemsController=require('../../controllers/materialItems')

//#endregion

//#region routing

materialItemsRouter.post("/materialType",catchErrors(materialItemsController.addMaterialType))

materialItemsRouter.get("/materialType",catchErrors(materialItemsController.getAllMaterialTypes))

materialItemsRouter.post("/shapes",catchErrors(materialItemsController.addShapes))

materialItemsRouter.get("/shapes",catchErrors(materialItemsController.getAllShapes))

materialItemsRouter.post("/colorStoneQualityGroup",catchErrors(materialItemsController.addColorStoneQualityGroup))

materialItemsRouter.get("/colorStoneQualityGroup",catchErrors(materialItemsController.getAllColorStoneQualityGroups))

materialItemsRouter.post("/colorStoneQuality",catchErrors(materialItemsController.addColorStoneQuality))

materialItemsRouter.get("/colorStoneQuality",catchErrors(materialItemsController.getAllColorStoneQualities))

materialItemsRouter.post("/diamondQualityGroup",catchErrors(materialItemsController.addDiamondQualityGroup))

materialItemsRouter.get("/diamondQualityGroup",catchErrors(materialItemsController.getAllDiamondQualityGroups))

materialItemsRouter.post("/diamondQuality",catchErrors(materialItemsController.addDiamondQuality))

materialItemsRouter.get("/diamondQuality",catchErrors(materialItemsController.getAllDiamondQualities))

materialItemsRouter.post("/diamondSizeGroup",catchErrors(materialItemsController.addDiamondSizeGroup))

materialItemsRouter.get("/diamondSizeGroup",catchErrors(materialItemsController.getAllDiamondSizeGroups))

materialItemsRouter.post("/diamondStoneSize",catchErrors(materialItemsController.addDiamondStoneSize))

materialItemsRouter.get("/diamondStoneSize",catchErrors(materialItemsController.getAllDiamondStoneSizes))

materialItemsRouter.post("/diamondColor",catchErrors(materialItemsController.addDiamondColor))

materialItemsRouter.get("/diamondColor",catchErrors(materialItemsController.getAllDiamondColors))

materialItemsRouter.post("/metalClass",catchErrors(materialItemsController.addMetalClass))

materialItemsRouter.get("/metalClass",catchErrors(materialItemsController.getAllMetalClasses))

materialItemsRouter.post("/metalType",catchErrors(materialItemsController.addMetalType))

materialItemsRouter.get("/metalType",catchErrors(materialItemsController.getAllMetalTypes))

materialItemsRouter.post("/metalColor",catchErrors(materialItemsController.addMetalColor))

materialItemsRouter.get("/metalColor",catchErrors(materialItemsController.getAllMetalColors))

materialItemsRouter.post("/metalQuality",catchErrors(materialItemsController.addMetalQuality))

materialItemsRouter.get("/metalQuality",catchErrors(materialItemsController.getAllMetalQualities))

materialItemsRouter.post("/makeTypes",catchErrors(materialItemsController.addMakeType))

materialItemsRouter.get("/makeTypes",catchErrors(materialItemsController.getAllMakeTypes))

materialItemsRouter.post("/settingType",catchErrors(materialItemsController.addSettingType))

materialItemsRouter.get("/settingType",catchErrors(materialItemsController.getAllSettingTypes))

materialItemsRouter.post("/addSieve",catchErrors(materialItemsController.addSieve))

materialItemsRouter.get("/getSieve/:id",catchErrors(materialItemsController.getSieveByDiamondStoneSizeId))

materialItemsRouter.post("/addColorStoneColors",catchErrors(materialItemsController.addColorStoneColor))

materialItemsRouter.get("/getAllColorStoneColors",catchErrors(materialItemsController.getAllColorStoneColors))
//#endregion

module.exports = materialItemsRouter;
