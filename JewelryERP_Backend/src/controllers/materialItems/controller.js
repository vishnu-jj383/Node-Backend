//#region imports
const { Op } = require("sequelize");
const MaterialType = require("../../models/materialItems/materialType"); // Assuming this is the model path
const Shape = require("../../models/materialItems/shapes");
const ColorStoneQualityGroup = require("../../models/materialItems/colorStoneQualityGroup");
const ColorStoneQuality = require("../../models/materialItems/colorStoneQuality");
const DiamondQualityGroup = require("../../models/materialItems/diamondQualityGroup");
const DiamondQuality = require("../../models/materialItems/diamondQuality");
const { statusCodes } = require("../../utils/constants"); // Assuming you have a status code config
const DiamondSizeGroup = require("../../models/materialItems/diamondSizeGroup");
const DiamondStoneSize = require("../../models/materialItems/diamondStoneSize");
const DiamondColor = require("../../models/materialItems/diamondColor");
const MetalClass = require("../../models/materialItems/metalClass");
const MetalType = require("../../models/materialItems/metalType");
const MetalColor = require("../../models/materialItems/metalColor");
const MetalQuality = require("../../models/materialItems/metalQuality");
const MakeType = require("../../models/materialItems/makeType");
const SettingType = require("../../models/materialItems/settingType");
const Sieve = require("../../models/materialItems/sieve");
const ColorStoneColor = require("../../models/materialItems/colorStoneColor");

//#endregion

//#region modules

/*
 * Create a new category group
 * Supports both single and multiple document insertion
 */

module.exports.addMaterialType = async (req) => {
  let materialTypes = req.body;

  // Ensure the request contains data
  if (
    !materialTypes ||
    (Array.isArray(materialTypes) && materialTypes.length === 0)
  ) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No material type data provided." },
    };
  }

  let insertedData;

  // If the input is a single object, convert it to an array for consistency
  if (!Array.isArray(materialTypes)) {
    materialTypes = [materialTypes];
  }

  // Extract material_class values for duplicate check
  const materialClassNames = materialTypes.map((mt) => mt.material_class);

  // Check for existing records with the same material_class
  const existingRecords = await MaterialType.findAll({
    where: {
      material_class: { [Op.in]: materialClassNames },
    },
  });

  // Extract existing material_class names to compare
  const existingClasses = new Set(existingRecords.map((r) => r.material_class));

  const newMaterialTypes = materialTypes.filter(
    (mt) => !existingClasses.has(mt.material_class)
  );

  if (newMaterialTypes.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: {
        message: "All records already exist!",
      },
    };
  }

  // Insert the material types into the database
  insertedData = await MaterialType.bulkCreate(newMaterialTypes, {
    validate: true, // Ensures validation before insertion
    ignoreDuplicates: true, // Prevents inserting duplicates if unique constraints exist
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Material type(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllMaterialTypes = async () => {
  // Fetch all material types from the database
  const materialTypes = await MaterialType.findAll({
    attributes: ["id", "material_class", "netsuite_id"], // Adjust attributes as needed
  });

  // Check if data exists
  if (materialTypes.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No material types found!",
        data: [],
      },
    };
  }

  // Return the fetched material types
  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Material types retrieved successfully!",
      data: materialTypes,
    },
  };
};

