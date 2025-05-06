//#region imports
const { statusCodes } = require("../../utils/constants");
const { Op } = require("sequelize");
const Brands = require("../../models/misc/brands");
const Gender = require("../../models/misc/gender");
const Occasion = require("../../models/misc/occasion");
const ProductType = require("../../models/misc/productTypes");
const MakeType = require("../../models/misc/makeType");
const Styles = require("../../models/misc/styles");

//#endregion

//#region modules

module.exports.addBrand = async (req) => {
  let brands = req.body;

  if (!brands || (Array.isArray(brands) && brands.length === 0)) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No brand data provided." },
    };
  }

  if (!Array.isArray(brands)) {
    brands = [brands];
  }

  const existingRecords = await Brands.findAll({
    where: {
      brand_name: { [Op.in]: brands.map((b) => b.brand_name) },
    },
  });

  const existingNames = new Set(existingRecords.map((r) => r.brand_name));

  const newBrands = brands.filter((b) => !existingNames.has(b.brand_name));

  if (newBrands.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: { message: "All records already exist!" },
    };
  }

  const insertedData = await Brands.bulkCreate(newBrands, {
    validate: true,
    ignoreDuplicates: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Brand(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllBrands = async () => {
  const brands = await Brands.findAll({
    attributes: ["id", "brand_name", "netsuite_id"],
    raw: true,
    nest: true,
  });

  if (brands.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No brands found!",
        data: [],
      },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Brands retrieved successfully!",
      data: brands,
    },
  };
};

module.exports.addGender = async (req) => {
  let genders = req.body;

  if (!genders || (Array.isArray(genders) && genders.length === 0)) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No gender data provided." },
    };
  }

  if (!Array.isArray(genders)) {
    genders = [genders];
  }

  const existingRecords = await Gender.findAll({
    where: {
      gender: { [Op.in]: genders.map((g) => g.gender) },
    },
  });

  const existingNames = new Set(existingRecords.map((r) => r.gender));

  const newGenders = genders.filter((g) => !existingNames.has(g.gender));

  if (newGenders.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: { message: "All records already exist!" },
    };
  }

  const insertedData = await Gender.bulkCreate(newGenders, {
    validate: true,
    ignoreDuplicates: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Gender(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllGenders = async () => {
  const genders = await Gender.findAll({
    attributes: ["id", "gender"],
    raw: true,
  });

  if (genders.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No genders found!",
        data: [],
      },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Genders retrieved successfully!",
      data: genders,
    },
  };
};

module.exports.addOccasion = async (req) => {
  let occasions = req.body;

  if (!occasions || (Array.isArray(occasions) && occasions.length === 0)) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No occasion data provided." },
    };
  }

  if (!Array.isArray(occasions)) {
    occasions = [occasions];
  }

  const existingRecords = await Occasion.findAll({
    where: {
      occasion: { [Op.in]: occasions.map((o) => o.occasion) },
    },
  });

  const existingNames = new Set(existingRecords.map((r) => r.occasion));

  const newOccasions = occasions.filter((o) => !existingNames.has(o.occasion));

  if (newOccasions.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: { message: "All records already exist!" },
    };
  }

  const insertedData = await Occasion.bulkCreate(newOccasions, {
    validate: true,
    ignoreDuplicates: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Occasion(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllOccasions = async () => {
  const occasions = await Occasion.findAll({
    attributes: ["id", "occasion", "netsuite_id"],
    raw: true,
  });

  if (occasions.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No occasions found!",
        data: [],
      },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Occasions retrieved successfully!",
      data: occasions,
    },
  };
};

module.exports.addProductType = async (req) => {
  let productTypes = req.body;

  if (
    !productTypes ||
    (Array.isArray(productTypes) && productTypes.length === 0)
  ) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No product type data provided." },
    };
  }

  if (!Array.isArray(productTypes)) {
    productTypes = [productTypes];
  }

  const existingRecords = await ProductType.findAll({
    where: {
      product_types: { [Op.in]: productTypes.map((pt) => pt.product_types) },
    },
  });

  const existingNames = new Set(existingRecords.map((r) => r.product_types));

  const newProductTypes = productTypes.filter(
    (pt) => !existingNames.has(pt.product_types)
  );

  if (newProductTypes.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: { message: "All records already exist!" },
    };
  }

  const insertedData = await ProductType.bulkCreate(newProductTypes, {
    validate: true,
    ignoreDuplicates: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Product type(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllProductTypes = async () => {
  const productTypes = await ProductType.findAll({
    attributes: ["id", "product_types", "netsuite_id"],
    raw: true,
  });

  if (productTypes.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: { message: "No product types found!", data: [] },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Product types retrieved successfully!",
      data: productTypes,
    },
  };
};

module.exports.addMakeType = async (req) => {
  let makeTypes = req.body;

  if (!makeTypes || (Array.isArray(makeTypes) && makeTypes.length === 0)) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No make type data provided." },
    };
  }

  if (!Array.isArray(makeTypes)) {
    makeTypes = [makeTypes];
  }

  const existingRecords = await MakeType.findAll({
    where: {
      make_name: { [Op.in]: makeTypes.map((mt) => mt.make_name) },
    },
  });

  const existingNames = new Set(existingRecords.map((r) => r.make_name));

  const newMakeTypes = makeTypes.filter(
    (mt) => !existingNames.has(mt.make_name)
  );

  if (newMakeTypes.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: { message: "All records already exist!" },
    };
  }

  const insertedData = await MakeType.bulkCreate(newMakeTypes, {
    validate: true,
    ignoreDuplicates: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Make type(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllMakeTypes = async () => {
  const makeTypes = await MakeType.findAll({
    attributes: ["id", "make_name", "netsuite_id"],
    raw: true,
  });

  if (makeTypes.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No make types found!",
        data: [],
      },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Make types retrieved successfully!",
      data: makeTypes,
    },
  };
};

module.exports.addStyles = async (req) => {
  let styles = req.body;

  if (!styles || (Array.isArray(styles) && styles.length === 0)) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: {
        status: false,
        message: "No styles data provided.",
      },
    };
  }

  if (!Array.isArray(styles)) {
    styles = [styles];
  }

  // Check for existing styles
  const existingRecords = await Styles.findAll({
    where: {
      style_name: { [Op.in]: styles.map((st) => st.style_name) },
    },
  });

  const existingNames = new Set(existingRecords.map((r) => r.style_name));
  const newStyles = styles.filter((st) => !existingNames.has(st.style_name));

  if (newStyles.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: {
        message: "All records already exist!",
      },
    };
  }

  const insertedData = await Styles.bulkCreate(newStyles, {
    validate: true,
    ignoreDuplicates: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Style(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllStyles = async () => {
  const styles = await Styles.findAll({
    attributes: ["id", "style_name", "netsuite_id"],
    raw: true,
  });

  if (styles.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No styles found!",
        data: [],
      },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Styles retrieved successfully!",
      data: styles,
    },
  };
};

//#endregion
