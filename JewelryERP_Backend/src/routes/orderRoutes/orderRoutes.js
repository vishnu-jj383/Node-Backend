//#region imports
const orderRouter = require("express").Router();
const { validate, catchErrors } = require("../../errorHandlers");
const orderController=require('../../controllers/order')
const orderValidation=require('../../validations/order/orderValidation')

//#endregion

//#region routing


orderRouter.post("/createOrder",validate(orderValidation.createOrderValidation),catchErrors(orderController.createOrder));

orderRouter.put("/updateOrderStatus",catchErrors(orderController.updateOrderStatus));

orderRouter.put("/sketchStatus",catchErrors(orderController.updateOrderStatusToSketch));

orderRouter.post("/getAllOrders",catchErrors(orderController.getAllOrders));

orderRouter.post("/getOrderById",catchErrors(orderController.getOrderById));

orderRouter.put("/editOrder/:id",catchErrors(orderController.editOrder));

orderRouter.delete("/deleteOrder/:id",catchErrors(orderController.deleteOrder));

orderRouter.post("/uploadImage",catchErrors(orderController.uploadImage));

orderRouter.post("/searchOrders",catchErrors(orderController.searchOrders));

orderRouter.post("/getAllOrderNos",catchErrors(orderController.getAllOrderNos));
//#endregion

module.exports = orderRouter;