module.exports.addShapes = async (req) => {
  let shapes = req.body;

  if (!shapes || (Array.isArray(shapes) && shapes.length === 0)) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No shape data provided." },
    };
  }

  if (!Array.isArray(shapes)) {
    shapes = [shapes];
  }

  // Validate material_type_id against MaterialType
  const materialTypeIds = shapes
    .map((s) => s.material_type_id)
    .filter((id) => id !== null && id !== undefined); // Exclude null/undefined
  let validMaterialTypeIds = new Set();
  if (materialTypeIds.length > 0) {
    const validMaterialTypes = await MaterialType.findAll({
      where: { id: { [Op.in]: materialTypeIds } },
      attributes: ["id"],
      raw: true,
    });
    validMaterialTypeIds = new Set(validMaterialTypes.map((mt) => mt.id));
  }

  const shapeCodes = shapes.map((s) => s.material_type_id);
  const existingRecords = await Shape.findAll({
    where: {
      material_type_id: { [Op.in]: shapeCodes.filter((id) => id !== null) },
    },
  });
  const existingShapeCodes = new Set(existingRecords.map((r) => r.material_type_id));

  const newShapes = shapes.filter((s) => {
    // Allow null material_type_id if intended, otherwise validate
    if (s.material_type_id === null || s.material_type_id === undefined) {
      return !existingShapeCodes.has(null); // Handle null case if needed
    }
    return (
      validMaterialTypeIds.has(s.material_type_id) &&
      !existingShapeCodes.has(s.material_type_id)
    );
  });

  if (newShapes.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: {
        message: "All shapes already exist or have invalid material_type_id!",
      },
    };
  }

  const insertedData = await Shape.bulkCreate(newShapes, {
    validate: true,
    ignoreDuplicates: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Shape(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllShapes = async () => {
  const shapes = await Shape.findAll({
    attributes: ["id", "shape_name", "netsuite_id", "material_type_id"],
    include: [
      {
        model: MaterialType,
        attributes: ["material_class"],
        as: "materialType",
      },
    ],
    raw: true,
    nest: true,
  });

  if (shapes.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No shapes found!",
        data: [],
      },
    };
  }

  const formattedShapes = shapes.map((shape) => ({
    id: shape.id,
    material_type_id: shape.material_type_id, // Fixed from shape_code
    shape_name: shape.shape_name,
    netsuite_id: shape.netsuite_id,
    material_class: shape.materialType?.material_class || null,
  }));

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Shapes retrieved successfully!",
      data: formattedShapes,
    },
  };
};

module.exports.addColorStoneQualityGroup = async (req) => {
  let qualityGroups = req.body;

  // Ensure data is provided
  if (
    !qualityGroups ||
    (Array.isArray(qualityGroups) && qualityGroups.length === 0)
  ) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No stone quality group data provided." },
    };
  }

  // Convert single object to array if necessary
  if (!Array.isArray(qualityGroups)) {
    qualityGroups = [qualityGroups];
  }

  // Extract stone_quality_group names for duplicate check
  const groupNames = qualityGroups.map((group) => group.stone_quality_group);

  // Check for existing records with the same stone_quality_group name
  const existingRecords = await ColorStoneQualityGroup.findAll({
    where: {
      stone_quality_group: { [Op.in]: groupNames },
    },
  });

  // Extract existing group names
  const existingNames = new Set(
    existingRecords.map((r) => r.stone_quality_group)
  );

  // Filter out duplicates
  const newQualityGroups = qualityGroups.filter(
    (group) => !existingNames.has(group.stone_quality_group)
  );

  if (newQualityGroups.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: { message: "All records already exist!" },
    };
  }

  // Insert new records into the database
  const insertedData = await ColorStoneQualityGroup.bulkCreate(
    newQualityGroups,
    {
      validate: true,
    }
  );

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Stone quality group(s) created successfully!",
      data: insertedData,
    },
  };
};

module.exports.getAllColorStoneQualityGroups = async () => {
  // Fetch all stone quality groups with material type name
  const qualityGroups = await ColorStoneQualityGroup.findAll({
    attributes: ["id", "stone_quality_group", "netsuite_id"],
    include: [
      {
        model: MaterialType,
        attributes: ["material_class"], // Assuming 'material_class' is the correct field name
        as: "materialType",
      },
    ],
    raw: true,
    nest: true,
  });

  // Check if data exists
  if (qualityGroups.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No stone quality groups found!",
        data: [],
      },
    };
  }

  // Format response to include material type name
  const formattedGroups = qualityGroups.map((group) => ({
    id: group.id,
    stone_quality_group: group.stone_quality_group,
    netsuite_id: group.netsuite_id,
    material_type_name: group.materialType
      ? group.materialType.material_class
      : null,
  }));

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Stone quality groups retrieved successfully!",
      data: formattedGroups,
    },
  };
};

module.exports.addColorStoneQuality = async (req) => {
  let colorStoneQualities = req.body;

  // Ensure the request contains data
  if (
    !colorStoneQualities ||
    (Array.isArray(colorStoneQualities) && colorStoneQualities.length === 0)
  ) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No color stone quality data provided." },
    };
  }

  // Convert single object to an array for consistency
  if (!Array.isArray(colorStoneQualities)) {
    colorStoneQualities = [colorStoneQualities];
  }

  // Extract stone_quality values for duplicate check
  const stoneQualityNames = colorStoneQualities.map((csq) => csq.stone_quality);

  // Check for existing records with the same stone_quality
  const existingRecords = await ColorStoneQuality.findAll({
    where: {
      stone_quality: { [Op.in]: stoneQualityNames },
    },
  });

  // Extract existing values to compare
  const existingNames = new Set(existingRecords.map((r) => r.stone_quality));

  // Filter out already existing records
  const newColorStoneQualities = colorStoneQualities.filter(
    (csq) => !existingNames.has(csq.stone_quality)
  );

  if (newColorStoneQualities.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: {
        message: "All records already exist!",
      },
    };
  }

  // Insert the new color stone qualities into the database
  const insertedData = await ColorStoneQuality.bulkCreate(
    newColorStoneQualities,
    {
      validate: true,
      ignoreDuplicates: true, // Prevents inserting duplicates if unique constraints exist
    }
  );

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Color stone quality(s) created successfully!",
      data: insertedData,
    },
  };
};

