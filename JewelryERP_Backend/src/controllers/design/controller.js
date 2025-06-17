//#region imports
const { Op, Sequelize, fn, col, literal } = require("sequelize");
const { statusCodes } = require("../../utils/constants");
const Design = require("../../models/design/design");
const Order = require("../../models/order/order");
const Category = require("../../models/category/category");
const Subcategory = require("../../models/subcategory/subcategory");

const CategoryGroup=require("../../models/categoryGoup/categoryGroup")
const ProductType = require("../../models/misc/productTypes");
const Brand = require("../../models/misc/brands");
const MetalType = require("../../models/materialItems/metalType");
const MetalColor = require("../../models/materialItems/metalColor");
const User = require("../../models/auth/userModel");
const Role = require("../../models/auth/roles");
const Task = require("../../models/task/taskModel");
const MakeType = require("../../models/materialItems/makeType");
const AssemblyItem = require("../../models/assemblyItems/asseblyItems");
const Customer = require("../../models/customer/customer");
const moment = require("moment");
const { transporter } = require("../../Helper/mail/nodemailer");
let emailTemplate = require("../../utils/emailTemplate");
const DesignSent = require("../../models/design/designSent");
const Sketch = require("../../models/sketches/sketches");
const Cad = require("../../models/cad/cad");
const Album = require("../../models/album/albums");
const CustomerDesignUpdate = require("../../models/customerDesignUpdate/customerDesignUpdate");
const twilio = require("twilio");
const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);


//#endregion

//#region modules



