//#region imports
const { statusCodes, folderPrefix } = require("../../utils/constants");
const { Op, Sequelize } = require("sequelize");
const Task = require("../../models/task/taskModel");
const { format } = require("date-fns");
const Cad = require("../../models/cad/cad");
const {
  checkFileType,
  getFileExtensionFromMimeType,
} = require("../../Helper/fileUpload/extractExtension");
const { uploadFileToCdn } = require("../../Helper/fileUpload/fileUploadHelper");
const Order = require("../../models/order/order");
const AssemblyItem = require("../../models/assemblyItems/asseblyItems");
const Sketch = require("../../models/sketches/sketches");
const ProductType = require("../../models/misc/productTypes");
const MakeType = require("../../models/materialItems/makeType");
const MetalType = require("../../models/materialItems/metalType");
const MetalColor = require("../../models/materialItems/metalColor");
const MaterialType = require("../../models/materialItems/materialType");
const MetalClass = require("../../models/materialItems/metalClass");
const MetalQuality = require("../../models/materialItems/metalQuality");
const DiamondColor = require("../../models/materialItems/diamondColor");
const DiamondSizeGroup = require("../../models/materialItems/diamondSizeGroup");
const DiamondStoneSize = require("../../models/materialItems/diamondStoneSize");
const DiamondQualityGroup = require("../../models/materialItems/diamondQualityGroup");
const DiamondQuality = require("../../models/materialItems/diamondQuality");
const ColorStoneQualityGroup = require("../../models/materialItems/colorStoneQualityGroup");
const Shape = require("../../models/materialItems/shapes");
const ColorStoneQuality = require("../../models/materialItems/colorStoneQuality");
const Render = require("../../models/render/render");
const ColorStoneColor = require("../../models/materialItems/colorStoneColor");
const Sieve = require("../../models/materialItems/sieve");
const { sequelize } = require("../../configuration/db");
const User = require("../../models/auth/userModel");
const Customer = require("../../models/customer/customer");
const Gender = require("../../models/misc/gender");
const CategoryGroup = require("../../models/categoryGoup/categoryGroup");
const Category = require("../../models/category/category");
const Subcategory = require("../../models/subcategory/subcategory");
const Brands = require("../../models/misc/brands");
const Styles = require("../../models/misc/styles");
const Occasion = require("../../models/misc/occasion");
const Role = require("../../models/auth/roles");
const Design = require("../../models/design/design");
//#endregion

//#region modules
module.exports.uploadImage = async (req) => {
  if (!req.body.cadId) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "Cad ID required" },
    };
  }
  let img = [],
    imgUrl = [];
  if (req.files && req.files?.images) {
    if (!Array.isArray(req.files.images)) img.push(req.files.images);
    else img = req.files.images;
    for (let i = 0; i < img.length; i++) {
      let result = await checkFileType(img[i].mimetype);
      if (!result) {
        return {
          status: statusCodes.NOTACCEPTABLE,
          data: { message: "check file type" },
        };
      }
    }

    for (let i = 0; i < img.length; i++) {
      let fileExtension = getFileExtensionFromMimeType(img[i].mimetype);
      let fileName = `${folderPrefix.CAD}${img[i].name.replace(
        /\s/g,
        ""
      )}_${Date.now()}${fileExtension}`;
      let upload = await uploadFileToCdn(
        img[i].data,
        fileName,
        img[i].mimetype
      );
      if (!upload.status) {
        return {
          status: statusCodes.UNPROCESSED,
          data: { message: upload.message },
        };
      }
      imgUrl.push(`${upload.url}`);
    }

    let cad = await Cad.findByPk(req.body.cadId);
    if (!cad) {
      return {
        status: statusCodes.NOTFOUND,
        data: { message: "cad not found" },
      };
    }

    // Append new images to existing ones (if any)
    let existingImages = cad.imageUrls || [];
    cad.imageUrls = [...existingImages, ...imgUrl];

    await cad.save();
    let fullImageUrls = cad.imageUrls.map(
      (img) => `${process.env.AWS_IMAGE_URL}/${img}`
    );

    return {
      status: statusCodes.SUCCESS,
      data: fullImageUrls,
    };
  } else {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "Image is required" },
    };
  }
};