module.exports.getAllColorStoneQualities = async () => {
  // Fetch all Color Stone Qualities with related Material Type and Quality Group
  const colorStoneQualities = await ColorStoneQuality.findAll({
    attributes: ["id", "stone_quality", "netsuite_id"],
    include: [
      {
        model: MaterialType,
        attributes: ["material_class"],
        as: "materialType", // Ensure alias matches model association
      },
      {
        model: ColorStoneQualityGroup,
        attributes: ["stone_quality_group"],
        as: "colorStoneQualityGroup", // Ensure alias matches model association
      },
    ],
    raw: true, // Flattens result
    nest: true, // Keeps nested structure
  });

  // Check if no data exists
  if (colorStoneQualities.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No color stone qualities found!",
        data: [],
      },
    };
  }

  // Format response
  const formattedData = colorStoneQualities.map((item) => ({
    id: item.id,
    stone_quality: item.stone_quality,
    netsuite_id: item.netsuite_id,
    material_class: item.materialType?.material_class || null, // Safe handling
    stone_quality_group:
      item.colorStoneQualityGroup?.stone_quality_group || null, // Safe handling
  }));

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Color stone qualities retrieved successfully!",
      data: formattedData,
    },
  };
};

module.exports.addDiamondQualityGroup = async (req, res) => {
  let diamondQualityGroups = req.body;

  // Ensure the request contains data
  if (
    !diamondQualityGroups ||
    (Array.isArray(diamondQualityGroups) && diamondQualityGroups.length === 0)
  ) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No diamond quality group data provided." },
    };
  }

  let insertedData;

  // If the input is a single object, convert it to an array for consistency
  if (!Array.isArray(diamondQualityGroups)) {
    diamondQualityGroups = [diamondQualityGroups];
  }

  // Extract diamond_quality_group values for duplicate check
  const diamondQualityGroupNames = diamondQualityGroups.map(
    (group) => group.diamond_quality_group
  );

  // Check for existing records with the same diamond_quality_group
  const existingRecords = await DiamondQualityGroup.findAll({
    where: {
      diamond_quality_group: { [Op.in]: diamondQualityGroupNames },
    },
  });

  // Extract existing group names to compare
  const existingGroups = new Set(
    existingRecords.map((r) => r.diamond_quality_group)
  );

  const newDiamondQualityGroups = diamondQualityGroups.filter(
    (group) => !existingGroups.has(group.diamond_quality_group)
  );

  if (newDiamondQualityGroups.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: {
        message: "All records already exist!",
      },
    };
  }

  // Insert the diamond quality groups into the database
  insertedData = await DiamondQualityGroup.bulkCreate(diamondQualityGroups, {
    validate: true, // Ensures validation before insertion
    ignoreDuplicates: true, // Prevents inserting duplicates if unique constraints exist
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Diamond quality group(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllDiamondQualityGroups = async () => {
  // Fetch all Diamond Quality Groups with related MaterialType
  const diamondQualityGroups = await DiamondQualityGroup.findAll({
    attributes: ["id", "diamond_quality_group", "netsuite_id"],
    include: [
      {
        model: MaterialType,
        attributes: ["material_class"],
        as: "materialType", // Ensure alias matches model association
      },
    ],
    raw: true, // Flatten the result
    nest: true, // Keep nested structure
  });

  // Check if no data exists
  if (diamondQualityGroups.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No diamond quality groups found!",
        data: [],
      },
    };
  }

  // Format response
  const formattedData = diamondQualityGroups.map((item) => ({
    id: item.id,
    diamond_quality_group: item.diamond_quality_group,
    netsuite_id: item.netsuite_id,
    material_class: item.materialType?.material_class || null, // Safe handling for undefined
  }));

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Diamond quality groups retrieved successfully!",
      data: formattedData,
    },
  };
};