module.exports.totalDesignCountReport = async (req) => {
  try {
    const orders = await Order.findAll({
      where: {
        orderStatus: 'design',
      },
      attributes: [
        'diamondRange',
        [Sequelize.fn('COUNT', Sequelize.col('Order.id')), 'design_count'],
      ],
      include: [
        {
          model: Subcategory,
          attributes: ['id', 'subcategory_name'],
          required: true,
          include: [
            {
              model: Category,
              as: 'category', // Assumed alias; confirm with Subcategory model
              attributes: ['id', 'category_name'],
              required: true,
              include: [
                {
                  model: CategoryGroup,
                  as: 'categoryGroup', // Assumed alias; confirm with Category model
                  attributes: ['id', 'category_group_name'],
                  required: true,
                },
              ],
            },
          ],
        },
      ],
      group: [
        'Subcategory.id',
        'Subcategory.subcategory_name',
        'Subcategory.category.id',
        'Subcategory.category.category_name',
        'Subcategory.category.categoryGroup.id',
        'Subcategory.category.categoryGroup.category_group_name',
        'Order.diamondRange', // Group by diamondRange for correct counting
      ],
      raw: true,
    });

    // Log raw query result for debugging
    console.log('Raw query result:', JSON.stringify(orders, null, 2));

    // Process data into hierarchical structure
    const reportData = orders.reduce((acc, row) => {
      const categoryGroup = row['Subcategory.category.categoryGroup.category_group_name'];
      const category = row['Subcategory.category.category_name'];
      const subcategory = row['Subcategory.subcategory_name'];
      const diamondRange = parseFloat(row['diamondRange']) || 0; // Parse STRING to number
      const count = parseInt(row['design_count']) || 0;

      if (!categoryGroup || !category || !subcategory) {
        return acc; // Skip invalid rows
      }

      if (!acc[categoryGroup]) acc[categoryGroup] = {};
      if (!acc[categoryGroup][category]) acc[categoryGroup][category] = {};
      if (!acc[categoryGroup][category][subcategory]) {
        acc[categoryGroup][category][subcategory] = {
          'Below 0.50': 0,
          '0.5-0.7': 0,
          '0.7-1': 0,
          '1-1.5': 0,
          '1.5-2': 0,
          '2-2.5': 0,
          'Above 2.5': 0,
        };
      }

      let rangeKey = 'Above 2.5';
      if (diamondRange < 0.5) rangeKey = 'Below 0.50';
      else if (diamondRange >= 0.5 && diamondRange < 1) {
        rangeKey = '0.5-1';
        acc[categoryGroup][category][subcategory]['0.5-0.7'] += diamondRange >= 0.5 && diamondRange < 0.7 ? count : 0;
        acc[categoryGroup][category][subcategory]['0.7-1'] += diamondRange >= 0.7 && diamondRange < 1 ? count : 0;
      } else if (diamondRange >= 1 && diamondRange < 1.5) rangeKey = '1-1.5';
      else if (diamondRange >= 1.5 && diamondRange < 2) rangeKey = '1.5-2';
      else if (diamondRange >= 2 && diamondRange <= 2.5) rangeKey = '2-2.5';

      acc[categoryGroup][category][subcategory][rangeKey] += count;

      return acc;
    }, {});

    // Calculate totals
    let totalOrderCount = 0;
    let totalCounts = {
      'Below 0.50': 0,
      '0.5-0.7': 0,
      '0.7-1': 0,
      '1-1.5': 0,
      '1.5-2': 0,
      '2-2.5': 0,
      'Above 2.5': 0,
    };

    for (const cg in reportData) {
      for (const cat in reportData[cg]) {
        for (const subcat in reportData[cg][cat]) {
          for (const range in reportData[cg][cat][subcat]) {
            const count = reportData[cg][cat][subcat][range];
            totalCounts[range] += count;
            totalOrderCount += count; // Sum all counts for totalOrderCount
          }
        }
      }
    }

    return {
      status: 200,
      data: {
        reportData,
        totalOrderCount, // Total sum of counts (e.g., 10)
        totalCounts, // Counts per range (e.g., { "Below 0.50": 1, "0.5-0.7": 3, ... })
      },
    };
  } catch (error) {
    console.error('Error in totalDesignCountReport service:', error);
    return {
      status: 500,
      message: error.message || 'Internal server error',
      stack: error.stack,
    };
  }
};
module.exports.orderProductTypeReport = async (req) => {
  try {
    // Log request for debugging
    console.log("Received request:", { body: req?.body, query: req?.query });

    // Safely access inputs
    if (!req) {
      throw Object.assign(new Error("Request object is undefined"), { status: statusCodes.BAD_REQUEST });
    }

    const { startDate, endDate, month } = req.body || req.query || {};

    // Predefined diamond ranges for output
    const validDiamondRanges = [
      "below 0.07",
      "0.07-0.10",
      "0.10-0.15",
      "0.15-0.30",
      "0.30-0.50",
      "0.50-1.0",
      "1.0-1.5",
      "1.5-2.0",
      "2.0-2.5",
      "above 2.5",
    ];

    // Function to map diamondRange to predefined ranges
    const mapDiamondRange = (range) => {
      if (!range || typeof range !== "string") return "Unknown";
      const value = parseFloat(range);
      if (isNaN(value)) {
        if (validDiamondRanges.includes(range)) return range;
        return "Unknown";
      }
      if (value < 0.07) return "below 0.07";
      if (value <= 0.10) return "0.07-0.10";
      if (value <= 0.15) return "0.10-0.15";
      if (value <= 0.30) return "0.15-0.30";
      if (value <= 0.50) return "0.30-0.50";
      if (value <= 1.0) return "0.50-1.0";
      if (value <= 1.5) return "1.0-1.5";
      if (value <= 2.0) return "1.5-2.0";
      if (value <= 2.5) return "2.0-2.5";
      return "above 2.5";
    };

    // Validate and process date inputs
    let dateFilter = {};
    let periodLabel = "";
    let periodFormat = "";

    if (month) {
      if (!moment(month, "YYYY-MM", true).isValid()) {
        throw Object.assign(new Error("Invalid month format. Use 'YYYY-MM'."), { status: statusCodes.BAD_REQUEST });
      }
      const startOfMonth = moment(month, "YYYY-MM").startOf("month").toDate();
      const endOfMonth = moment(month, "YYYY-MM").endOf("month").toDate();
      dateFilter = {
        [Op.gte]: startOfMonth,
        [Op.lte]: endOfMonth,
      };
      periodLabel = `Month ${month}`;
      periodFormat = month;
    } else if (startDate && endDate) {
      if (!moment(startDate, "YYYY-MM-DD", true).isValid() || !moment(endDate, "YYYY-MM-DD", true).isValid()) {
        throw Object.assign(new Error("Invalid date format. Use 'YYYY-MM-DD'."), { status: statusCodes.BAD_REQUEST });
      }
      if (moment(endDate).isBefore(moment(startDate), "day")) {
        throw Object.assign(new Error("endDate must be on or after startDate."), { status: statusCodes.BAD_REQUEST });
      }
      const start = moment(startDate, "YYYY-MM-DD").startOf("day").toDate();
      const end = moment(endDate, "YYYY-MM-DD").isSame(moment(startDate, "YYYY-MM-DD"), "day")
        ? moment(endDate, "YYYY-MM-DD").endOf("day").toDate()
        : moment(endDate, "YYYY-MM-DD").endOf("day").toDate();
      dateFilter = {
        [Op.gte]: start,
        [Op.lte]: end,
      };
      periodLabel = `${startDate} to ${endDate}`;
      periodFormat = `${startDate}_${endDate}`;
    } else {
      throw Object.assign(new Error("Provide either 'month' or both 'startDate' and 'endDate'."), {
        status: statusCodes.BAD_REQUEST,
      });
    }

    const orders = await Order.findAll({
      attributes: [
        [col("diamondRange"), "diamondRange"],
        [col("ProductType.product_types"), "productType"],
        [fn("COUNT", col("Order.id")), "count"],
      ],
      include: [
        {
          model: ProductType,
          attributes: [],
          required: true,
        },
        {
          model: Cad,
          attributes: [],
          required: true,
          where: {
            cadStatus: "render",
            renderStartDate: {
              [Op.ne]: null,
              ...dateFilter,
            },
          },
        },
      ],
      where: {
        diamondRange: { [Op.ne]: null },
        productTypeId: { [Op.ne]: null },
      },
      group: [
        col("diamondRange"),
        col("ProductType.product_types"),
      ],
      order: [
        [col("diamondRange"), "ASC"],
        [col("productType"), "ASC"],
      ],
      raw: true,
    });

    // Log orders for debugging
    console.log("Fetched orders:", orders);

    const reportData = {};
    const periodKey = periodFormat;
    reportData[periodKey] = {};

    // Process orders with mapped diamond ranges
    orders.forEach((order) => {
      const mappedRange = mapDiamondRange(order.diamondRange);
      const { productType, count } = order;
      console.log(`Mapping diamondRange: ${order.diamondRange} -> ${mappedRange}, productType: ${productType}, count: ${count}`);
      if (!reportData[periodKey][mappedRange]) {
        reportData[periodKey][mappedRange] = {
          productTypes: {},
          totalCount: 0,
        };
      }
      reportData[periodKey][mappedRange].productTypes[productType] =
        (reportData[periodKey][mappedRange].productTypes[productType] || 0) + parseInt(count, 10);
      reportData[periodKey][mappedRange].totalCount += parseInt(count, 10);
    });

    // Ensure all valid diamond ranges appear in the output, even if no data
    validDiamondRanges.forEach((range) => {
      if (!reportData[periodKey][range]) {
        reportData[periodKey][range] = {
          productTypes: {},
          totalCount: 0,
        };
      }
    });

    const formattedData = [{
      period: periodLabel,
      diamondRanges: Object.keys(reportData[periodKey])
        .sort((a, b) => {
          const indexA = validDiamondRanges.indexOf(a) !== -1 ? validDiamondRanges.indexOf(a) : validDiamondRanges.length;
          const indexB = validDiamondRanges.indexOf(b) !== -1 ? validDiamondRanges.indexOf(b) : validDiamondRanges.length;
          return indexA - indexB;
        })
        .map((range) => ({
          diamondRange: range,
          productTypes: reportData[periodKey][range].productTypes,
          totalCount: reportData[periodKey][range].totalCount,
        })),
    }];

    return {
      status: statusCodes.SUCCESS,
      data: {
        message: `Order report by product type and diamond range for ${periodLabel} fetched successfully`,
        data: formattedData,
      },
    };
  } catch (error) {
    console.error("Error in orderProductTypeReport:", error);
    throw Object.assign(new Error(`Failed to generate order report: ${error.message}`), {
      status: statusCodes.INTERNAL_SERVER_ERROR,
    });
  }
};
module.exports.getAllDesigns = async (req) => {
  let { page = 1, limit = 10, type } = req.body;

  page = Number(page);
  limit = Number(limit);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  const offset = (page - 1) * limit;

  // Validate `type` filter
  const typeFilter = ["dew", "others"].includes(type) ? { type } : {};

  const { count, rows: designs } = await Design.findAndCountAll({
    where: typeFilter,
    distinct: true,
    include: [
      {
        model: Order,
        attributes: ["expectedGrossWt"],
        required: false,
        include: [
          {
            model: Category,
            attributes: ["id", "category_name"],
            required: false,
          },
          {
            model: Subcategory,
            attributes: ["id", "subcategory_name"],
            required: false,
          },
          {
            model: ProductType,
            attributes: ["id", "product_types"],
            required: false,
          },
          { model: Brand, attributes: ["id", "brand_name"], required: false },
          {
            model: MetalType,
            attributes: ["id", "metal_type"],
            required: false,
          },
          {
            model: MetalColor,
            attributes: ["id", "metal_color_name"],
            required: false,
          },
          {
            model: AssemblyItem,
            attributes: ["makeTypeId"],
            required: false,
            include: [
              {
                model: MakeType,
                attributes: ["id", "make_name"],
                required: false,
              },
            ],
          },
        ],
      },
    ],
    limit,
    offset,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Designs fetched successfully",
      totalRecords: count,
      currentPage: page,
      totalPages: Math.ceil(count / limit),
      pageSize: limit,
      data: designs.map((design) => {
        // Get the first AssemblyItem (if exists) for MakeType
        const firstAssemblyItem = design.Order?.AssemblyItems?.[0];

        return {
          id: design.id,
          designNo: design.designNo,
          type: design.type, // Added type to response
          category: design.Order?.Category?.category_name || null,
          subcategory: design.Order?.Subcategory?.subcategory_name || null,
          productType: design.Order?.ProductType?.product_types || null,
          expectedGrossWt: design.Order?.expectedGrossWt || null,
          brand: design.Order?.Brand?.brand_name || null,
          makeType: firstAssemblyItem?.MakeType?.make_name || null, // Extract only one MakeType
          metal: design.Order?.MetalType?.metal_type || null,
          metalColor: design.Order?.MetalColor?.metal_color_name || null,
          imageUrls:
            design.imageUrls?.map(
              (url) => `${process.env.AWS_IMAGE_URL}/${url}`
            ) || [],
        };
      }),
    },
  };
};