module.exports.addCadDesigner = async (req, res) => {
  const { empId, startDate, endDate, completedDate, id, type } = req.body;

  if (!empId) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: {
        message: "Cad Designer ID is required",
      },
    };
  }

  const cad = await Cad.findOne({
    where: { id },
    attributes: ["id", "orderId"],
  });

  if (!cad) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Cad not found",
      },
    };
  }

  /*   const task = await Task.findOne({
    where: { empId, id, type },
    attributes: ["id"],
  });

  if (task) {
    return {
      status: statusCodes.CONFLICT,
      data: {
        message: "cad designer is already assigned to this cad",
      },
    };
  } */

  const newTask = await Task.create({
    orderId: cad.orderId,
    cadId: cad.id,
    empId,
    type,
    startDate: startDate || null,
    endDate: endDate || null,
    completedDate: completedDate || null,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Task created successfully",
      data: newTask,
    },
  };
};

module.exports.getAllCads = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const { count, rows } = await Cad.findAndCountAll({
    distinct: true,
    attributes: [
      "id",
      "cadNo",
      "orderId",
      "sketchId",
      "status",
      "reason",
      "cadStatus",
      [Sequelize.literal(`"Cad"."status" = 'Approved'`), "isApproved"],
      [Sequelize.literal(`"Cad"."cadStatus" = 'render'`), "isRender"],
      [
        Sequelize.fn("TO_CHAR", Sequelize.col("cadBriefDate"), "DD Mon YYYY"),
        "cadBriefDate",
      ],
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col("cadCompletedDate"),
          "DD Mon YYYY"
        ),
        "cadCompletedDate",
      ],
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col('"Cad"."promiseDate"'),
          "DD Mon YYYY"
        ),
        "promiseDate",
      ],
      "reqCadCount",
      "selectedCadCount",
      "specialInstruction",
      [
        Sequelize.literal(`(SELECT jsonb_agg('${process.env.AWS_IMAGE_URL}/' || img)
           FROM jsonb_array_elements_text("Cad"."imageUrls"::jsonb) AS img)`),
        "imageUrls",
      ],
    ],
    include: [
      {
        model: Order,
        attributes: ["orderNo"], // Fetch only orderNo
        required: true,
      },
      {
        model: Task,
        attributes: ["imageUrls", "empId"],
        required: false,
        include: [
          {
            model: User,
            attributes: ["id", "name"],
            required: false,
          },
        ],
      },
    ],
    limit,
    offset,
    order: [["id", "DESC"]],
  });

  // Process task image URLs and format response
  const processedRows = rows.map((cad) => {
    let taskImages = [];
    let taskUsers = [];
    if (cad.Tasks) {
      cad.Tasks.forEach((task) => {
        if (task.imageUrls && Array.isArray(task.imageUrls)) {
          taskImages.push(
            ...task.imageUrls.map(
              (img) => `${process.env.AWS_IMAGE_URL}/${img}`
            )
          );
        }
        if (task.User) {
          taskUsers.push({ id: task.User.id, name: task.User.name });
        }
      });
    }

    // Extract orderNo and remove `Order` and `Tasks` fields
    const { Tasks, Order, ...filteredCad } = cad.get({ plain: true });

    return {
      ...filteredCad,
      orderNo: Order.orderNo, // Include orderNo separately
      taskImageUrls: taskImages.length > 0 ? taskImages : null,
      cadDesigners: taskUsers.length > 0 ? taskUsers : null,
    };
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "CAD details retrieved successfully",
      totalRecords: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      data: processedRows,
    },
  };
};

module.exports.updateCad = async (cadId, updateData) => {
  // Check if the CAD exists
  const cad = await Cad.findByPk(cadId);
  if (!cad) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "CAD not found",
      },
    };
  }

  // Update the CAD record
  await cad.update(updateData);

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "CAD updated successfully",
      data: cad, // Returning the updated CAD
    },
  };
};

