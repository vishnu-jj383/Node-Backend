//#region imports
let customerAlbumService = require("./controller");
//#endregion

//#region routes
module.exports.getAllDesignsForCustomer = async (req, res) => {
  let result = await customerAlbumService.getAllDesignsForCustomer(
    req.params.id
  );
  res.status(result.status).send(result.data);
};

module.exports.getDesignById = async (req, res) => {
  let result = await customerAlbumService.getDesignById(req.params.id);
  res.status(result.status).send(result.data);
};

module.exports.getAllDesignsForDew = async (req, res) => {
  let result = await customerAlbumService.getAllDesignsForDew();
  res.status(result.status).send(result.data);
};

module.exports.addCustomerFeedback = async (req, res) => {
  let result = await customerAlbumService.addCustomerFeedback(req);
  res.status(result.status).send(result.data);
};

module.exports.getAllCustomerDesignUpdates = async (req, res) => {
  let result = await customerAlbumService.getAllCustomerDesignUpdates(req);
  res.status(result.status).send(result.data);
};

module.exports.searchCustomerFeedback = async (req, res) => {
  let result = await customerAlbumService.searchCustomerFeedback(req);
  res.status(result.status).send(result.data);
};

module.exports.getAlbumsByCustomerId = async (req, res) => {
  let result = await customerAlbumService.getAlbumsByCustomerId(req.params.id);
  res.status(result.status).send(result.data);
};

module.exports.getAllDesignsForAlbum = async (req, res) => {
  let result = await customerAlbumService.getAllDesignsForAlbum(req.params.id);
  res.status(result.status).send(result.data);
};
//#endregion