module.exports.designerReport = async (payload) => {
  const page = payload.page || 1;
  const pageSize = payload.pageSize || 30;
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const result = await User.findAndCountAll({
    include: [
      {
        model: Role,
        where: { type: "productDevelopment" }, // Filter users by role type
        attributes: ["id", "roleName", "type"],
      },
      {
        model: Task,
        attributes: [],
        required: false, // Include users even if they have no tasks
      },
    ],
    attributes: [
      "id",
      "name",
      "email",
      "designation",
      [
        Sequelize.literal(
          `(SELECT COALESCE(CAST(SUM(S."reqSketchCount") AS INTEGER), 0) 
            FROM "Sketch" S
            INNER JOIN "task" T ON T."sketchId" = S."id"
            WHERE T."empId" = "User"."id")`
        ),
        "totalSketchRequired",
      ],
      [
        Sequelize.literal(
          `(SELECT COALESCE(CAST(SUM(T."selectedCount") AS INTEGER), 0) 
            FROM "task" T
            WHERE T."empId" = "User"."id"
              AND T."type" = 'sketch')`
        ),
        "totalSketchSelected",
      ],
      [
        Sequelize.literal(
          `(SELECT COALESCE(CAST(SUM(C."reqCadCount") AS INTEGER), 0) 
            FROM "Cads" C 
            INNER JOIN "task" T ON T."cadId" = C."id"
            WHERE T."empId" = "User"."id")`
        ),
        "totalCadRequired",
      ],
      [
        Sequelize.literal(
          `(SELECT COALESCE(CAST(SUM(T."selectedCount") AS INTEGER), 0) 
            FROM "task" T 
            WHERE T."empId" = "User"."id"
              AND T."type" = 'cad')`
        ),
        "totalCadSelected",
      ],
      [
        Sequelize.literal(
          `(SELECT COALESCE(CAST(SUM(R."reqRenderCount") AS INTEGER), 0) 
            FROM "Render" R 
            INNER JOIN "task" T ON T."renderId" = R."id"
            WHERE T."empId" = "User"."id")`
        ),
        "totalRenderRequired",
      ],
      [
        Sequelize.literal(
          `(SELECT COALESCE(CAST(SUM(T."selectedCount") AS INTEGER), 0) 
            FROM "task" T 
            WHERE T."empId" = "User"."id"
              AND T."type" = 'render')`
        ),
        "totalRenderSelected",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task"
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'sketch'
            AND "task"."isApprovedCustomer" = true)`
        ),
        "selectedSketchesCustomer",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task"
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'sketch'
            AND "task"."isApprovedOwn" = true)`
        ),
        "selectedSketchesOwn",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task"
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'cad'
            AND "task"."isApprovedCustomer" = true)`
        ),
        "selectedCadsCustomer",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task"
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'cad'
            AND "task"."isApprovedOwn" = true)`
        ),
        "selectedCadsOwn",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task"
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'render'
            AND "task"."isApprovedCustomer" = true)`
        ),
        "selectedRendersCustomer",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task"
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'render'
            AND "task"."isApprovedOwn" = true)`
        ),
        "selectedRendersOwn",
      ],
    ],
    group: ["User.id", "Role.id"],
    limit,
    offset,
    distinct: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Users with task counts fetched successfully",
      totalCount: result.count.length || result.count, // Handle grouped count
      currentPage: page,
      totalPages: Math.ceil((result.count.length || result.count) / pageSize),
      data: result.rows.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        designation: user.designation,
        role: user.Role ? {
          id: user.Role.id,
          roleName: user.Role.roleName,
          type: user.Role.type,
        } : null,
        totalSketchRequired: user.dataValues.totalSketchRequired,
        totalSketchSelected: user.dataValues.totalSketchSelected,
        totalCadRequired: user.dataValues.totalCadRequired,
        totalCadSelected: user.dataValues.totalCadSelected,
        totalRenderRequired: user.dataValues.totalRenderRequired,
        totalRenderSelected: user.dataValues.totalRenderSelected,
        selectedSketchesCustomer: user.dataValues.selectedSketchesCustomer,
        selectedSketchesOwn: user.dataValues.selectedSketchesOwn,
        selectedCadsCustomer: user.dataValues.selectedCadsCustomer,
        selectedCadsOwn: user.dataValues.selectedCadsOwn,
        selectedRendersCustomer: user.dataValues.selectedRendersCustomer,
        selectedRendersOwn: user.dataValues.selectedRendersOwn,
      })),
    },
  };
};

