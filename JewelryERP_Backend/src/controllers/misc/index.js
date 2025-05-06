//#region imports
let categoryService = require("./controller");
//#endregion

//#region routes
module.exports.addBrand = async (req, res) => {
  let result = await categoryService.addBrand(req);
  res.status(result.status).send(result.data);
};

module.exports.getAllBrands = async (req, res) => {
  let result = await categoryService.getAllBrands(req);
  res.status(result.status).send(result.data);
};

module.exports.addGender = async (req, res) => {
    let result = await categoryService.addGender(req);
    res.status(result.status).send(result.data);
  };
  
  module.exports.getAllGenders = async (req, res) => {
    let result = await categoryService.getAllGenders(req);
    res.status(result.status).send(result.data);
  };

  module.exports.addOccasion = async (req, res) => {
    let result = await categoryService.addOccasion(req);
    res.status(result.status).send(result.data);
  };
  
  module.exports.getAllOccasions = async (req, res) => {
    let result = await categoryService.getAllOccasions(req);
    res.status(result.status).send(result.data);
  };

  module.exports.addProductType = async (req, res) => {
    let result = await categoryService.addProductType(req);
    res.status(result.status).send(result.data);
  };
  
  module.exports.getAllProductTypes = async (req, res) => {
    let result = await categoryService.getAllProductTypes(req);
    res.status(result.status).send(result.data);
  };

  module.exports.addMakeType = async (req, res) => {
    let result = await categoryService.addMakeType(req);
    res.status(result.status).send(result.data);
  };
  
  module.exports.getAllMakeTypes = async (req, res) => {
    let result = await categoryService.getAllMakeTypes(req);
    res.status(result.status).send(result.data);
  };

  module.exports.addStyles = async (req, res) => {
    let result = await categoryService.addStyles(req);
    res.status(result.status).send(result.data);
  };
  
  module.exports.getAllStyles = async (req, res) => {
    let result = await categoryService.getAllStyles(req);
    res.status(result.status).send(result.data);
  };
//#endregion
