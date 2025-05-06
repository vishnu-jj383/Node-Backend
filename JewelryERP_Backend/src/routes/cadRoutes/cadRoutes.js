//#region imports
const cadRouter = require("express").Router();
const { validate, catchErrors } = require("../../errorHandlers");
const cadController=require('../../controllers/cad')

//#endregion

//#region routing

cadRouter.post("/uploadImage",catchErrors(cadController.uploadImage));

cadRouter.put("/addCadDesigner",catchErrors(cadController.addCadDesigner));

cadRouter.post("/getAllCads",catchErrors(cadController.getAllCads));

cadRouter.put("/updateCad/:id",catchErrors(cadController.updateCad));

cadRouter.get("/getCadById/:id",catchErrors(cadController.getCadById));

cadRouter.post("/addAssemblyItem",catchErrors(cadController.addAssemblyItem));

cadRouter.post("/getAssemblyItemsByCadId",catchErrors(cadController.getAssemblyItemsByCadId));

cadRouter.put("/moveToRender",catchErrors(cadController.updateCadStatusToRender));

cadRouter.put("/updateCadStatus",catchErrors(cadController.updateCadStatus));

cadRouter.post("/searchCads",catchErrors(cadController.searchCads));

cadRouter.post("/addCad",catchErrors(cadController.addCad));

cadRouter.post("/addCadFromDesign",catchErrors(cadController.addCadFromDesign));

cadRouter.delete("/deleteAssemblyItem/:id",catchErrors(cadController.deleteAssemblyItem));
//#endregion

module.exports = cadRouter;
