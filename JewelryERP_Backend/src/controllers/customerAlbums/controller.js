//#region imports
const { Op, Sequelize } = require("sequelize");
const { statusCodes } = require("../../utils/constants");
const Design = require("../../models/design/design");
const Order = require("../../models/order/order");
const Cad = require("../../models/cad/cad");
const MakeType = require("../../models/materialItems/makeType");
const AssemblyItem = require("../../models/assemblyItems/asseblyItems");
const DesignSent = require("../../models/design/designSent");
const Sketch = require("../../models/sketches/sketches");
const CategoryGroup = require("../../models/categoryGoup/categoryGroup");
const Category = require("../../models/category/category");
const SubCategory = require("../../models/subcategory/subcategory");
const ProductType = require("../../models/misc/productTypes");
const MetalType = require("../../models/materialItems/metalType");
const MetalColor = require("../../models/materialItems/metalColor");
const MaterialType = require("../../models/materialItems/materialType");
const MetalClass = require("../../models/materialItems/metalClass");
const MetalQuality = require("../../models/materialItems/metalQuality");
const DiamondColor = require("../../models/materialItems/diamondColor");
const DiamondSizeGroup = require("../../models/materialItems/diamondSizeGroup");
const DiamondStoneSize = require("../../models/materialItems/diamondStoneSize");
const Sieve = require("../../models/materialItems/sieve");
const DiamondQualityGroup = require("../../models/materialItems/diamondQualityGroup");
const DiamondQuality = require("../../models/materialItems/diamondQuality");
const ColorStoneQualityGroup = require("../../models/materialItems/colorStoneQualityGroup");
const ColorStoneQuality = require("../../models/materialItems/colorStoneQuality");
const ColorStoneColor = require("../../models/materialItems/colorStoneColor");
const Shape = require("../../models/materialItems/shapes");
const Occasion = require("../../models/misc/occasion");
const Brands = require("../../models/misc/brands");
const Gender = require("../../models/misc/gender");
const Styles = require("../../models/misc/styles");
const Customer = require("../../models/customer/customer");
const CustomerDesignUpdate = require("../../models/customerDesignUpdate/customerDesignUpdate");
const Render = require("../../models/render/render");
const moment = require("moment");
const Album = require("../../models/album/albums");
//#endregion

//#region modules

module.exports.getAllDesignsForCustomer = async (customerId) => {
  const designsSent = await DesignSent.findAll({
    where: { customerId },
    include: [
      {
        model: Design,
        attributes: ["id", "designNo", "createdAt", "imageUrls"],
        include: [
          {
            model: Order,
            attributes: ["id", "orderNo", "orderDate"],
            include: [
              {
                model: CategoryGroup,
                attributes: ["category_group_name"],
              },
              {
                model: Category,
                attributes: ["category_name"],
              },
              {
                model: SubCategory,
                attributes: ["subcategory_name"],
              },
            ],
          },
          {
            model: Cad,
            attributes: ["id", "cadNo"],
          },
          {
            model: Sketch,
            attributes: ["id", "sketchNo"],
          },
        ],
      },
    ],
    order: [["sentDate", "DESC"]],
  });

  // Format the response
  const formattedData = designsSent.map((designSent) => {
    const design = designSent.Design || {};
    const order = design.Order || {};
    const categoryGroup = order.categoryGroup || {};
    const category = order.Category || {};
    const subcategory = order.Subcategory || {};

    return {
      id: designSent.id,
      designId: design.id,
      customerId: designSent.customerId,
      imageUrls: design.imageUrls
        ? design.imageUrls.map((url) => `${process.env.AWS_IMAGE_URL}/${url}`)
        : [],
      category_group_name: categoryGroup.category_group_name || null,
      category_name: category.category_name || null,
      subcategory_name: subcategory.subcategory_name || null,
      sentDate: designSent.sentDate,
      status: designSent.status,
      createdAt: designSent.createdAt,
      updatedAt: designSent.updatedAt,
      Design: {
        id: design.id,
        designNo: design.designNo,
        createdAt: design.createdAt,
        Order: {
          id: order.id,
          orderNo: order.orderNo,
          orderDate: order.orderDate,
        },
        Cad: design.Cad || null,
        Sketch: design.Sketch || null,
      },
    };
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Designs retrieved successfully",
      data: formattedData,
    },
  };
};