module.exports.getCadById = async (cadId) => {
  const cad = await Cad.findOne({
    where: { id: cadId },
    attributes: [
      "id",
      "cadNo",
      "orderId",
      "sketchId",
      "reqCadCount",
      "selectedCadCount",
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col('"Cad"."cadBriefDate"'),
          "DD Mon YYYY"
        ),
        "cadBriefDate",
      ],
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col('"Cad"."cadCompletedDate"'),
          "DD Mon YYYY"
        ),
        "cadCompletedDate",
      ],
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col('"Cad"."promiseDate"'),
          "DD Mon YYYY"
        ),
        "promiseDate",
      ],
      "specialInstruction",
      [
        Sequelize.literal(`
            (SELECT jsonb_agg('${process.env.AWS_IMAGE_URL}/' || img)
             FROM jsonb_array_elements_text("Cad"."imageUrls"::jsonb) AS img)
          `),
        "imageUrls",
      ],
      "status",
      "cadStatus",
      "reason",
    ],
    include: [
      {
        model: Order,
        attributes: [
          "id",
          "orderNo",
          [
            Sequelize.fn(
              "TO_CHAR",
              Sequelize.col('"Order"."promiseDate"'),
              "DD Mon YYYY"
            ),
            "promiseDate",
          ],
          [
            Sequelize.fn(
              "TO_CHAR",
              Sequelize.col('"Order"."orderDate"'),
              "DD Mon YYYY"
            ),
            "orderDate",
          ],
          "requiredDesignCount",
          "status",
          "orderStatus",
          "expectedGrossWt",
          "expectedNetWt",
          "remarks",
          "diamondRange",
          "colorStoneRange",
          "priority",
          "isItemReceived",
          "reason",
          "empId",
        ],
        required: true,
        include: [
          {
            model: Customer,
            attributes: ["id", "customer_first_name", "address"],
          },
          { model: ProductType, attributes: ["id", "product_types"] },
          { model: Gender, attributes: ["id", "gender"] },
          { model: CategoryGroup, attributes: ["id", "category_group_name"] },
          { model: Category, attributes: ["id", "category_name"] },
          { model: Subcategory, attributes: ["id", "subcategory_name"] },
          { model: Brands, attributes: ["id", "brand_name"] },
          { model: Styles, attributes: ["id", "style_name"] },
          { model: Occasion, attributes: ["id", "occasion"] },
          { model: MetalType, attributes: ["id", "metal_type"] },
          { model: MetalColor, attributes: ["id", "metal_color_name"] },
        ],
      },
      {
        model: Task,
        required: false,
        attributes: [
          "taskId",
          [
            Sequelize.literal(`(
              SELECT jsonb_agg('${process.env.AWS_IMAGE_URL}/' || img)
              FROM jsonb_array_elements_text("Tasks"."imageUrls"::jsonb) AS img
            )`),
            "imageUrls",
          ],
        ],
        include: [
          {
            model: User,
            attributes: ["id", "name"],
            include: [{ model: Role, attributes: ["roleName"] }],
          },
        ],
      },
      {
        model: Sketch,
        required: false,
        attributes: [
          "sketchNo",
          "sketchCompletedDate",
          [
            Sequelize.literal(`(
              SELECT jsonb_agg('${process.env.AWS_IMAGE_URL}/' || img)
              FROM jsonb_array_elements_text("Sketch"."imageUrls"::jsonb) AS img
            )`),
            "imageUrls",
          ],
        ],
      },
    ],
  });

  if (!cad) {
    return {
      status: statusCodes.NOTFOUND,
      data: { message: "CAD record not found!" },
    };
  }

  // Combine imageUrls from all associated tasks
  const taskImageUrls =
    cad.Tasks?.flatMap((task) => task.imageUrls || []) || [];

  // Extract unique employee details
  const employees =
    cad.Tasks?.flatMap((task) =>
      task.User
        ? [
            {
              id: task.User.id,
              name: task.User.name,
              roleName: task.User.Role?.roleName,
            },
          ]
        : []
    ) || [];

  // Convert to plain JSON & remove Tasks from the response
  const cadData = cad.get({ plain: true });
  delete cadData.Tasks;

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Cad details retrieved successfully",
      data: {
        ...cadData,
        imageUrls: taskImageUrls.length ? taskImageUrls : null,
        employee: employees.length ? employees : null,
      },
    },
  };
};

