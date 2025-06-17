//#region imports
let orderService = require("./controller");
//#endregion

//#region routes

module.exports.createOrder = async (req, res) => {
  let result = await orderService.createOrder(req.body);
  res.status(result.status).send(result.data);
};

module.exports.updateOrderStatus = async (req, res) => {
  let result = await orderService.updateOrderStatus(req.body);
  res.status(result.status).send(result.data);
};

module.exports.updateOrderStatusToSketch = async (req, res) => {
  let result = await orderService.updateOrderStatusToSketch(req.body.orderId);
  res.status(result.status).send(result.data);
};

module.exports.getAllOrders = async (req, res) => {
  let result = await orderService.getAllOrders(
    req.body.page,
    req.body.pageSize
  );
  res.status(result.status).send(result.data);
};

module.exports.getOrderById = async (req, res) => {
  let result = await orderService.getOrderById(req.body.orderId);
  res.status(result.status).send(result.data);
};

module.exports.editOrder = async (req, res) => {
  let result = await orderService.editOrder(req.params.id, req.body);
  res.status(result.status).send(result.data);
};

module.exports.deleteOrder = async (req, res) => {
  let result = await orderService.deleteOrder(req.params.id);
  res.status(result.status).send(result.data);
};

module.exports.uploadImage = async (req, res) => {
  let result = await orderService.uploadImage(req);
  res.status(result.status).send(result.data);
};

module.exports.updateEmpIdForOrder = async (req, res) => {
  let result = await orderService.updateEmpIdForOrder(req.body.orderId,req.body.empId);
  res.status(result.status).send(result.data);
};

module.exports.searchOrders = async (req, res) => {
  const { page = 1, pageSize = 10, ...filters } = req.body; // Extract page and pageSize from req.body
  let result = await orderService.searchOrders(filters,page,pageSize);
  res.status(result.status).send(result.data);
};

module.exports.getAllOrderNos = async (req, res) => {
  let result = await orderService.getAllOrderNos(req.body.searchQuery);
  res.status(result.status).send(result.data);
};


//#endregion