module.exports.addDiamondQuality = async (req) => {
  let diamondQualities = req.body;

  if (
    !diamondQualities ||
    (Array.isArray(diamondQualities) && diamondQualities.length === 0)
  ) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No diamond quality data provided." },
    };
  }

  if (!Array.isArray(diamondQualities)) {
    diamondQualities = [diamondQualities];
  }

  // Extracting existing names for duplicate check
  const diamondQualityNames = diamondQualities.map((dq) => dq.diamond_quality);

  const existingRecords = await DiamondQuality.findAll({
    where: {
      diamond_quality: { [Op.in]: diamondQualityNames },
    },
  });

  const existingNames = new Set(existingRecords.map((r) => r.diamond_quality));

  const newDiamondQualities = diamondQualities.filter(
    (dq) => !existingNames.has(dq.diamond_quality)
  );

  if (newDiamondQualities.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: { message: "All records already exist!" },
    };
  }

  const insertedData = await DiamondQuality.bulkCreate(newDiamondQualities, {
    validate: true,
    ignoreDuplicates: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Diamond quality(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllDiamondQualities = async () => {
  const diamondQualities = await DiamondQuality.findAll({
    attributes: ["id", "diamond_quality", "netsuite_id"],
    include: [
      {
        model: MaterialType,
        attributes: ["material_class"],
        as: "materialType",
      },
      {
        model: DiamondQualityGroup,
        attributes: ["diamond_quality_group"],
        as: "diamondQualityGroup",
      },
    ],
    raw: true,
    nest: true,
  });

  if (diamondQualities.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No diamond qualities found!",
        data: [],
      },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Diamond qualities retrieved successfully!",
      data: diamondQualities.map((dq) => ({
        id: dq.id,
        diamond_quality: dq.diamond_quality,
        netsuite_id: dq.netsuite_id,
        material_type: dq.materialType?.material_class || null,
        diamond_quality_group:
          dq.diamondQualityGroup?.diamond_quality_group || null,
      })),
    },
  };
};

module.exports.addDiamondSizeGroup = async (req, res) => {
  let diamondSizeGroups = req.body;

  // Ensure the request contains data
  if (
    !diamondSizeGroups ||
    (Array.isArray(diamondSizeGroups) && diamondSizeGroups.length === 0)
  ) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No Diamond Size Group data provided." },
    };
  }

  let insertedData;

  // If the input is a single object, convert it to an array for consistency
  if (!Array.isArray(diamondSizeGroups)) {
    diamondSizeGroups = [diamondSizeGroups];
  }

  // Extract diamond_size_group values for duplicate check
  const diamondSizeGroupNames = diamondSizeGroups.map(
    (group) => group.diamond_size_group
  );

  // Check for existing records with the same diamond_size_group
  const existingRecords = await DiamondSizeGroup.findAll({
    where: {
      diamond_size_group: {
        [Op.in]: diamondSizeGroupNames,
      },
    },
  });

  // Extract existing values to compare
  const existingNames = new Set(
    existingRecords.map((r) => r.diamond_size_group)
  );

  const newDiamondSizeGroups = diamondSizeGroups.filter(
    (group) => !existingNames.has(group.diamond_size_group)
  );

  if (newDiamondSizeGroups.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: {
        message: "All records already exist!",
      },
    };
  }

  // Insert the diamond size groups into the database
  insertedData = await DiamondSizeGroup.bulkCreate(diamondSizeGroups, {
    validate: true, // Ensures validation before insertion
    ignoreDuplicates: true, // Prevents inserting duplicates if unique constraints exist
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Diamond Size Group(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllDiamondSizeGroups = async () => {
  const diamondSizeGroups = await DiamondSizeGroup.findAll({
    attributes: ["id", "diamond_size_group", "netsuite_id"],
    include: [
      {
        model: MaterialType,
        attributes: ["material_class"],
        as: "materialType", // Alias to match association
      },
    ],
    raw: true, // Flatten the response
    nest: true, // Ensures nesting for included models
  });

  if (diamondSizeGroups.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No diamond size groups found!",
        data: [],
      },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Diamond size groups retrieved successfully!",
      data: diamondSizeGroups.map((dsg) => ({
        id: dsg.id,
        diamond_size_group: dsg.diamond_size_group,
        netsuite_id: dsg.netsuite_id,
        material_type: dsg.materialType?.material_class || null,
      })),
    },
  };
};

module.exports.addDiamondStoneSize = async (req) => {
  let stoneSizes = req.body;

  if (!stoneSizes || (Array.isArray(stoneSizes) && stoneSizes.length === 0)) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No diamond stone size data provided." },
    };
  }

  if (!Array.isArray(stoneSizes)) {
    stoneSizes = [stoneSizes];
  }

  const existingSizes = await DiamondStoneSize.findAll({
    where: {
      stone_size: { [Op.in]: stoneSizes.map((s) => s.stone_size) },
    },
  });

  const existingNames = new Set(existingSizes.map((s) => s.stone_size));

  const newStoneSizes = stoneSizes.filter(
    (s) => !existingNames.has(s.stone_size)
  );

  if (newStoneSizes.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: {
        message: "All records already exist!",
      },
    };
  }

  const insertedData = await DiamondStoneSize.bulkCreate(newStoneSizes, {
    validate: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Diamond stone size(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllDiamondStoneSizes = async () => {
  const diamondStoneSizes = await DiamondStoneSize.findAll({
    attributes: ["id", "stone_size", "sizeMm", "netsuite_id"],
    include: [
      {
        model: MaterialType,
        attributes: ["material_class"],
        as: "materialType",
      },
      {
        model: DiamondSizeGroup,
        attributes: ["diamond_size_group","id"],
        as: "diamondSizeGroup",
      },
    ],
    raw: true,
    nest: true,
  });

  // Filter out records where sizeMm is null
  const filteredSizes = diamondStoneSizes.filter((dss) => dss.sizeMm !== null);

  if (filteredSizes.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No valid diamond stone sizes found!",
        data: [],
      },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Diamond stone sizes retrieved successfully!",
      data: filteredSizes.map((dss) => ({
        id: dss.id,
        stone_size: dss.stone_size,
        sizeMm: dss.sizeMm,
        netsuite_id: dss.netsuite_id,
        material_type: dss.materialType?.material_class || null,
        diamond_size_group: dss.diamondSizeGroup?.diamond_size_group || null,
        diamond_size_group_id: dss.diamondSizeGroup?.id || null,
      })),
    },
  };
};


module.exports.addDiamondColor = async (req) => {
  let diamondColors = req.body;

  if (
    !diamondColors ||
    (Array.isArray(diamondColors) && diamondColors.length === 0)
  ) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No diamond color data provided." },
    };
  }

  if (!Array.isArray(diamondColors)) {
    diamondColors = [diamondColors];
  }

  const existingRecords = await DiamondColor.findAll({
    where: {
      diamond_color: {
        [Op.in]: diamondColors.map((dc) => dc.diamond_color),
      },
    },
  });

  const existingColors = new Set(existingRecords.map((dc) => dc.diamond_color));

  const newDiamondColors = diamondColors.filter(
    (dc) => !existingColors.has(dc.diamond_color)
  );

  if (newDiamondColors.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: { message: "All records already exist!" },
    };
  }

  const insertedData = await DiamondColor.bulkCreate(newDiamondColors, {
    validate: true,
    ignoreDuplicates: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Diamond color(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllDiamondColors = async () => {
  const diamondColors = await DiamondColor.findAll({
    attributes: ["id", "diamond_color", "netsuite_id"],
    include: [
      {
        model: MaterialType,
        attributes: ["material_class"],
        as: "materialType",
      },
    ],
    raw: true,
    nest: true,
  });

  if (diamondColors.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No diamond colors found!",
        data: [],
      },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Diamond colors retrieved successfully!",
      data: diamondColors.map((dc) => ({
        id: dc.id,
        diamond_color: dc.diamond_color,
        netsuite_id: dc.netsuite_id,
        material_type: dc.materialType?.material_class || null,
      })),
    },
  };
};

module.exports.addMetalClass = async (req) => {
  let metalClasses = req.body;

  if (
    !metalClasses ||
    (Array.isArray(metalClasses) && metalClasses.length === 0)
  ) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No metal class data provided." },
    };
  }

  if (!Array.isArray(metalClasses)) {
    metalClasses = [metalClasses];
  }

  const existingRecords = await MetalClass.findAll({
    where: {
      metal_class: {
        [Op.in]: metalClasses.map((mc) => mc.metal_class),
      },
    },
  });

  const existingClasses = new Set(existingRecords.map((mc) => mc.metal_class));

  const newMetalClasses = metalClasses.filter(
    (mc) => !existingClasses.has(mc.metal_class)
  );

  if (newMetalClasses.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: { message: "All records already exist!" },
    };
  }

  const insertedData = await MetalClass.bulkCreate(newMetalClasses, {
    validate: true,
    ignoreDuplicates: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Metal class(es) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllMetalClasses = async () => {
  const metalClasses = await MetalClass.findAll({
    attributes: ["id", "metal_class", "netsuite_id"],
    include: [
      {
        model: MaterialType,
        attributes: ["material_class"],
        as: "materialType",
      },
    ],
    raw: true,
    nest: true,
  });

  if (metalClasses.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No metal classes found!",
        data: [],
      },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Metal classes retrieved successfully!",
      data: metalClasses.map((mc) => ({
        id: mc.id,
        metal_class: mc.metal_class,
        netsuite_id: mc.netsuite_id,
        material_type: mc.materialType?.material_class || null,
      })),
    },
  };
};