module.exports.getDesignById = async (designId) => {
  const design = await Design.findOne({
    where: { id: designId },
    attributes: ["id", "designNo", "createdAt", "imageUrls"],
    include: [
      {
        model: Order,
        attributes: [
          "id",
          "orderNo",
          "promiseDate",
          "orderDate",
          "requiredDesignCount",
          "customerId",
          "productTypeId",
          "genderId",
          "categoryGroupId",
          "categoryId",
          "subcategoryId",
          "brandId",
          "styleId",
          "occasionId",
          "metalTypeId",
          "metalColorId",
          "status",
          "orderStatus",
          "expectedGrossWt",
          "expectedNetWt",
          "remarks",
          "diamondRange",
          "colorStoneRange",
          "priority",
          "isItemReceived",
          "imageUrls",
          "reason",
        ],
        include: [
          { model: CategoryGroup, attributes: ["id", "category_group_name"] },
          { model: Category, attributes: ["id", "category_name"] },
          { model: SubCategory, attributes: ["id", "subcategory_name"] },
          { model: ProductType, attributes: ["id", "product_types"] },
          { model: Gender, attributes: ["id", "gender"] },
          { model: Customer, attributes: ["id", "customer_first_name"] },
          { model: Brands, attributes: ["id", "brand_name"] },
          { model: Styles, attributes: ["id", "style_name"] },
          { model: Occasion, attributes: ["id", "occasion"] },
          { model: MetalType, attributes: ["id", "metal_type"] },
          { model: MetalColor, attributes: ["id", "metal_color_name"] },
        ],
      },
      {
        model: Cad,
        attributes: [
          "id",
          "cadNo",
          "reqCadCount",
          "selectedCadCount",
          "promiseDate",
          "cadBriefDate",
          "cadCompletedDate",
          "specialInstruction",
          "imageUrls",
          "status",
          "cadStatus",
          "reason",
        ],
        include: [
          {
            model: AssemblyItem,
            attributes: [
              "id",
              "AssemblyNo",
              "netsuiteId",
              "weight",
              "pieces",
              "numberOfParts",
            ],
            include: [
              {
                model: ProductType,
                attributes: ["id", "product_types"],
              },
              {
                model: MakeType,
                attributes: ["id", "make_name"],
              },
              {
                model: MetalType,
                attributes: ["id", "metal_type"],
              },
              {
                model: MetalColor,
                attributes: ["id", "metal_color_name"],
              },
              {
                model: MaterialType,
                attributes: ["id", "material_class"],
              },
              {
                model: MetalClass,
                attributes: ["id", "metal_class"],
              },
              {
                model: MetalQuality,
                attributes: ["id", "metal_quality", "quality_mfg_clarity"],
              },
              {
                model: DiamondColor,
                attributes: ["id", "diamond_color"],
              },
              {
                model: DiamondSizeGroup,
                attributes: ["id", "diamond_size_group"],
              },
              {
                model: DiamondStoneSize,
                attributes: ["id", "stone_size", "sizeMm"],
              },
              {
                model: Sieve,
                attributes: ["id", "sieveSize", "stoneWeight"],
              },
              {
                model: DiamondQualityGroup,
                attributes: ["id", "diamond_quality_group"],
              },
              {
                model: DiamondQuality,
                attributes: ["id", "diamond_quality"],
              },
              {
                model: ColorStoneQualityGroup,
                attributes: ["id", "stone_quality_group"],
              },
              {
                model: ColorStoneQuality,
                attributes: ["id", "stone_quality"],
              },
              {
                model: ColorStoneColor,
                attributes: ["id", "colorstone_color"],
              },
              {
                model: Shape,
                attributes: ["id", "shape_name"],
              },
            ],
          },
        ],
      },
      {
        model: Sketch,
        attributes: ["id", "sketchNo"],
      },
      {
        model: Render,
        attributes: ["id", "renderNo"],
      },
    ],
  });

  if (!design) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Design not found",
      },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Design retrieved successfully",
      data: {
        id: design.id,
        designNo: design.designNo,
        imageUrls: design.imageUrls
          ? design.imageUrls.map((url) => `${process.env.AWS_IMAGE_URL}/${url}`)
          : [],
        createdAt: design.createdAt,
        Order: design.Order
          ? {
              id: design.Order.id,
              orderNo: design.Order.orderNo,
              promiseDate: design.Order.promiseDate,
              orderDate: design.Order.orderDate,
              requiredDesignCount: design.Order.requiredDesignCount,
              customerId: design.Order.customerId,
              productTypeId: design.Order.productTypeId,
              genderId: design.Order.genderId,
              categoryGroupId: design.Order.categoryGroupId,
              categoryId: design.Order.categoryId,
              subcategoryId: design.Order.subcategoryId,
              brandId: design.Order.brandId,
              styleId: design.Order.styleId,
              occasionId: design.Order.occasionId,
              metalTypeId: design.Order.metalTypeId,
              metalColorId: design.Order.metalColorId,
              status: design.Order.status,
              orderStatus: design.Order.orderStatus,
              expectedGrossWt: design.Order.expectedGrossWt,
              expectedNetWt: design.Order.expectedNetWt,
              remarks: design.Order.remarks,
              diamondRange: design.Order.diamondRange,
              colorStoneRange: design.Order.colorStoneRange,
              priority: design.Order.priority,
              isItemReceived: design.Order.isItemReceived,
              imageUrls: design.Order.imageUrls
                ? design.Order.imageUrls.map(
                    (url) => `${process.env.AWS_IMAGE_URL}/${url}`
                  )
                : [],
              reason: design.Order.reason,
              CategoryGroup: design.Order.CategoryGroup
                ? {
                    id: design.Order.CategoryGroup.id,
                    name: design.Order.CategoryGroup.category_group_name,
                  }
                : null,
              Category: design.Order.Category
                ? {
                    id: design.Order.Category.id,
                    name: design.Order.Category.category_name,
                  }
                : null,
              Subcategory: design.Order.Subcategory
                ? {
                    id: design.Order.Subcategory.id,
                    name: design.Order.Subcategory.subcategory_name,
                  }
                : null,
              ProductType: design.Order.ProductType
                ? {
                    id: design.Order.ProductType.id,
                    name: design.Order.ProductType.product_types,
                  }
                : null,
              Gender: design.Order.Gender
                ? {
                    id: design.Order.Gender.id,
                    name: design.Order.Gender.gender,
                  }
                : null,
              Brand: design.Order.Brand
                ? {
                    id: design.Order.Brand.id,
                    name: design.Order.Brand.brand_name,
                  }
                : null,
              Style: design.Order.Style
                ? {
                    id: design.Order.Style.id,
                    name: design.Order.Style.style_name,
                  }
                : null,
              Occasion: design.Order.Occasion
                ? {
                    id: design.Order.Occasion.id,
                    name: design.Order.Occasion.occasion,
                  }
                : null,
              MetalType: design.Order.MetalType
                ? {
                    id: design.Order.MetalType.id,
                    name: design.Order.MetalType.metal_type,
                  }
                : null,
              MetalColor: design.Order.MetalColor
                ? {
                    id: design.Order.MetalColor.id,
                    name: design.Order.MetalColor.metal_color_name,
                  }
                : null,
            }
          : null,
        Cad: design.Cad
          ? {
              id: design.Cad.id,
              cadNo: design.Cad.cadNo,
              reqCadCount: design.Cad.reqCadCount,
              selectedCadCount: design.Cad.selectedCadCount,
              promiseDate: design.Cad.promiseDate,
              cadBriefDate: design.Cad.cadBriefDate,
              cadCompletedDate: design.Cad.cadCompletedDate,
              specialInstruction: design.Cad.specialInstruction,
              imageUrls: design.Cad.imageUrls || [],
              status: design.Cad.status,
              cadStatus: design.Cad.cadStatus,
              reason: design.Cad.reason,
              AssemblyItems: design.Cad.AssemblyItems
                ? design.Cad.AssemblyItems.map((item) => ({
                    id: item.id,
                    AssemblyNo: item.AssemblyNo,
                    netsuiteId: item.netsuiteId,
                    grossWeight: item.grossWeight,
                    pieces: item.pieces,
                    numberOfParts: item.numberOfParts,
                    productType: item.ProductType
                      ? {
                          id: item.ProductType.id,
                          name: item.ProductType.product_types,
                        }
                      : null,
                    makeType: item.MakeType
                      ? {
                          id: item.MakeType.id,
                          name: item.MakeType.make_name,
                        }
                      : null,
                    metalType: item.MetalType
                      ? {
                          id: item.MetalType.id,
                          name: item.MetalType.metal_type,
                        }
                      : null,
                    metalColor: item.MetalColor
                      ? {
                          id: item.MetalColor.id,
                          name: item.MetalColor.metal_color_name,
                        }
                      : null,
                    materialType: item.MaterialType
                      ? {
                          id: item.MaterialType.id,
                          name: item.MaterialType.material_class,
                        }
                      : null,
                    metalClass: item.MetalClass
                      ? {
                          id: item.MetalClass.id,
                          name: item.MetalClass.metal_class,
                        }
                      : null,
                    metalQuality: item.MetalQuality
                      ? {
                          id: item.MetalQuality.id,
                          name: item.MetalQuality.metal_quality,
                          qualityMfgClarity:
                            item.MetalQuality.quality_mfg_clarity,
                        }
                      : null,
                    diamondColor: item.DiamondColor
                      ? {
                          id: item.DiamondColor.id,
                          name: item.DiamondColor.diamond_color,
                        }
                      : null,
                    diamondSizeGroup: item.DiamondSizeGroup
                      ? {
                          id: item.DiamondSizeGroup.id,
                          name: item.DiamondSizeGroup.diamond_size_group,
                        }
                      : null,
                    stoneSize: item.DiamondStoneSize
                      ? {
                          id: item.DiamondStoneSize.id,
                          name: item.DiamondStoneSize.stone_size,
                          sizeMm: item.DiamondStoneSize.sizeMm,
                        }
                      : null,
                    sieve: item.Sieve
                      ? {
                          id: item.Sieve.id,
                          sieveSize: item.Sieve.sieveSize,
                          stoneWeight: item.Sieve.stoneWeight,
                        }
                      : null,
                    diamondQualityGroup: item.DiamondQualityGroup
                      ? {
                          id: item.DiamondQualityGroup.id,
                          name: item.DiamondQualityGroup.diamond_quality_group,
                        }
                      : null,
                    diamondQuality: item.DiamondQuality
                      ? {
                          id: item.DiamondQuality.id,
                          name: item.DiamondQuality.diamond_quality,
                        }
                      : null,
                    colorStoneQualityGroup: item.ColorStoneQualityGroup
                      ? {
                          id: item.ColorStoneQualityGroup.id,
                          name: item.ColorStoneQualityGroup.stone_quality_group,
                        }
                      : null,
                    colorStoneQuality: item.ColorStoneQuality
                      ? {
                          id: item.ColorStoneQuality.id,
                          name: item.ColorStoneQuality.stone_quality,
                        }
                      : null,
                    colorStoneColor: item.ColorStoneColor
                      ? {
                          id: item.ColorStoneColor.id,
                          name: item.ColorStoneColor.colorstone_color,
                        }
                      : null,
                    shape: item.Shape
                      ? {
                          id: item.Shape.id,
                          name: item.Shape.shape_name,
                        }
                      : null,
                  }))
                : [],
            }
          : null,
        Sketch: design.Sketch
          ? {
              id: design.Sketch.id,
              sketchNo: design.Sketch.sketchNo,
            }
          : null,
        Render: design.Render
          ? {
              id: design.Render.id,
              renderNo: design.Render.renderNo,
            }
          : null,
      },
    },
  };
};

