//#region imports
const customerRouter = require("express").Router();
const { validate, catchErrors } = require("../../errorHandlers");
const customerController = require("../../controllers/customers");

//#endregion

//#region routing

customerRouter.post(
  "/addCustomer",
  catchErrors(customerController.addCustomer)
);

customerRouter.get(
  "/getAllCustomers",
  catchErrors(customerController.getAllCustomers)
);

customerRouter.get("/:id", catchErrors(customerController.getCustomerById));

customerRouter.put(
  "/editCustomer/:id",
  catchErrors(customerController.editCustomer)
);

customerRouter.delete(
  "/deleteCustomer/:id",
  catchErrors(customerController.deleteCustomer)
);

customerRouter.post(
  "/getCustomers",
  catchErrors(customerController.getCustomers)
);

customerRouter.post(
  "/searchCustomers",
  catchErrors(customerController.searchCustomers)
);

//#endregion

module.exports = customerRouter;