module.exports.addMetalType = async (req) => {
  let metalTypes = req.body;

  if (!metalTypes || (Array.isArray(metalTypes) && metalTypes.length === 0)) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No metal type data provided." },
    };
  }

  if (!Array.isArray(metalTypes)) {
    metalTypes = [metalTypes];
  }

  const existingRecords = await MetalType.findAll({
    where: {
      metal_type: { [Op.in]: metalTypes.map((mt) => mt.metal_type) },
    },
  });

  const existingNames = new Set(existingRecords.map((r) => r.metal_type));

  const newMetalTypes = metalTypes.filter(
    (mt) => !existingNames.has(mt.metal_type)
  );

  if (newMetalTypes.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: { message: "All records already exist!" },
    };
  }

  const insertedData = await MetalType.bulkCreate(newMetalTypes, {
    validate: true,
    ignoreDuplicates: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Metal type(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllMetalTypes = async () => {
  const metalTypes = await MetalType.findAll({
    attributes: ["id", "metal_type"],
  });

  if (metalTypes.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No metal types found!",
        data: [],
      },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Metal types retrieved successfully!",
      data: metalTypes,
    },
  };
};

module.exports.addMetalColor = async (req) => {
  let metalColors = req.body;

  if (
    !metalColors ||
    (Array.isArray(metalColors) && metalColors.length === 0)
  ) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No metal color data provided." },
    };
  }

  if (!Array.isArray(metalColors)) {
    metalColors = [metalColors];
  }

  const existingRecords = await MetalColor.findAll({
    where: {
      metal_color_name: {
        [Op.in]: metalColors.map((mc) => mc.metal_color_name),
      },
    },
  });

  const existingNames = new Set(existingRecords.map((r) => r.metal_color_name));

  const newMetalColors = metalColors.filter(
    (mc) => !existingNames.has(mc.metal_color_name)
  );

  if (newMetalColors.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: { message: "All records already exist!" },
    };
  }

  const insertedData = await MetalColor.bulkCreate(newMetalColors, {
    validate: true,
    ignoreDuplicates: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Metal color(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllMetalColors = async () => {
  const metalColors = await MetalColor.findAll({
    attributes: ["id", "metal_color_name", "metal_color_code", "netsuite_id"],
    include: [
      {
        model: MetalClass,
        attributes: ["metal_class"],
        as: "metalClass",
      },
      {
        model: MaterialType,
        attributes: ["material_class"],
        as: "materialType",
      },
    ],
    raw: true,
    nest: true,
  });

  if (metalColors.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No metal colors found!",
        data: [],
      },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Metal colors retrieved successfully!",
      data: metalColors.map((mc) => ({
        id: mc.id,
        metal_color_name: mc.metal_color_name,
        metal_color_code: mc.metal_color_code,
        netsuite_id: mc.netsuite_id,
        metal_class: mc.metalClass?.metal_class || null,
        material_type: mc.materialType?.material_class || null,
      })),
    },
  };
};

module.exports.addMetalQuality = async (req) => {
  let metalQualities = req.body;

  if (
    !metalQualities ||
    (Array.isArray(metalQualities) && metalQualities.length === 0)
  ) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No metal quality data provided." },
    };
  }

  if (!Array.isArray(metalQualities)) {
    metalQualities = [metalQualities];
  }

  const existingRecords = await MetalQuality.findAll({
    where: {
      metal_quality: { [Op.in]: metalQualities.map((mq) => mq.metal_quality) },
    },
  });

  const existingNames = new Set(existingRecords.map((r) => r.metal_quality));

  const newMetalQualities = metalQualities.filter(
    (mq) => !existingNames.has(mq.metal_quality)
  );

  if (newMetalQualities.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: { message: "All records already exist!" },
    };
  }

  const insertedData = await MetalQuality.bulkCreate(newMetalQualities, {
    validate: true,
    ignoreDuplicates: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Metal quality(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllMetalQualities = async () => {
  const metalQualities = await MetalQuality.findAll({
    attributes: ["id", "metal_quality", "quality_mfg_clarity", "netsuite_id"],
    include: [
      {
        model: MetalClass,
        attributes: ["metal_class"],
      },
      {
        model: MaterialType,
        attributes: ["material_class"],
      },
    ],
    raw: true,
    nest: true,
  });

  if (metalQualities.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No metal qualities found!",
        data: [],
      },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Metal qualities retrieved successfully!",
      data: metalQualities.map((mq) => ({
        id: mq.id,
        metal_quality: mq.metal_quality,
        quality_mfg_clarity: mq.quality_mfg_clarity,
        netsuite_id: mq.netsuite_id,
        metal_class: mq["MetalClass.metal_class"] || null,
        material_type: mq["MaterialType.material_class"] || null,
      })),
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
    attributes: ["id", "netsuite_id", "make_name"],
    order: [["id", "DESC"]],
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Make types retrieved successfully",
      data: makeTypes,
    },
  };
};

module.exports.addSettingType = async (req) => {
  let settingTypes = req.body;

  if (
    !settingTypes ||
    (Array.isArray(settingTypes) && settingTypes.length === 0)
  ) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No setting type data provided." },
    };
  }

  if (!Array.isArray(settingTypes)) {
    settingTypes = [settingTypes];
  }

  const existingRecords = await SettingType.findAll({
    where: {
      settingType: { [Op.in]: settingTypes.map((st) => st.settingType) },
    },
  });

  const existingNames = new Set(existingRecords.map((r) => r.settingType));

  const newSettingTypes = settingTypes.filter(
    (st) => !existingNames.has(st.settingType)
  );

  if (newSettingTypes.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: { message: "All records already exist!" },
    };
  }

  const insertedData = await SettingType.bulkCreate(newSettingTypes, {
    validate: true,
    ignoreDuplicates: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Setting type(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllSettingTypes = async () => {
  const settingTypes = await SettingType.findAll({
    attributes: ["id", "netsuiteId", "settingType"],
    order: [["id", "DESC"]],
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Setting types retrieved successfully",
      data: settingTypes,
    },
  };
};

module.exports.addSieve = async (req) => {
  let sieves = req.body;

  if (!sieves || (Array.isArray(sieves) && sieves.length === 0)) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No sieve data provided." },
    };
  }

  if (!Array.isArray(sieves)) {
    sieves = [sieves];
  }

  // Normalize stoneWeight field name
  sieves = sieves.map((s) => ({
    ...s,
    stoneWeight: s.stoneWeight ?? s.stoneweight, // Use stoneWeight if available, else stoneweight
  }));

  // Log input data
  console.log("Input sieves:", JSON.stringify(sieves, null, 2));

  // Validate diamondStoneSizeId existence
  const stoneSizeIds = sieves
    .map((s) => s.diamondStoneSizeId)
    .filter((id) => id !== null && id !== undefined);
  const existingStoneSizes = await DiamondStoneSize.findAll({
    where: { id: { [Op.in]: stoneSizeIds } },
    attributes: ["id"],
  });

  const validStoneSizeIds = new Set(existingStoneSizes.map((s) => s.id));
  const invalidSieves = sieves.filter((s) => !validStoneSizeIds.has(s.diamondStoneSizeId));
  if (invalidSieves.length > 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Some diamond stone size IDs do not exist.",
        invalidIds: invalidSieves.map((s) => s.diamondStoneSizeId),
      },
    };
  }

  // Validate sieveSize and stoneWeight
  const isValidSieveSize = (sieveSize) =>
    sieveSize != null && typeof sieveSize === "string" && sieveSize.trim() !== "";
  const isValidStoneWeight = (stoneWeight) => {
    if (stoneWeight == null) return false;
    const num = typeof stoneWeight === "string" ? parseFloat(stoneWeight) : stoneWeight;
    return typeof num === "number" && !isNaN(num);
  };

  // Check for duplicates
  const existingSieves = await Sieve.findAll({
    where: {
      [Op.or]: sieves.map((s) => ({
        diamondStoneSizeId: s.diamondStoneSizeId,
        sieveSize: String(s.sieveSize),
      })),
    },
  });

  const existingEntries = new Set(
    existingSieves.map((s) => `${s.diamondStoneSizeId}-${String(s.sieveSize)}`)
  );

  const newSieves = sieves.filter((s) => {
    const key = `${s.diamondStoneSizeId}-${String(s.sieveSize)}`;
    if (!isValidSieveSize(s.sieveSize) || !isValidStoneWeight(s.stoneWeight)) {
      console.warn(`Invalid sieve data: ${JSON.stringify(s)}`);
      return false;
    }
    if (existingEntries.has(key)) {
      console.warn(`Duplicate sieve: ${key}`);
      return false;
    }
    return true;
  });

  if (newSieves.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: {
        message: "All sieve records already exist or have invalid data!",
      },
    };
  }

  try {
    const insertedData = await Sieve.bulkCreate(newSieves, {
      validate: true,
    });
    return {
      status: statusCodes.SUCCESS,
      data: {
        message: "Sieve(s) created successfully",
        data: insertedData,
      },
    };
  } catch (error) {
    if (error.name === "AggregateError") {
      const errorMessages = error.errors.map((err) => ({
        record: err.record,
        errors: err.errors.map((e) => ({
          field: e.path,
          message: e.message,
          value: e.value,
        })),
      }));
      return {
        status: statusCodes.BADREQUEST,
        data: {
          message: "Validation errors occurred during sieve creation",
          errors: errorMessages,
        },
      };
    }
    return {
      status: statusCodes.SERVERERROR,
      data: {
        message: "An error occurred while creating sieves",
        error: error.message,
      },
    };
  }
};