module.exports.getAllDesignsForDew = async (customerId) => {
  const designsSent = await Design.findAll({
    where: { type: "dew" },
    attributes: ["id", "designNo", "createdAt", "imageUrls"],
    include: [
      {
        model: Order,
        attributes: ["id", "orderNo", "orderDate"],
        include: [
          {
            model: CategoryGroup,
            attributes: ["category_group_name"],
          },
          {
            model: Category,
            attributes: ["category_name"],
          },
          {
            model: SubCategory,
            attributes: ["subcategory_name"],
          },
        ],
      },
      {
        model: Cad,
        attributes: ["id", "cadNo"],
      },
      {
        model: Sketch,
        attributes: ["id", "sketchNo"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  // Format the response
  const formattedData = designsSent.map((designSent) => {
    const order = designSent.Order || {};
    const categoryGroup = order.categoryGroup || {};
    const category = order.Category || {};
    const subcategory = order.Subcategory || {};

    return {
      id: designSent.id,
      imageUrls: designSent.imageUrls
        ? designSent.imageUrls.map((url) => process.env.AWS_IMAGE_URL + url)
        : [],
      category_group_name: categoryGroup.category_group_name || null,
      category_name: category.category_name || null,
      subcategory_name: subcategory.subcategory_name || null,
      status: designSent.status,
      designNo: designSent.designNo,
      createdAt: designSent.createdAt,
      Order: {
        id: order.id,
        orderNo: order.orderNo,
        orderDate: order.orderDate,
      },
      Cad: designSent.Cad || null,
      Sketch: designSent.Sketch || null,
    };
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Designs retrieved successfully",
      data: formattedData,
    },
  };
};

module.exports.addCustomerFeedback = async (req, res) => {
  const {
    orderId,
    cadId,
    sketchId,
    renderId,
    designId,
    imageUrls,
    remarks,
    metalTypeId,
    metalColorId,
    weight,
    customerId,
  } = req.body;

  const order = await Order.findOne({
    where: { id: orderId },
    attributes: ["metalTypeId", "metalColorId", "expectedNetWt"],
  });
 
    // Remove prefix from imageUrls if they start with AWS_IMAGE_URL
  const processedImageUrls =
    imageUrls?.map((url) =>
      url.startsWith(process.env.AWS_IMAGE_URL)
        ? url.replace(process.env.AWS_IMAGE_URL, "")
        : url
    ) || [];

    let mockData={
      orderId,
      cadId,
      sketchId,
      renderId,
      designId,
      imageUrls: processedImageUrls,
      remarks,
      metalTypeId,
      metalColorId,
      customerId,
      weight,
      metalTypeChanged:order.metalTypeId!=metalTypeId?true:false,
      metalColorChanged:order.metalColorId!=metalColorId?true:false,
      weightChanged:order.expectedNetWt!=weight?true:false
    }

  // Insert customer feedback data
  const feedback = await CustomerDesignUpdate.create(mockData);

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Customer feedback added successfully",
      data: feedback,
    },
  };
};

module.exports.getAllCustomerDesignUpdates = async (req, res) => {
  const { page = 1, pageSize = 30 } = req.body; // Defaults

  const limit = parseInt(pageSize);
  const offset = (parseInt(page) - 1) * limit;

  // Fetch total count for pagination
  const { count, rows: customerDesignUpdates } =
    await CustomerDesignUpdate.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]], // Order by createdAt descending
      include: [
        {
          model: Order,
          attributes: ["id", "metalTypeId", "metalColorId"],
          include: [
            { model: MetalType, attributes: ["id", "metal_type"] },
            { model: MetalColor, attributes: ["id", "metal_color_name"] },
          ],
        },
        { model: MetalType, attributes: ["id", "metal_type"] },
        { model: Design, attributes: ["id", "designNo"] },
        { model: MetalColor, attributes: ["id", "metal_color_name"] },
        { model: Customer, attributes: ["id", "customer_first_name"] },
      ],
    });

  // Formatting the response
  const formattedData = customerDesignUpdates.map((item) => ({
    id: item.id,
    designNo: item.Design?.designNo || null,
    orderId: item.orderId,
    cadId: item.cadId,
    sketchId: item.sketchId,
    renderId: item.renderId,
    designId: item.designId,
    customerId: item.customerId,
    imageUrls:
      item.imageUrls?.map((url) => `${process.env.AWS_IMAGE_URL}${url}`) || [], // Prefixing imageUrls
    remarks: item.remarks,
    metalTypeId: item.metalTypeId,
    metalColorId: item.metalColorId,
    createdAt: item.createdAt
      ? moment.utc(item.createdAt).format("DD MMM YYYY") // Formatting date
      : null,
    updatedAt: item.updatedAt,
    Order: item.Order
      ? {
          id: item.Order.id,
          metalTypeId: item.Order.metalTypeId,
          metalColorId: item.Order.metalColorId,
          metal_type: item.Order.MetalType?.metal_type || null,
          metal_color_name: item.Order.MetalColor?.metal_color_name || null,
        }
      : null,
    MetalType: item.MetalType
      ? {
          id: item.MetalType.id,
          metal_type: item.MetalType.metal_type,
        }
      : null,
    MetalColor: item.MetalColor
      ? {
          id: item.MetalColor.id,
          metal_color_name: item.MetalColor.metal_color_name,
        }
      : null,
    customer_name: item.Customer?.customer_first_name || null, // Fixed customer_name field
  }));

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Customer design updates retrieved successfully",
      totalRecords: count, // Total count for pagination
      currentPage: parseInt(page),
      totalPages: Math.ceil(count / limit),
      data: formattedData,
    },
  };
};