module.exports.addAssemblyItem = async (req) => {
  const {
    cadId,
    sketchId,
    orderId,
    materialInformation,
    numberOfParts,
    makeTypeId,
  } = req.body;

  if (!materialInformation || materialInformation.length === 0) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No material information provided." },
    };
  }

  const insertedData = [];

  for (const material of materialInformation) {
    // Check if material already has an 'id' (i.e., it already exists)
    if (material.id) {
      continue; // Skip this material and don't insert it
    }

    // Create a new assembly item for each material information entry without an id
    const newItem = {
      cadId,
      sketchId:sketchId?sketchId:null,
      orderId,
      numberOfParts,
      makeTypeId,
      netsuiteId: material.netsuiteId,
      productTypeId: material.productTypeId,
      metalTypeId: material.metalTypeId,
      metalColorId: material.metalColorId,
      materialTypeId: material.materialTypeId,
      metalClassId: material.metalClassId,
      metalQualityId: material.metalQualityId,
      DiamondColorId: material.DiamondColorId,
      diamondSizegroupId: material.diamondSizegroupId,
      diamondStoneSizeId: material.diamondStoneSizeId,
      DiamondQualityGroupId: material.DiamondQualityGroupId,
      DiamondQualityId: material.DiamondQualityId,
      colorStoneQualityGroupId: material.colorStoneQualityGroupId,
      colorStoneQualityId: material.colorStoneQualityId,
      colorStoneColorId: material.colorStoneColorId,
      shapesId: material.shapesId,
      grossWeight: material.grossWeight,
      pieces: material.pieces,
      sieveId: material.sieveId,
      carat: material.carat,
      goldVolume: material.goldVolume,
      goldGram: material.goldGram,
      totalCaratWeight:material.totalCaratWeight
    };

    // Insert the new assembly item
    const createdItem = await AssemblyItem.create(newItem);
    insertedData.push(createdItem);
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Assembly items created successfully.",
      data: insertedData,
    },
  };
};

module.exports.getAssemblyItemsByCadId = async (cadId) => {
  const materialInformation = await AssemblyItem.findAll({
    where: { cadId },
    attributes: [
      "id",
      "AssemblyNo",
      "cadId",
      "sketchId",
      "orderId",
      "netsuiteId",
      "grossWeight",
      "productTypeId",
      "numberOfParts",
      "makeTypeId",
      "metalTypeId",
      "metalColorId",
      "materialTypeId",
      "metalClassId",
      "metalQualityId",
      "DiamondColorId",
      "diamondSizegroupId",
      "diamondStoneSizeId",
      "DiamondQualityGroupId",
      "DiamondQualityId",
      "colorStoneQualityGroupId",
      "colorStoneQualityId",
      "colorStoneColorId",
      "shapesId",
      "pieces",
      "createdAt",
      "updatedAt",
      "carat",
      "goldVolume",
      "goldGram",
    ],
    include: [
      { model: ProductType, attributes: ["id", "product_types"] },
      { model: MakeType, attributes: ["id", "make_name"] },
      { model: MetalType, attributes: ["id", "metal_type"] },
      { model: MetalColor, attributes: ["id", "metal_color_name"] },
      { model: MaterialType, attributes: ["id", "material_class"] },
      { model: MetalClass, attributes: ["id", "metal_class"] },
      { model: MetalQuality, attributes: ["id", "metal_quality"] },
      { model: DiamondColor, attributes: ["id", "diamond_color"] },
      { model: DiamondSizeGroup, attributes: ["id", "diamond_size_group"] },
      { model: DiamondStoneSize, attributes: ["id", "sizeMm"] },
      {
        model: DiamondQualityGroup,
        attributes: ["id", "diamond_quality_group"],
      },
      { model: DiamondQuality, attributes: ["id", "diamond_quality"] },
      {
        model: ColorStoneQualityGroup,
        attributes: ["id", "stone_quality_group"],
      },
      { model: ColorStoneColor, attributes: ["id", "colorstone_color"] },
      { model: ColorStoneQuality, attributes: ["id", "stone_quality"] },
      { model: Shape, attributes: ["id", "shape_name"] },
      { model: Sieve, attributes: ["id", "sieveSize", "stoneWeight"] },
    ],
  });

  // Format the response
  const formattedData = materialInformation.map((item) => {
    const itemData = item.toJSON();

    return {
      id: itemData.id,
      AssemblyNo: itemData.AssemblyNo,
      cadId: itemData.cadId,
      sketchId: itemData.sketchId,
      orderId: itemData.orderId,
      netsuiteId: itemData.netsuiteId,
      grossWeight: itemData.grossWeight,
      carat: itemData.carat,
      goldVolume: itemData.goldVolume,
      goldGram: itemData.goldGram,
      productTypeId: itemData.productTypeId,
      numberOfParts: itemData.numberOfParts,
      makeTypeId: itemData.makeTypeId,
      metalTypeId: itemData.metalTypeId,
      metalColorId: itemData.metalColorId,
      materialTypeId: itemData.materialTypeId,
      metalClassId: itemData.metalClassId,
      metalQualityId: itemData.metalQualityId,
      DiamondColorId: itemData.DiamondColorId,
      diamondSizegroupId: itemData.diamondSizegroupId,
      diamondStoneSizeId: itemData.diamondStoneSizeId,
      DiamondQualityGroupId: itemData.DiamondQualityGroupId,
      DiamondQualityId: itemData.DiamondQualityId,
      colorStoneQualityGroupId: itemData.colorStoneQualityGroupId,
      colorStoneQualityId: itemData.colorStoneQualityId,
      colorStoneColorId:itemData.colorStoneColorId,
      shapesId: itemData.shapesId,
      caratWeight: itemData.caratWeight,
      pieces: itemData.pieces,
      totalCaratWeight:itemData.totalCaratWeight,
      createdAt: itemData.createdAt,
      updatedAt: itemData.updatedAt,
      product_types: itemData.ProductType?.product_types || null,
      make_name: itemData.MakeType?.make_name || null,
      metal_type: itemData.MetalType?.metal_type || null,
      metal_color_name: itemData.MetalColor?.metal_color_name || null,
      material_class: itemData.MaterialType?.material_class || null,
      metal_class: itemData.MetalClass?.metal_class || null,
      metal_quality: itemData.MetalQuality?.metal_quality || null,
      diamond_color: itemData.DiamondColor?.diamond_color || null,
      diamond_size_group: itemData.DiamondSizeGroup?.diamond_size_group || null,
      sizeMm: itemData.DiamondStoneSize?.sizeMm || null,
      diamond_quality_group:
        itemData.DiamondQualityGroup?.diamond_quality_group || null,
      diamond_quality: itemData.DiamondQuality?.diamond_quality || null,
      stone_quality_group:
        itemData.ColorStoneQualityGroup?.stone_quality_group || null,
      stone_quality: itemData.ColorStoneQuality?.stone_quality || null,
      shape_name: itemData.Shape?.shape_name || null,
      colorStoneColor:itemData.ColorStoneColor?.colorstone_color||null
    };
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Assembly items fetched successfully",
      data: formattedData,
    },
  };
};