module.exports.getSieveByDiamondStoneSizeId = async (diamondStoneSizeId) => {
  if (!diamondStoneSizeId) {
    return {
      status: statusCodes.BADREQUEST,
      data: { message: "diamondStoneSizeId is required" },
    };
  }

  const sieveData = await Sieve.findOne({
    where: { diamondStoneSizeId: diamondStoneSizeId },
    attributes: ["id", "sieveSize", "stoneWeight"],
    include: [
      {
        model: DiamondStoneSize,
        as: "diamondStoneSize",
        attributes: ["id", "sizeMm"],
        include: [
          {
            model: DiamondSizeGroup,
            as: "diamondSizeGroup",
            attributes: ["id", "diamond_size_group"],
          },
        ],
      },
    ],
    raw: true,
    nest: true,
  });

  if (!sieveData) {
    return {
      status: statusCodes.NOTFOUND,
      data: { message: "No sieve data found for the given diamondStoneSizeId" },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Sieve data retrieved successfully",
      data: sieveData,
    },
  };
};

module.exports.addColorStoneColor = async (req) => {
  let colorStoneColor = req.body;

  if (
    !colorStoneColor ||
    (Array.isArray(colorStoneColor) && colorStoneColor.length === 0)
  ) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No colorstone color data provided." },
    };
  }

  if (!Array.isArray(colorStoneColor)) {
    colorStoneColor = [colorStoneColor];
  }

  const existingRecords = await ColorStoneColor.findAll({
    where: {
      colorstone_color: {
        [Op.in]: colorStoneColor.map((dc) => dc.colorstone_color),
      },
    },
  });

  const existingColors = new Set(existingRecords.map((dc) => dc.colorstone_color));

  const newcolorStoneColor = colorStoneColor.filter(
    (dc) => !existingColors.has(dc.colorstone_color)
  );

  if (newcolorStoneColor.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: { message: "All records already exist!" },
    };
  }

  const insertedData = await ColorStoneColor.bulkCreate(newcolorStoneColor, {
    validate: true,
    ignoreDuplicates: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Diamond color(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllColorStoneColors = async () => {
  const colorStoneColors = await ColorStoneColor.findAll({
    attributes: ["id", "colorstone_color", "netsuite_id"],
    include: [
      {
        model: MaterialType,
        attributes: ["material_class"],
        as: "materialType",
      },
    ],
    raw: true,
    nest: true,
  });

  if (colorStoneColors.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No diamond colors found!",
        data: [],
      },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "stone colors retrieved successfully!",
      data: colorStoneColors.map((dc) => ({
        id: dc.id,
        colorstone_color: dc.colorstone_color,
        netsuite_id: dc.netsuite_id,
        material_type: dc.materialType?.material_class || null,
      })),
    },
  };
};


//#endregion
