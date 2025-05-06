//#region imports
let albumService = require("./controller");
//#endregion

//#region routes
module.exports.sendAlbum = async (req, res) => {
  let result = await albumService.sendAlbum(req.body);
  res.status(result.status).send(result.data);
};

module.exports.createAlbum = async (req, res) => {
  let result = await albumService.createAlbum(req);
  res.status(result.status).send(result.data);
};

module.exports.getAllAlbum = async (req, res) => {
  let result = await albumService.getAllAlbum(req);
  res.status(result.status).send(result.data);
};

module.exports.getAlbumsByCustomerId = async (req, res) => {
  let result = await albumService.getAlbumsByCustomerId(req.params.id,req.body.page,req.body.pageSize);
  res.status(result.status).send(result.data); 
};;

module.exports.sendAlbumByEmail = async (req, res) => {
  let result = await albumService.sendAlbumByEmail(req.body.albumId,req.body.designPageLink);
  res.status(result.status).send(result.data); 
};

module.exports.getDesignsByAlbumId = async (req, res) => {
  let result = await albumService.getDesignsByAlbumId(req.body.albumId,req.body.designPageLink);
  res.status(result.status).send(result.data); 
};

module.exports.searchAlbumsByCustomer = async (req, res) => {
  let result = await albumService.searchAlbumsByCustomer(req);
  res.status(result.status).send(result.data);
};

module.exports.searchAlbumsOfCustomer = async (req, res) => {
  let result = await albumService.searchAlbumsOfCustomer(req);
  res.status(result.status).send(result.data);
};

//#endregion