module.exports.designToCustomer = async (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;

  const { count, rows: designs } = await Design.findAndCountAll({
    attributes: ["createdAt", "designNo", "imageUrls", "id"],
    include: [
      {
        model: Order,
        attributes: [],
        include: [
          {
            model: Customer,
            attributes: ["customer_first_name", "customer_email"],
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    raw: true,
    nest: true,
  });

  // Formatting output
  const formattedDesigns = designs.map((design) => ({
    createdAt: moment(design.createdAt).format("DD MMM YYYY"), // Formats date as "06 Feb 2025"
    designNo: design.designNo,
    designId: design.id,
    imageUrls: design.imageUrls || [],
    customer_first_name: design.Order?.Customer?.customer_first_name || "",
    customer_email: design.Order?.Customer?.customer_email || "",
  }));

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Designs retrieved successfully",
      data: formattedDesigns,
      pagination: {
        totalRecords: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        perPage: limit,
      },
    },
  };
};

module.exports.sendDesignEmail = async (customer, designs, designPageLink) => {
  emailTemplate = emailTemplate.replace(
    "{{customer_first_name}}",
    customer.customer_first_name
  );

  let designList = designs
    .map(
      (design) => `
        <p class="design">
            <strong>📅 Date: ${design.createdAt}</strong><br>
            🔹 Design Number: ${design.designNo}<br>
            ${
              design.imageUrls.length > 0
                ? `<img src="${design.imageUrls[0]}" width="200">`
                : ""
            }
        </p>
    `
    )
    .join("");

  emailTemplate = emailTemplate.replace("{{designs}}", designList);
  emailTemplate = emailTemplate.replace("{{design_page_link}}", designPageLink);

  // Send email
  await transporter.sendMail({
    from: '"Dew Diamonds" <diamondsdews@gmail.com>',
    to: customer.customer_email,
    subject: "Your Custom Jewellery Designs Are Ready! 💎",
    html: emailTemplate,
    replyTo: "no-reply@dewdiamondswebapp.com",
  });

  const awsImageUrls = designs.flatMap((design) =>
    design.imageUrls.map((url) => url.replace(process.env.AWS_IMAGE_URL, ""))
  );

  const newAlbum = await Album.create({
    customerId: customer.id,
    imageUrls: awsImageUrls,
  });

  const designSentRecords = designs.map((design) => ({
    designId: design.id,
    albumId: newAlbum.id,
    customerId: customer.id,
    sentDate: new Date(),
    status: "Sent",
  }));

  await DesignSent.bulkCreate(designSentRecords);

  return {
    status: statusCodes.SUCCESS,
    data: { message: "Mail sent Successfully" },
  };
};

module.exports.getDesignById = async (designId) => {
  const design = await Design.findOne({
    where: { id: designId },
    attributes: ["createdAt", "designNo", "imageUrls", "id"],
    include: [
      {
        model: Order,
        attributes: [],
        include: [
          {
            model: Customer,
            attributes: ["customer_first_name", "customer_email"],
          },
        ],
      },
    ],
    raw: true,
    nest: true,
  });

  if (!design) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Design not found",
      },
    };
  }

  // Prefix AWS URL to imageUrls if present
  const awsImageUrl = process.env.AWS_IMAGE_URL || "";
  const imageUrls = design.imageUrls
    ? design.imageUrls.map((img) => `${awsImageUrl}/${img}`)
    : [];

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Design retrieved successfully",
      data: {
        createdAt: moment(design.createdAt).format("DD MMM YYYY"),
        designNo: design.designNo,
        designId: design.id,
        imageUrls,
        customer_first_name: design.Order?.Customer?.customer_first_name || "",
        customer_email: design.Order?.Customer?.customer_email || "",
      },
    },
  };
};

