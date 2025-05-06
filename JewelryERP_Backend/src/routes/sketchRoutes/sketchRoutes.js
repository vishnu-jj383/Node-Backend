//#region imports
const sketchRouter = require("express").Router();
const { validate, catchErrors } = require("../../errorHandlers");
const sketchController=require('../../controllers/sketch')

//#endregion

//#region routing

sketchRouter.put("/editSketch/:id",catchErrors(sketchController.updateSketchDetails));

sketchRouter.post("/getAllSketches",catchErrors(sketchController.getAllSketches));

sketchRouter.get("/getSketch/:id",catchErrors(sketchController.getSketchById));

sketchRouter.delete("/deleteSketch/:id",catchErrors(sketchController.deleteSketch));

sketchRouter.put("/addSketcher",catchErrors(sketchController.addSketcher));

sketchRouter.put("/moveToCad",catchErrors(sketchController.updateSketchStatusToCad));

sketchRouter.post("/uploadImage",catchErrors(sketchController.uploadImage));

sketchRouter.put("/updateSketchStatus",catchErrors(sketchController.updateSketchStatus));

sketchRouter.post("/searchSketches",catchErrors(sketchController.searchSketches));

sketchRouter.post("/addSketch",catchErrors(sketchController.addSketch));

sketchRouter.post("/addSketchFromDesign",catchErrors(sketchController.addSketchFromDesign));

//#endregion

module.exports = sketchRouter;