module.exports.searchCustomerFeedback = async (req, res) => {
  const { customerName, designNo, startDate, endDate } = req.body;

  const whereClause = {};

  if (customerName) {
    whereClause["$Customer.customer_first_name$"] = {
      [Op.iLike]: `%${customerName}%`,
    };
  }

  if (designNo) {
    whereClause["$Design.designNo$"] = { [Op.iLike]: `%${designNo}%` }; 
  }

  if (startDate && endDate) {
    whereClause.createdAt = {
      [Op.between]: [
        new Date(startDate), // Start from the beginning of the day
        moment(endDate).endOf("day").toDate(), // End at 23:59:59 of the day
      ],
    };
  } else if (startDate) {
    whereClause.createdAt = { [Op.gte]: new Date(startDate) };
  } else if (endDate) {
    whereClause.createdAt = { [Op.lte]: moment(endDate).endOf("day").toDate() };
  }

  console.log("Generated whereClause:", whereClause); // Debugging log

  const customerDesignUpdates = await CustomerDesignUpdate.findAll({
    where: whereClause,
    include: [
      {
        model: Order,
        attributes: ["id", "metalTypeId", "metalColorId"],
        include: [
          { model: MetalType, attributes: ["id", "metal_type"] },
          { model: MetalColor, attributes: ["id", "metal_color_name"] },
        ],
      },
      { model: MetalType, attributes: ["id", "metal_type"] },
      { model: MetalColor, attributes: ["id", "metal_color_name"] },
      { model: Customer, attributes: ["id", "customer_first_name"] },
      { model: Design, attributes: ["id", "designNo"] },
    ],
  });

  const formattedData = customerDesignUpdates.map((item) => ({
    id: item.id,
    designNo: item.Design?.designNo || null,
    orderId: item.orderId,
    cadId: item.cadId,
    sketchId: item.sketchId,
    renderId: item.renderId,
    designId: item.designId,
    customerId: item.customerId,
    imageUrls:
      item.imageUrls?.map((url) => `${process.env.AWS_IMAGE_URL}${url}`) || [],
    remarks: item.remarks,
    metalTypeId: item.metalTypeId,
    metalColorId: item.metalColorId,
    createdAt: item.createdAt
      ? moment.utc(item.createdAt).format("DD MMM YYYY") // Ensuring proper format
      : null,
    updatedAt: item.updatedAt,
    Order: item.Order
      ? {
          id: item.Order.id,
          metalTypeId: item.Order.metalTypeId,
          metalColorId: item.Order.metalColorId,
          metal_type: item.Order.MetalType?.metal_type || null,
          metal_color_name: item.Order.MetalColor?.metal_color_name || null,
        }
      : null,
    MetalType: item.MetalType
      ? {
          id: item.MetalType.id,
          metal_type: item.MetalType.metal_type,
        }
      : null,
    MetalColor: item.MetalColor
      ? {
          id: item.MetalColor.id,
          metal_color_name: item.MetalColor.metal_color_name,
        }
      : null,
    customer_name: item.Customer?.customer_first_name || null,
  }));

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Customer feedback retrieved successfully",
      data: formattedData,
    },
  };
};

