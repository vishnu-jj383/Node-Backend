//#region imports
const Customer = require("../../models/customer/customer");
const Order = require("../../models/order/order");
const { statusCodes, folderPrefix } = require("../../utils/constants");
const { Op, fn, col, literal } = require("sequelize");
const { sequelize } = require("../../configuration/db");
const Task = require("../../models/task/taskModel");
const User = require("../../models/auth/userModel");
const Sketch = require("../../models/sketches/sketches");
const Cad = require("../../models/cad/cad");
const Render = require("../../models/render/render");

//#endregion

//#region modules

module.exports.getDashboardSummary = async () => {
  // Fetch total orders
  const totalOrders = await Order.count();

  // Orders In Progress (Orders not yet in 'design' status)
  const ordersInProgress = await Order.count({
    where: { orderStatus: { [Op.not]: "design" } },
  });

  // Completed Orders
  const completedOrders = await Order.count({
    where: { orderStatus: "design" },
  });

  // Total Customers
  const totalCustomers = await Customer.count();

  // Order Status Breakdown (for Pie Chart)
  const [orderCount, sketchCount, cadCount, renderCount, designCount] =
    await Promise.all([
      Order.count({ where: { orderStatus: "order" } }),
      Order.count({ where: { orderStatus: "sketch" } }),
      Order.count({ where: { orderStatus: "cad" } }),
      Order.count({ where: { orderStatus: "render" } }),
      Order.count({ where: { orderStatus: "design" } }),
    ]);

  const orderStatusBreakdown = {
    order: orderCount,
    sketch: sketchCount,
    cad: cadCount,
    render: renderCount,
    design: designCount,
  };

  // Designer Workload Bar Chart
  const designerWorkloadRaw = await Task.findAll({
    attributes: [
      "empId",
      [fn("COUNT", col("Task.id")), "totalTasks"],
      [
        fn(
          "SUM",
          literal(
            `CASE WHEN type = 'sketch' AND jsonb_array_length("imageUrls"::jsonb) > 0 THEN 1 ELSE 0 END`
          )
        ),
        "sketchesCompleted",
      ],
      [
        fn(
          "SUM",
          literal(
            `CASE WHEN type = 'cad' AND jsonb_array_length("imageUrls"::jsonb) > 0 THEN 1 ELSE 0 END`
          )
        ),
        "cadsCompleted",
      ],
      [
        fn(
          "SUM",
          literal(
            `CASE WHEN type = 'render' AND jsonb_array_length("imageUrls"::jsonb) > 0 THEN 1 ELSE 0 END`
          )
        ),
        "rendersCompleted",
      ],
    ],
    where: {
      empId: { [Op.ne]: null },
      completedDate: { [Op.ne]: null },
    },
    group: ["empId", "User.id", "User.name"],
    include: [
      {
        model: User,
        attributes: ["id", "name"],
        required: true,
      },
    ],
    raw: true,
  });

  const designerWorkload = designerWorkloadRaw.map((item) => ({
    empId: item.empId,
    totalTasks: parseInt(item.totalTasks, 10),
    sketchesCompleted: parseInt(item.sketchesCompleted, 10),
    cadsCompleted: parseInt(item.cadsCompleted, 10),
    rendersCompleted: parseInt(item.rendersCompleted, 10),
    id: item["User.id"],
    name: item["User.name"],
  }));

  // Fetch Recent Orders
  const recentOrders = await Order.findAll({
    attributes: [
      "id",
      "orderNo",
      "orderStatus",
      "promiseDate",
      "orderDate",
      "status",
    ],
    include: [
      { model: Customer, attributes: ["id", "customer_first_name"] },
      {
        model: Sketch,
        attributes: ["id"],
        include: [
          {
            model: Task,
            attributes: ["id"],
            include: [{ model: User, attributes: ["id", "name"] }],
          },
        ],
      },
      {
        model: Cad,
        attributes: ["id"],
        include: [
          {
            model: Task,
            attributes: ["id"],
            include: [{ model: User, attributes: ["id", "name"] }],
          },
        ],
      },
      {
        model: Render,
        attributes: ["id"],
        include: [
          {
            model: Task,
            attributes: ["id"],
            include: [{ model: User, attributes: ["id", "name"] }],
          },
        ],
      },
    ],
    order: [["orderDate", "DESC"]],
    limit: 10,
  });

  const formattedRecentOrders = recentOrders.map((order) => {
    const designers = new Set();

    ["Sketch", "Cad", "Render"].forEach((type) => {
      if (order[type]) {
        const items = Array.isArray(order[type]) ? order[type] : [order[type]];

        items.forEach((item) => {
          if (item.Tasks) {
            const tasks = Array.isArray(item.Tasks) ? item.Tasks : [item.Tasks];

            tasks.forEach((task) => {
              if (task.User) {
                designers.add(task.User.name); // Store only designer name
              }
            });
          }
        });
      }
    });

    return {
      id: order.id,
      orderNo: order.orderNo,
      orderStatus: order.orderStatus,
      promiseDate: formatDate(order.promiseDate),
      orderDate: formatDate(order.orderDate),
      status: order.status,
      customerId: order.Customer?.id || null,
      customerName: order.Customer?.customer_first_name || null,
      designerName: [...designers], // Convert Set to array
    };
  });

  // Date formatting function
  function formatDate(dateString) {
    if (!dateString) return null;
    const options = { day: "2-digit", month: "short", year: "numeric" };
    return new Date(dateString).toLocaleDateString("en-GB", options);
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      totalOrders,
      ordersInProgress,
      completedOrders,
      totalCustomers,
      orderStatusBreakdown,
      designerWorkload,
      recentOrders: formattedRecentOrders,
    },
  };
};

