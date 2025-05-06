//#region imports
let materialItemService = require("./controller");
//#endregion

//#region routes
module.exports.addMaterialType = async (req, res) => {
  let result = await materialItemService.addMaterialType(req);
  res.status(result.status).send(result.data);
};

module.exports.getAllMaterialTypes = async (req, res) => {
  let result = await materialItemService.getAllMaterialTypes(req);
  res.status(result.status).send(result.data);
};

module.exports.addShapes = async (req, res) => {
  let result = await materialItemService.addShapes(req);
  res.status(result.status).send(result.data);
};

module.exports.getAllShapes = async (req, res) => {
  let result = await materialItemService.getAllShapes(req);
  res.status(result.status).send(result.data);
};

module.exports.addColorStoneQualityGroup = async (req, res) => {
  let result = await materialItemService.addColorStoneQualityGroup(req);
  res.status(result.status).send(result.data);
};

module.exports.getAllColorStoneQualityGroups = async (req, res) => {
  let result = await materialItemService.getAllColorStoneQualityGroups(req);
  res.status(result.status).send(result.data);
};

module.exports.addColorStoneQuality = async (req, res) => {
  let result = await materialItemService.addColorStoneQuality(req);
  res.status(result.status).send(result.data);
};

module.exports.getAllColorStoneQualities = async (req, res) => {
  let result = await materialItemService.getAllColorStoneQualities(req);
  res.status(result.status).send(result.data);
};

module.exports.addDiamondQualityGroup = async (req, res) => {
  let result = await materialItemService.addDiamondQualityGroup(req);
  res.status(result.status).send(result.data);
};

module.exports.getAllDiamondQualityGroups = async (req, res) => {
  let result = await materialItemService.getAllDiamondQualityGroups(req);
  res.status(result.status).send(result.data);
};

module.exports.addDiamondQuality = async (req, res) => {
  let result = await materialItemService.addDiamondQuality(req);
  res.status(result.status).send(result.data);
};

module.exports.getAllDiamondQualities = async (req, res) => {
  let result = await materialItemService.getAllDiamondQualities(req);
  res.status(result.status).send(result.data);
};

module.exports.addDiamondSizeGroup = async (req, res) => {
    let result = await materialItemService.addDiamondSizeGroup(req);
    res.status(result.status).send(result.data);
  };
  
  module.exports.getAllDiamondSizeGroups = async (req, res) => {
    let result = await materialItemService.getAllDiamondSizeGroups(req);
    res.status(result.status).send(result.data);
  };

  module.exports.addDiamondStoneSize = async (req, res) => {
    let result = await materialItemService.addDiamondStoneSize(req);
    res.status(result.status).send(result.data);
  };
  
  module.exports.getAllDiamondStoneSizes = async (req, res) => {
    let result = await materialItemService.getAllDiamondStoneSizes(req);
    res.status(result.status).send(result.data);
  };

  module.exports.addDiamondColor = async (req, res) => {
    let result = await materialItemService.addDiamondColor(req);
    res.status(result.status).send(result.data);
  };
  
  module.exports.getAllDiamondColors = async (req, res) => {
    let result = await materialItemService.getAllDiamondColors(req);
    res.status(result.status).send(result.data);
  };

  module.exports.addMetalClass = async (req, res) => {
    let result = await materialItemService.addMetalClass(req);
    res.status(result.status).send(result.data);
  };
  
  module.exports.getAllMetalClasses = async (req, res) => {
    let result = await materialItemService.getAllMetalClasses(req);
    res.status(result.status).send(result.data);
  };

  module.exports.addMetalType = async (req, res) => {
    let result = await materialItemService.addMetalType(req);
    res.status(result.status).send(result.data);
  };
  
  module.exports.getAllMetalTypes = async (req, res) => {
    let result = await materialItemService.getAllMetalTypes(req);
    res.status(result.status).send(result.data);
  };

  module.exports.addMetalColor = async (req, res) => {
    let result = await materialItemService.addMetalColor(req);
    res.status(result.status).send(result.data);
  };
  
  module.exports.getAllMetalColors = async (req, res) => {
    let result = await materialItemService.getAllMetalColors(req);
    res.status(result.status).send(result.data);
  };

  module.exports.addMetalQuality = async (req, res) => {
    let result = await materialItemService.addMetalQuality(req);
    res.status(result.status).send(result.data);
  };
  
  module.exports.getAllMetalQualities = async (req, res) => {
    let result = await materialItemService.getAllMetalQualities(req);
    res.status(result.status).send(result.data);
  };

  module.exports.addMakeType = async (req, res) => {
    let result = await materialItemService.addMakeType(req);
    res.status(result.status).send(result.data);
  };

  module.exports.getAllMakeTypes = async (req, res) => {
    let result = await materialItemService.getAllMakeTypes(req);
    res.status(result.status).send(result.data);
  };

  module.exports.addSettingType = async (req, res) => {
    let result = await materialItemService.addSettingType(req);
    res.status(result.status).send(result.data);
  };

  module.exports.getAllSettingTypes = async (req, res) => {
    let result = await materialItemService.getAllSettingTypes(req);
    res.status(result.status).send(result.data);
  };

  module.exports.addSieve = async (req, res) => {
    let result = await materialItemService.addSieve(req);
    res.status(result.status).send(result.data);
  };

  module.exports.getSieveByDiamondStoneSizeId = async (req, res) => {
    let result = await materialItemService.getSieveByDiamondStoneSizeId(req.params.id);
    res.status(result.status).send(result.data);
  };

  module.exports.addColorStoneColor = async (req, res) => {
    let result = await materialItemService.addColorStoneColor(req);
    res.status(result.status).send(result.data);
  };

  module.exports.getAllColorStoneColors = async (req, res) => {
    let result = await materialItemService.getAllColorStoneColors(req);
    res.status(result.status).send(result.data);
  };
//#endregion