module.exports.designToCustomerSearch = async (
  customerId,
  page = 1,
  limit = 10
) => {
  const offset = (page - 1) * limit;
  const whereClause = {};

  if (customerId) {
    whereClause["$Order.Customer.id$"] = customerId;
  }

  const { count, rows: designs } = await Design.findAndCountAll({
    attributes: ["createdAt", "designNo", "imageUrls", "id"],
    include: [
      {
        model: Order,
        attributes: [],
        include: [
          {
            model: Customer,
            attributes: ["id", "customer_first_name", "customer_email"],
          },
        ],
      },
    ],
    where: whereClause,
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    raw: true,
    nest: true,
  });

  // Formatting output
  const formattedDesigns = designs.map((design) => ({
    createdAt: moment(design.createdAt).format("DD MMM YYYY"), // Formats date as "06 Feb 2025"
    designNo: design.designNo,
    designId: design.id,
    imageUrls: design.imageUrls || [],
    customer_first_name: design.Order?.Customer?.customer_first_name || "",
    customer_email: design.Order?.Customer?.customer_email || "",
  }));

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Designs retrieved successfully",
      data: formattedDesigns,
      pagination: {
        totalRecords: count,
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        perPage: limit,
      },
    },
  };
};

module.exports.searchDesignerReport = async (payload) => {
  const { designerName, designation, type } = payload;

  // Filters for User model
  const whereClause = {};
  if (designerName) {
    whereClause.name = { [Op.iLike]: `%${designerName}%` };
  }

  // Filters for Role (Designation)
  const roleWhereClause = {};
  if (designation) {
    roleWhereClause.roleName = { [Op.iLike]: `%${designation}%` };
  }

  const users = await User.findAll({
    include: [
      {
        model: Role,
        attributes: [["roleName", "designation"], "id", "type"],
        where: roleWhereClause,
      },
    ],
    attributes: [
      "id",
      "name",
      "email",
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task" 
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'sketch'
            AND "task"."imageUrls" IS NOT NULL
            AND json_array_length("task"."imageUrls") > 0)`
        ),
        "createdSketches",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task" 
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'cad'
            AND "task"."imageUrls" IS NOT NULL
            AND json_array_length("task"."imageUrls") > 0)`
        ),
        "createdCads",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task" 
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'render'
            AND "task"."imageUrls" IS NOT NULL
            AND json_array_length("task"."imageUrls") > 0)`
        ),
        "createdRenders",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task"
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'sketch'
            AND "task"."isApprovedCustomer" = true)`
        ),
        "selectedSketchesCustomer",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task"
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'sketch'
            AND "task"."isApprovedOwn" = true)`
        ),
        "selectedSketchesOwn",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task"
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'cad'
            AND "task"."isApprovedCustomer" = true)`
        ),
        "selectedCadsCustomer",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task"
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'cad'
            AND "task"."isApprovedOwn" = true)`
        ),
        "selectedCadsOwn",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task"
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'render'
            AND "task"."isApprovedCustomer" = true)`
        ),
        "selectedRendersCustomer",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task"
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'render'
            AND "task"."isApprovedOwn" = true)`
        ),
        "selectedRendersOwn",
      ],
    ],
    where: whereClause,
    order: [["name", "ASC"]],
    raw: true,
  });

  // Transform the raw data to match desired structure
  const transformedUsers = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    createdSketches: user.createdSketches,
    createdCads: user.createdCads,
    createdRenders: user.createdRenders,
    selectedSketchesCustomer: user.selectedSketchesCustomer,
    selectedSketchesOwn: user.selectedSketchesOwn,
    selectedCadsCustomer: user.selectedCadsCustomer,
    selectedCadsOwn: user.selectedCadsOwn,
    selectedRendersCustomer: user.selectedRendersCustomer,
    selectedRendersOwn: user.selectedRendersOwn,
    designation: user["Role.designation"],
    Role: {type:user["Role.type"]},
    type: user["Role.type"],
  }));

  // Apply type filtering in JavaScript
  const filteredUsers = transformedUsers.filter((user) => {
    if (type === "sketch") return user.createdSketches > 0;
    if (type === "cad") return user.createdCads > 0;
    if (type === "render") return user.createdRenders > 0;
    if (type === "all")
      return (
        user.createdSketches > 0 ||
        user.createdCads > 0 ||
        user.createdRenders > 0
      );
    return true; // No type filter, return all users
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Filtered designers report retrieved successfully",
      totalUsers: filteredUsers.length,
      data: filteredUsers,
    },
  };
};

module.exports.designDeliveryReports = async (payload) => {
  const page = payload.page || 1;
  const pageSize = payload.pageSize || 30;
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  return DesignSent.findAndCountAll({
    attributes: ["sentDate"],
    include: [
      {
        model: Design,
        attributes: ["designNo", "id"],
        include: [
          {
            model: Order,
            attributes: ["empId"],
            include: [
              {
                model: User,
                attributes: ["name"],
              },
            ],
          },
        ],
      },
      {
        model: Customer,
        attributes: ["id", "customer_first_name", "empId"],
        include: [
          {
            model: User,
            attributes: ["name"],
          },
        ],
      },
    ],
    order: [["sentDate", "DESC"]],
    limit,
    offset,
    distinct: true, // Ensures count is correct when using includes
  }).then((result) => ({
    status: statusCodes.SUCCESS,
    data: {
      message: "Design delivery reports retrieved successfully",
      totalCount: result.count,
      currentPage: page,
      totalPages: Math.ceil(result.count / pageSize),
      data: result.rows.map((report) => {
        const order = report.Design?.Order;
        const customer = report.Customer;

        let salesRep = null;
        if (order?.empId && order.User) {
          salesRep = order.User.name;
        } else if (customer?.empId && customer.User) {
          salesRep = customer.User.name;
        }

        return {
          sentDate: moment(report.sentDate).format("DD MMM YYYY"),
          DesignId: report.Design?.designNo || null,
          id: report.Design?.id || null,
          customerId: customer?.id || null,
          customerName: customer?.customer_first_name?.toLowerCase() || null,
          salesRep,
        };
      }),
    },
  }));
};

module.exports.getDesignReport = async (payload) => {
  const page = payload.page || 1;
  const pageSize = payload.pageSize || 30;
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  return Design.findAndCountAll({
    attributes: ["createdAt", "designNo"],
    include: [
      {
        model: Sketch,
        attributes: ["sketchNo"],
        include: [
          {
            model: Task,
            attributes: ["isApprovedOwn", "isApprovedCustomer"],
            where: {
              [Op.or]: [{ isApprovedOwn: true }, { isApprovedCustomer: true }],
            },
            include: [
              {
                model: User,
                attributes: ["name"],
              },
            ],
            required: false,
          },
        ],
      },
      {
        model: Cad,
        attributes: ["cadNo"],
        include: [
          {
            model: Task,
            attributes: ["isApprovedOwn", "isApprovedCustomer"],
            where: {
              [Op.or]: [{ isApprovedOwn: true }, { isApprovedCustomer: true }],
            },
            include: [
              {
                model: User,
                attributes: ["name"],
              },
            ],
            required: false,
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    distinct: true,
  }).then((result) => ({
    status: statusCodes.SUCCESS,
    data: {
      message: "Design report fetched successfully",
      totalCount: result.count, // Total number of records before pagination
      currentPage: page,
      totalPages: Math.ceil(result.count / pageSize),
      data: result.rows.map((report) => {
        const sketchTasks = report.Sketch?.Tasks || [];
        const cadTasks = report.Cad?.Tasks || [];

        return {
          createdAt: moment(report.createdAt).format("DD MMM YYYY"),
          designNo: report.designNo,
          sketchNo: report.Sketch?.sketchNo || null,
          cadNo: report.Cad?.cadNo || null,
          sketchDesigners: sketchTasks
            .map((task) => task.User?.name)
            .filter(Boolean),
          cadDesigners: cadTasks.map((task) => task.User?.name).filter(Boolean),
        };
      }),
    },
  }));
};

module.exports.searchDesignReport = async (payload) => {
  const { page = 1, pageSize = 30, startDate, endDate, designNo } = payload;
  const offset = (page - 1) * pageSize;
  const limit = pageSize;

  const whereClause = {};

  if (startDate && endDate) {
    const startOfDay = moment(startDate).startOf("day").toDate(); // 00:00:00
    const endOfDay = moment(endDate).endOf("day").toDate(); // 23:59:59

    whereClause.createdAt = {
      [Op.between]: [startOfDay, endOfDay], // Full-day range
    };
  }

  if (designNo) {
    whereClause.designNo = { [Op.iLike]: `%${designNo}%` };
  }

  return Design.findAndCountAll({
    attributes: ["createdAt", "designNo"],
    where: whereClause,
    include: [
      {
        model: Sketch,
        attributes: ["sketchNo"],
        include: [
          {
            model: Task,
            attributes: ["isApprovedOwn", "isApprovedCustomer"],
            where: {
              [Op.or]: [{ isApprovedOwn: true }, { isApprovedCustomer: true }],
            },
            include: [{ model: User, attributes: ["name"] }],
            required: false,
          },
        ],
      },
      {
        model: Cad,
        attributes: ["cadNo"],
        include: [
          {
            model: Task,
            attributes: ["isApprovedOwn", "isApprovedCustomer"],
            where: {
              [Op.or]: [{ isApprovedOwn: true }, { isApprovedCustomer: true }],
            },
            include: [{ model: User, attributes: ["name"] }],
            required: false,
          },
        ],
      },
    ],
    order: [["createdAt", "DESC"]],
    limit,
    offset,
    distinct: true,
  }).then((result) => ({
    status: statusCodes.SUCCESS,
    data: {
      message: "Design report search results",
      totalCount: result.count,
      currentPage: page,
      totalPages: Math.ceil(result.count / pageSize),
      data: result.rows.map((report) => {
        const sketchTasks = report.Sketch?.Tasks || [];
        const cadTasks = report.Cad?.Tasks || [];

        return {
          createdAt: moment(report.createdAt).format("DD MMM YYYY"),
          designNo: report.designNo,
          sketchNo: report.Sketch?.sketchNo || null,
          cadNo: report.Cad?.cadNo || null,
          sketchDesigners: sketchTasks
            .map((task) => task.User?.name)
            .filter(Boolean),
          cadDesigners: cadTasks.map((task) => task.User?.name).filter(Boolean),
        };
      }),
    },
  }));
};

module.exports.searchDesignDeliveryReport = async (payload) => {
  const { startDate, endDate, customerName, salesRep, designNo } = payload;

  const whereClause = {};

  if (startDate && endDate) {
    try {
      // Parse dates explicitly and ensure they're valid
      const start = moment.tz(startDate, "Asia/Kolkata");
      const end = moment.tz(endDate, "Asia/Kolkata");

      if (!start.isValid() || !end.isValid()) {
        throw new Error("Invalid date format provided");
      }

      const startOfDay = start.startOf("day").toDate();
      const endOfDay = end.endOf("day").toDate();

      // Log for debugging (remove in production)
      console.log("Date Filter - Start:", startOfDay, "End:", endOfDay);

      whereClause.sentDate = {
        [Op.between]: [startOfDay, endOfDay],
      };
    } catch (error) {
      console.error("Date parsing error:", error.message);
      // Optionally return an error response
      return {
        status: statusCodes.BAD_REQUEST,
        data: { message: "Invalid date format for startDate or endDate" },
      };
    }
  }
  
  const userWhereClause = salesRep ? { name: { [Op.iLike]: `%${salesRep}%` } } : {};

  return DesignSent.findAll({
    attributes: ["sentDate"],
    where: whereClause,
    include: [
      {
        model: Design,
        attributes: ["designNo", "id"],
        where: designNo ? { designNo: { [Op.iLike]: `%${designNo}%` } } : {},
        required: true,
        include: [
          {
            model: Order,
            attributes: ["empId"],
            include: [
              {
                model: User,
                attributes: ["name"],
                where: userWhereClause,
                required: false,
              },
            ],
            required: false,
          },
        ],
      },
      {
        model: Customer,
        attributes: ["id", "customer_first_name", "empId"],
        include: [
          {
            model: User,
            attributes: ["name"],
            where: userWhereClause,
            required: false,
          },
        ],
        where: customerName
          ? { customer_first_name: { [Op.iLike]: `%${customerName}%` } }
          : {},
        required: !!customerName,
      },
    ],
    where: salesRep
      ? {
          [Op.or]: [
            { '$Design.Order.User.name$': { [Op.iLike]: `%${salesRep}%` } },
            { '$Customer.User.name$': { [Op.iLike]: `%${salesRep}%` } },
          ].filter(Boolean),
        }
      : whereClause, // Ensure base whereClause is applied when no salesRep
    order: [["sentDate", "DESC"]],
    distinct: true,
  }).then((reports) => ({
    status: statusCodes.SUCCESS,
    data: {
      message: "Design delivery reports search results",
      data: reports.map((report) => {
        const order = report.Design?.Order;
        const customer = report.Customer;

        let salesRepName = null;
        if (customer?.User?.name) {
          salesRepName = customer.User.name;
        } else if (order?.User?.name) {
          salesRepName = order.User.name;
        }

        return {
          sentDate: moment(report.sentDate).format("DD MMM YYYY"),
          DesignId: report.Design?.designNo || null,
          id: report.Design?.id || null,
          customerId: customer?.id || null,
          customerName: customer?.customer_first_name || null,
          salesRep: salesRepName,
        };
      }),
    },
  })).catch((error) => {
    console.error("Query error:", error);
    return {
      status: statusCodes.INTERNAL_SERVER_ERROR,
      data: { message: "Error fetching design delivery reports" },
    };
  });
};

module.exports.searchDesignerReport = async (payload) => {
  const { designerName, designation, type } = payload;

  // Filters for User model
  const whereClause = {};
  if (designerName) {
    whereClause.name = { [Op.iLike]: `%${designerName}%` };
  }

  // Filters for Role (Designation)
  const roleWhereClause = {};
  if (designation) {
    roleWhereClause.roleName = { [Op.iLike]: `%${designation}%` };
  }

  const users = await User.findAll({
    include: [
      {
        model: Role,
        attributes: [["roleName", "designation"], "id", "type"],
        where: roleWhereClause,
      },
    ],
    attributes: [
      "id",
      "name",
      "email",
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task" 
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'sketch'
            AND "task"."imageUrls" IS NOT NULL
            AND json_array_length("task"."imageUrls") > 0)`
        ),
        "createdSketches",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task" 
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'cad'
            AND "task"."imageUrls" IS NOT NULL
            AND json_array_length("task"."imageUrls") > 0)`
        ),
        "createdCads",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task" 
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'render'
            AND "task"."imageUrls" IS NOT NULL
            AND json_array_length("task"."imageUrls") > 0)`
        ),
        "createdRenders",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task"
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'sketch'
            AND "task"."isApprovedCustomer" = true)`
        ),
        "selectedSketchesCustomer",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task"
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'sketch'
            AND "task"."isApprovedOwn" = true)`
        ),
        "selectedSketchesOwn",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task"
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'cad'
            AND "task"."isApprovedCustomer" = true)`
        ),
        "selectedCadsCustomer",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task"
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'cad'
            AND "task"."isApprovedOwn" = true)`
        ),
        "selectedCadsOwn",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task"
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'render'
            AND "task"."isApprovedCustomer" = true)`
        ),
        "selectedRendersCustomer",
      ],
      [
        Sequelize.literal(
          `(SELECT COUNT(*) 
            FROM "task"
            WHERE "task"."empId" = "User"."id"
            AND "task"."type" = 'render'
            AND "task"."isApprovedOwn" = true)`
        ),
        "selectedRendersOwn",
      ],
    ],
    where: whereClause,
    order: [["name", "ASC"]],
    raw: true,
  });

  // **🔹 Apply type filtering in JavaScript**
  const filteredUsers = users.filter((user) => {
    if (type === "sketch") return user.createdSketches > 0;
    if (type === "cad") return user.createdCads > 0;
    if (type === "render") return user.createdRenders > 0;
    if (type === "all")
      return (
        user.createdSketches > 0 ||
        user.createdCads > 0 ||
        user.createdRenders > 0
      );
    return true; // No type filter, return all users
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Filtered designers report retrieved successfully",
      totalUsers: filteredUsers.length,
      data: filteredUsers,
    },
  };
};

module.exports.searchAllDesigns = async (req) => {
  const { designNo, category, subCategory, metal_color, metal, type } =
    req.body;

  // Building filters dynamically
  const filters = {};
  filters.type = type;
  if (designNo) filters.designNo = { [Op.iLike]: `%${designNo}%` };
  if (category)
    filters["$Order.Category.category_name$"] = { [Op.iLike]: `%${category}%` };
  if (subCategory)
    filters["$Order.Subcategory.subcategory_name$"] = {
      [Op.iLike]: `%${subCategory}%`,
    };
  if (metal_color)
    filters["$Order.MetalColor.metal_color_name$"] = {
      [Op.iLike]: `%${metal_color}%`,
    };
  if (metal)
    filters["$Order.MetalType.metal_type$"] = { [Op.iLike]: `%${metal}%` };

  const designs = await Design.findAll({
    where: filters,
    distinct: true,
    include: [
      {
        model: Order,
        attributes: ["expectedGrossWt"],
        required: false,
        include: [
          {
            model: Category,
            attributes: ["id", "category_name"],
            required: false,
          },
          {
            model: Subcategory,
            attributes: ["id", "subcategory_name"],
            required: false,
          },
          {
            model: ProductType,
            attributes: ["id", "product_types"],
            required: false,
          },
          { model: Brand, attributes: ["id", "brand_name"], required: false },
          {
            model: MetalType,
            attributes: ["id", "metal_type"],
            required: false,
          },
          {
            model: MetalColor,
            attributes: ["id", "metal_color_name"],
            required: false,
          },
          {
            model: AssemblyItem,
            attributes: ["makeTypeId"],
            required: false,
            include: [
              {
                model: MakeType,
                attributes: ["id", "make_name"],
                required: false,
              },
            ],
          },
        ],
      },
    ],
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Filtered orders fetched successfully",
      totalRecords: designs.length,
      data: designs.map((design) => {
        const firstAssemblyItem = design.Order?.AssemblyItems?.[0];

        return {
          id: design.id,
          designNo: design.designNo,
          type: design.type,
          category: design.Order?.Category?.category_name || null,
          subcategory: design.Order?.Subcategory?.subcategory_name || null,
          productType: design.Order?.ProductType?.product_types || null,
          expectedGrossWt: design.Order?.expectedGrossWt || null,
          brand: design.Order?.Brand?.brand_name || null,
          makeType: firstAssemblyItem?.MakeType?.make_name || null,
          metal: design.Order?.MetalType?.metal_type || null,
          metalColor: design.Order?.MetalColor?.metal_color_name || null,
          imageUrls:
            design.imageUrls?.map(
              (url) => `${process.env.AWS_IMAGE_URL}/${url}`
            ) || [],
        };
      }),
    },
  };
};

module.exports.getDesignsByCustomerId = async (customerId) => {
  /*  if (!customerId) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: {
        message: "customerId is required",
      },
    };
  } */
  let whereCondition = {};
  if (customerId) {
    whereCondition = { customerId };
  }

  // Fetch all designs for the given customerId
  const designs = await Design.findAll({
    include: [
      {
        model: Order,
        where: whereCondition,
        attributes: [], // We don't need Order attributes, just the relation
      },
    ],
    attributes: ["id", "designNo"],
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Designs retrieved successfully",
      data: designs,
    },
  };
};

module.exports.FeedbackInsightReport = async (page = 1, pageSize = 10) => {
  const offset = (page - 1) * pageSize;
  const designs = await Design.findAll({
    attributes: [
      "id",
      "designNo",
      [fn("COUNT", col("DesignSents.id")), "designSentCount"],
      [fn("COUNT", col("CustomerDesignUpdates.id")), "feedbackCount"],
      [
        fn(
          "SUM",
          literal(
            'CASE WHEN "CustomerDesignUpdates"."metalTypeChanged" = true THEN 1 ELSE 0 END'
          )
        ),
        "metalTypeChangeRequests",
      ],
      [
        fn(
          "SUM",
          literal(
            'CASE WHEN "CustomerDesignUpdates"."metalColorChanged" = true THEN 1 ELSE 0 END'
          )
        ),
        "metalColorChangeRequests",
      ],
      [
        fn(
          "SUM",
          literal(
            'CASE WHEN "CustomerDesignUpdates"."weightChanged" = true THEN 1 ELSE 0 END'
          )
        ),
        "weightChangeRequests",
      ],
    ],
    include: [
      {
        model: DesignSent,
        attributes: [],
        required: false, // Left join
      },
      {
        model: CustomerDesignUpdate,
        attributes: [],
        required: false, // Left join
      },
    ],
    group: ["Design.id"],
    limit: pageSize,
    offset: offset,
    subQuery: false,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Designs fetched successfully",
      data: designs,
    },
  };
};

module.exports.sendDesignWhatsApp = async (
  customer,
  designs,
  designPageLink
) => {
  /* let data =await sendWhatsAppMessage(
    customer.customer_mobile,
    designPageLink
  ); */
  const message = await client.messages.create({
    from:process.env.TWILIO_WHATSAPP_NUMBER,  // Twilio WhatsApp number
    to: `whatsapp:${customer.customer_mobile}`,      // Recipient's WhatsApp number
    body: `Hello! Check out this link: ${designPageLink}`,
  });
    const awsImageUrls = designs.flatMap((design) =>
      design.imageUrls.map((url) => url.replace(process.env.AWS_IMAGE_URL, ""))
    );

    const newAlbum = await Album.create({
      customerId: customer.id,
      imageUrls: awsImageUrls,
    });

    const designSentRecords = designs.map((design) => ({
      designId: design.id,
      albumId: newAlbum.id,
      customerId: customer.id,
      sentDate: new Date(),
      status: "Sent",
    }));

    await DesignSent.bulkCreate(designSentRecords);

    return {
      status: statusCodes.SUCCESS,
      data: { message: "Message sent Successfully" },
    };   
  
};

module.exports.updateManufactured = async (id,isManufactured) => {
  const design = await Design.findByPk(id);
  if (!design) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "design not found",
      },
    };
  }

  design.isManufactured = isManufactured;
  await design.save();
  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "updated",
      data: design,
    },
  };
};
//#endregionf