module.exports.getBarChart = async (type, startYear, endYear) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Default filters
  let dateFilter = {};
  let groupByField = "";
  let orderByField = "";
  let labelField = "";

  // Define filters for different types
  if (type === "year") {
    dateFilter = {
      orderDate: {
        [Op.between]: [
          new Date(`${startYear || currentYear}-01-01`),
          new Date(`${endYear || currentYear}-12-31`),
        ],
      },
    };
    groupByField = [sequelize.literal(`EXTRACT(YEAR FROM "orderDate")`)];
    orderByField = `"year"`;
    labelField = "year";
  } else if (type === "month") {
    dateFilter = {
      orderDate: {
        [Op.between]: [
          new Date(`${currentYear}-01-01`),
          new Date(`${currentYear}-12-31`),
        ],
      },
    };
    groupByField = [sequelize.literal(`TO_CHAR("orderDate", 'Mon-YYYY')`)];
    orderByField = `"month"`;
    labelField = "month";
  } else if (type === "quarter") {
    dateFilter = {
      orderDate: {
        [Op.between]: [
          new Date(`${currentYear}-01-01`),
          new Date(`${currentYear}-12-31`),
        ],
      },
    };
    groupByField = [sequelize.literal(`EXTRACT(QUARTER FROM "orderDate")`)];
    orderByField = `"quarter"`;
    labelField = "quarter";
  } else if (type === "half-year") {
    dateFilter = {
      orderDate: {
        [Op.between]: [
          new Date(`${currentYear}-01-01`),
          new Date(`${currentYear}-12-31`),
        ],
      },
    };
    groupByField = [
      sequelize.literal(`
                CASE 
                    WHEN EXTRACT(MONTH FROM "orderDate") BETWEEN 1 AND 6 THEN 'HY1'
                    ELSE 'HY2' 
                END
            `),
    ];
    orderByField = `"half_year"`;
    labelField = "half_year";
  }

  // Fetch Orders Based on Time Filter (Yearly, Monthly, Quarterly, Half-Yearly)
  const dbOrders = await Order.findAll({
    attributes: [
      [groupByField[0], labelField],
      [sequelize.fn("COUNT", sequelize.col("id")), "orderCount"],
    ],
    where: dateFilter,
    group: groupByField,
    order: [[sequelize.literal(orderByField), "ASC"]],
    raw: true,
  });

  const formattedOrders = dbOrders.map((order) => ({
    period: order[labelField],
    orderCount: order.orderCount,
  }));
  if (type === "month") {
    const monthOrder = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    formattedOrders.sort((a, b) => {
      const [monthA, yearA] = a.period.split("-");
      const [monthB, yearB] = b.period.split("-");

      return (
        parseInt(yearA) - parseInt(yearB) || // Sort by year first
        monthOrder.indexOf(monthA) - monthOrder.indexOf(monthB) // Then by month
      );
    });
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      ordersByPeriod: formattedOrders,
    },
  };
};

//#endregion