module.exports.getAlbumsByCustomerId = async (customerId) => {
  const albums = await Album.findAll({
    where: { customerId },
    order: [["createdAt", "DESC"]],
    raw: true, // Ensures plain JSON objects
  });
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };
  // Modify response to include full image URLs and formatted date
  const formattedAlbums = albums.map((album) => ({
    ...album,
    imageUrls: album.imageUrls.map((url) => `${process.env.AWS_IMAGE_URL}${url}`), // Add prefix
    createdAt: formatDate(album.createdAt), // Hardcoded date as per request
  }));

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Albums retrieved successfully",
      data: formattedAlbums,
    },
  };
};

module.exports.getAllDesignsForAlbum = async (albumId) => {
  const designsSent = await DesignSent.findAll({
    where: { albumId },
    include: [
      {
        model: Design,
        attributes: ["id", "designNo", "createdAt", "imageUrls"],
        include: [
          {
            model: Order,
            attributes: ["id", "orderNo", "orderDate"],
            include: [
              {
                model: CategoryGroup,
                attributes: ["category_group_name"],
              },
              {
                model: Category,
                attributes: ["category_name"],
              },
              {
                model: SubCategory,
                attributes: ["subcategory_name"],
              },
            ],
          },
          {
            model: Cad,
            attributes: ["id", "cadNo"],
          },
          {
            model: Sketch,
            attributes: ["id", "sketchNo"],
          },
        ],
      },
    ],
    order: [["sentDate", "DESC"]],
  });

  // Function to format date as "20 Feb 2025"
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Format the response
  const formattedData = designsSent.map((designSent) => {
    const design = designSent.Design || {};
    const order = design.Order || {};
    const categoryGroup = order.CategoryGroup || {};
    const category = order.Category || {};
    const subcategory = order.SubCategory || {};

    return {
      id: designSent.id,
      designId: design.id,
      albumId: designSent.albumId,
      imageUrls: design.imageUrls
        ? design.imageUrls.map((url) => `${process.env.AWS_IMAGE_URL}/${url}`)
        : [],
      category_group_name: categoryGroup.category_group_name || null,
      category_name: category.category_name || null,
      subcategory_name: subcategory.subcategory_name || null,
      sentDate: formatDate(designSent.sentDate),
      status: designSent.status,
      createdAt: formatDate(designSent.createdAt),
      updatedAt: formatDate(designSent.updatedAt),
      Design: {
        id: design.id,
        designNo: design.designNo,
        createdAt: formatDate(design.createdAt),
        Order: {
          id: order.id,
          orderNo: order.orderNo,
          orderDate: formatDate(order.orderDate),
        },
        Cad: design.Cad || null,
        Sketch: design.Sketch || null,
      },
    };
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Designs retrieved successfully",
      data: formattedData,
    },
  };
};


//#endregion
