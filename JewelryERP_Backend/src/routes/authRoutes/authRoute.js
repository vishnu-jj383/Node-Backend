//#region imports
const authRouter = require("express").Router();
const { validate, catchErrors } = require("../../errorHandlers");
const authController=require('../../controllers/auth')
const adminAuth = require("../../middleware/adminAuth");

//#endregion

//#region routing

authRouter.post("/signUp",catchErrors(authController.signup))

authRouter.post("/login",catchErrors(authController.login))

//authRouter.use(adminAuth)

authRouter.post("/addRole",catchErrors(authController.addRoles))

authRouter.post("/getAllRoles",catchErrors(authController.getAllRoles))

authRouter.post("/updateAccess",catchErrors(authController.updateAccess))

authRouter.post("/addUser",catchErrors(authController.addUser))

authRouter.put("/updateUser/:id",catchErrors(authController.updateUser))

authRouter.post("/getUsersByRoleType",catchErrors(authController.getUsersByRoleType))

authRouter.post("/getAllUsers",catchErrors(authController.getAllUsers))

authRouter.get("/getUserById/:id",catchErrors(authController.getUserById))

//#endregion

module.exports = authRouter;