//updatecadstatus
module.exports.updateCadStatusToRender = async (id) => {
  const cad = await Cad.findByPk(id);
  if (!cad) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "cad not found",
      },
    };
  }

  cad.cadStatus = "render";
  await cad.save();
  await Order.update({ orderStatus: "render" }, { where: { id: cad.orderId } });
  await Sketch.update(
    { sketchStatus: "render" },
    { where: { id: cad.orderId } }
  );
  await Cad.update({ cadStatus: "render" }, { where: { id: cad.orderId } });
  await Render.create({
    orderId: cad.orderId,
    cadId: cad.id,
    sketchId: cad.sketchId,
    renderStatus: "render",
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "cad status updated to render",
      data: cad,
    },
  };
};

module.exports.updateCadStatus = async (data) => {
  if (!["Approved", "Rejected", "Initiated"].includes(data.status)) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: {
        message:
          "Invalid status. Allowed values: 'Approved', 'Rejected', 'Initiated'.",
      },
    };
  }

  const cad = await Cad.findByPk(data.cadId, {
    include: [
      {
        model: Task,
        attributes: ["imageUrls"],
        required: false,
      },
    ],
  });

  if (!cad) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "CAD not found.",
      },
    };
  }

  // Validation: If status is 'Approved', check for at least one task with imageUrls
  if (data.status === "Approved") {
    const hasValidTask = cad.Tasks.some(
      (task) =>
        task.imageUrls &&
        Array.isArray(task.imageUrls) &&
        task.imageUrls.length > 0
    );

    if (!hasValidTask) {
      return {
        status: statusCodes.NOTACCEPTABLE,
        data: {
          message:
            "Cannot approve CAD. Assign CAD designer and upload CAD image.",
        },
      };
    }
  }

  let obj = { status: data.status };
  if (data.status === "Rejected" && data.reason) obj.reason = data.reason;

  await cad.update(obj);

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: `CAD status updated to ${data.status}.`,
      data: cad,
    },
  };
};

