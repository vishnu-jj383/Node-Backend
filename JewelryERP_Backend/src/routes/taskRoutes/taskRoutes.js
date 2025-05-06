//#region imports
const taskRouter = require("express").Router();
const { validate, catchErrors } = require("../../errorHandlers");
const taskController=require('../../controllers/Task')

//#endregion

//#region routing

taskRouter.post("/uploadImage",catchErrors(taskController.uploadImage));

taskRouter.post("/getAllTasksByType",catchErrors(taskController.getAllTasksByType));

taskRouter.post("/getTasksByOrderIdOrType",catchErrors(taskController.getTasksByOrderIdOrType));

taskRouter.post("/selectedCustomerImages",catchErrors(taskController.updateSelectedImagesCustomer));

taskRouter.post("/selectedDewImages",catchErrors(taskController.updateSelectedImagesDew));

taskRouter.post("/customerApprove",catchErrors(taskController.updateApprovalStatusCustomer));

taskRouter.post("/ownApprove",catchErrors(taskController.updateApprovalStatusOwn));

taskRouter.put("/updateTask/:id",catchErrors(taskController.updateTask));

taskRouter.get("/getTaskById/:id",catchErrors(taskController.getTaskById));

taskRouter.delete("/deleteImages",catchErrors(taskController.deleteImages));

taskRouter.post("/workInProgressReport",catchErrors(taskController.workInProgress));

taskRouter.post("/searchWorkInProgress",catchErrors(taskController.searchWorkInProgress));

taskRouter.post("/getTaskImagesByType",catchErrors(taskController.getTaskImagesByType));

taskRouter.post("/searchTaskImagesByType",catchErrors(taskController.searchTaskImagesByType));

//#endregion

module.exports = taskRouter;