module.exports.addCadDesigner = async (req, res) => {
  let tasksToInsert = Array.isArray(req.body) ? req.body : [req.body]; // Ensure array format

  let createdTasks = [];
  let errors = [];

  for (const taskData of tasksToInsert) {
    const {
      empId,
      startDate,
      endDate,
      completedDate,
      id,
      type,
      selectedCount,
      reqCount,
    } = taskData;

    if (!empId) {
      errors.push({
        status: statusCodes.NOTACCEPTABLE,
        message: "Cad Designer ID is required",
        data: taskData,
      });
      continue;
    }

    const cad = await Cad.findOne({
      where: { id },
      attributes: ["id", "orderId"],
    });

    if (!cad) {
      errors.push({
        status: statusCodes.NOTFOUND,
        message: "Cad not found",
        data: taskData,
      });
      continue;
    }

    // Prevent assigning the same empId to the same cadId multiple times
    /* const taskExists = await Task.findOne({
      where: { empId, cadId: cad.id, type },
      attributes: ["id"],
    });

    if (taskExists) {
      errors.push({
        status: statusCodes.CONFLICT,
        message: `Cad Designer with empId ${empId} is already assigned to cadId ${cad.id}`,
        data: taskData,
      });
      continue;
    } */

    const newTask = await Task.create({
      orderId: cad.orderId,
      cadId: cad.id,
      empId,
      type,
      selectedCount, // Now included
      startDate: startDate || null,
      endDate: endDate || null,
      completedDate: completedDate || null,
      reqCount,
    });

    createdTasks.push(newTask);
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: createdTasks.length
        ? "Tasks processed successfully"
        : "No tasks were created",
      createdTasks,
      errors: errors.length ? errors : null,
    },
  };
};

module.exports.updateCad = async (req) => {
  const cadId = req.params.id;
  const updateData = req.body;

  if (!cadId) {
    return {
      status: statusCodes.BADREQUEST,
      data: { message: "cadId is required." },
    };
  }

  const cadRecord = await Cad.findOne({ where: { id: cadId } });

  if (!cadRecord) {
    return {
      status: statusCodes.NOTFOUND,
      data: { message: "CAD record not found." },
    };
  }

  await cadRecord.update(updateData);

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "CAD record updated successfully",
      data: cadRecord,
    },
  };
};

module.exports.addCad = async (req) => {
  const transaction = await sequelize.transaction();
  const { orderId, empIds } = req.body;

  // Create the sketch
  const newCad = await Cad.create(
    {
      orderId: orderId || null,
    },
    { transaction }
  );

  // Find the last taskId to generate the next one
  const lastTask = await Task.findOne({
    order: [["id", "DESC"]],
    attributes: ["taskId"],
  });

  let newIdNumber = 100; // Default starting value if no tasks exist

  if (lastTask && lastTask.taskId) {
    const match = lastTask.taskId.match(/\d+/); // Extract numbers from TSKxxx
    const lastIdNumber = match ? parseInt(match[0], 10) : 99;
    newIdNumber = lastIdNumber + 1;
  }

  // Create task records with generated taskIds
  const tasks = empIds.map((empId, index) => ({
    taskId: `TSK${newIdNumber + index}`, // Ensure unique taskIds for each record
    orderId: newCad.orderId,
    cadId: newCad.id,
    empId,
    type: "cad",
  }));

  await Task.bulkCreate(tasks, { transaction });

  await transaction.commit();

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Sketch and tasks created successfully",
      data: newCad,
    },
  };
};
  
module.exports.searchCads = async (filters) => {
  const whereClause = {};

  // Convert start and end dates to ensure inclusion
  const startCadDate = filters.startCadCompletedDate
    ? new Date(filters.startCadCompletedDate)
    : null;
  const endCadDate = filters.endCadCompletedDate
    ? new Date(filters.endCadCompletedDate)
    : null;
  if (endCadDate) endCadDate.setHours(23, 59, 59, 999); // Ensure end date includes entire day

  const startPromiseDate = filters.startDate
    ? new Date(filters.startDate)
    : null;
  const endPromiseDate = filters.endDate ? new Date(filters.endDate) : null;
  if (endPromiseDate) endPromiseDate.setHours(23, 59, 59, 999); // Ensure end date includes entire day

  // Filter by cadCompletedDate range (including start and end dates)
  if (startCadDate && endCadDate) {
    whereClause.cadCompletedDate = { [Op.between]: [startCadDate, endCadDate] };
  } else if (startCadDate) {
    whereClause.cadCompletedDate = { [Op.gte]: startCadDate };
  } else if (endCadDate) {
    whereClause.cadCompletedDate = { [Op.lte]: endCadDate };
  }

  // Filter by promiseDate range (including start and end dates)
  if (startPromiseDate && endPromiseDate) {
    whereClause.promiseDate = {
      [Op.between]: [startPromiseDate, endPromiseDate],
    };
  } else if (startPromiseDate) {
    whereClause.promiseDate = { [Op.gte]: startPromiseDate };
  } else if (endPromiseDate) {
    whereClause.promiseDate = { [Op.lte]: endPromiseDate };
  }

  // Filter by status
  if (filters.status) {
    whereClause.status = filters.status;
  }

  // Filter by cadNo
  if (filters.cadNo) {
    whereClause.cadNo = { [Op.iLike]: `%${filters.cadNo}%` };
  }

  const cads = await Cad.findAll({
    where: whereClause,
    attributes: [
      "id",
      "cadNo",
      "orderId",
      "sketchId",
      "status",
      "reason",
      "cadStatus",
      [Sequelize.literal(`"Cad"."status" = 'Approved'`), "isApproved"],
      [Sequelize.literal(`"Cad"."cadStatus" = 'render'`), "isRender"],
      [
        Sequelize.fn("TO_CHAR", Sequelize.col("cadBriefDate"), "DD Mon YYYY"),
        "cadBriefDate",
      ],
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col("cadCompletedDate"),
          "DD Mon YYYY"
        ),
        "cadCompletedDate",
      ],
      [
        Sequelize.fn(
          "TO_CHAR",
          Sequelize.col('"Cad"."promiseDate"'),
          "DD Mon YYYY"
        ),
        "promiseDate",
      ],
      "reqCadCount",
      "selectedCadCount",
      "specialInstruction",
      [
        Sequelize.literal(`(SELECT jsonb_agg('${process.env.AWS_IMAGE_URL}/' || img)
           FROM jsonb_array_elements_text("Cad"."imageUrls"::jsonb) AS img)`),
        "imageUrls",
      ],
    ],
    include: [
      {
        model: Order,
        attributes: ["orderNo"], // Fetch only orderNo
        required: true,
      },
      {
        model: Task,
        attributes: ["imageUrls", "empId"],
        required: false,
        include: [
          {
            model: User,
            attributes: ["id", "name"],
            required: false,
          },
        ],
      },
    ],
    order: [["id", "DESC"]],
  });

  // Process task image URLs and format response
  const processedCads = cads.map((cad) => {
    let taskImages = [];
    let taskUsers = [];
    if (cad.Tasks) {
      cad.Tasks.forEach((task) => {
        if (task.imageUrls && Array.isArray(task.imageUrls)) {
          taskImages.push(
            ...task.imageUrls.map(
              (img) => `${process.env.AWS_IMAGE_URL}/${img}`
            )
          );
        }
        if (task.User) {
          taskUsers.push({ id: task.User.id, name: task.User.name });
        }
      });
    }

    // Extract orderNo and remove `Order` and `Tasks` fields
    const { Tasks, Order, ...filteredCad } = cad.get({ plain: true });

    return {
      ...filteredCad,
      orderNo: Order.orderNo, // Include orderNo separately
      taskImageUrls: taskImages.length > 0 ? taskImages : null,
      cadDesigners: taskUsers.length > 0 ? taskUsers : null,
    };
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "CADs retrieved successfully",
      totalRecords: processedCads.length,
      data: processedCads,
    },
  };
};

module.exports.addCadFromDesign = async (req) => {
  const transaction = await sequelize.transaction();
  const { designId } = req.body;

  // Fetch orderId from Design table using designId
  const design = await Design.findOne({
    where: { id: designId },
    attributes: ["orderId"],
  });

  if (!design) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Design not found",
      },
    };
  }

  // Create the sketch with the retrieved orderId
  const newCad = await Cad.create(
    {
      orderId: design.orderId || null,
    },
    { transaction }
  );

  await transaction.commit();

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Sketch created successfully",
      data: newCad,
    },
  };
};

module.exports.deleteAssemblyItem=async(id)=> {

  // Find the AssemblyItem by ID
  const assemblyItem = await AssemblyItem.findByPk(id);
  
  if (!assemblyItem) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Assembly item not found",
      },
    };
  }

  // Delete the AssemblyItem
  await assemblyItem.destroy();
  
  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Assebly Item destroyed successfully",
    },
  };

}
//#endregion
