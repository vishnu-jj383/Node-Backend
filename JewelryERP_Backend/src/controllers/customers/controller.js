//#region imports
const Customer = require("../../models/customer/customer");
const { statusCodes } = require("../../utils/constants");
const { Op,Sequelize } = require("sequelize");
const moment = require("moment");
//#endregion

//#region modules

module.exports.addCustomer = async (req) => {
  let customers = req.body;

  if (!customers || (Array.isArray(customers) && customers.length === 0)) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No customer data provided." },
    };
  }

  if (!Array.isArray(customers)) {
    customers = [customers];
  }

  const existingRecords = await Customer.findAll({
    where: {
      [Op.or]: [
        {
          customer_username: {
            [Op.in]: customers.map((c) => c.customer_username),
          },
        },
        { customer_email: { [Op.in]: customers.map((c) => c.customer_email) } },
      ],
    },
  });

  const existingUsernames = new Set(
    existingRecords.map((r) => r.customer_username)
  );
  const existingEmails = new Set(existingRecords.map((r) => r.customer_email));

  const newCustomers = customers.filter(
    (c) =>
      !existingUsernames.has(c.customer_username) &&
      !existingEmails.has(c.customer_email)
  );

  if (newCustomers.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: { message: "All customers already exist!" },
    };
  }

  const insertedData = await Customer.bulkCreate(newCustomers, {
    validate: true,
    ignoreDuplicates: true,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Customer(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllCustomers = async () => {
  const customers = await Customer.findAll({
    attributes: ["id", "customer_first_name","customer_email"],
    raw: true,
  });

  if (customers.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No customers found!",
        data: [],
      },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Customers retrieved successfully!",
      data: customers,
    },
  };
};

module.exports.getCustomerById = async (req) => {
  const { id } = req.params;

  if (!id) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "Customer ID is required." },
    };
  }

  const customer = await Customer.findOne({
    where: { id },
    attributes: [
      "id",
      "netsuite_id",
      "customer_status",
      "customer_username",
      "customer_email",
      "customer_first_name",
      "customer_last_name",
      "phone_number",
      "birth_date",
      "address",
      "pincode",
      "customer_type",
      "customer_fax",
      "customercode",
      "country_subsidiary",
      "customer_country",
      "created_date",
      "updated_date",
    ],
    raw: true,
  });

  if (!customer) {
    return {
      status: statusCodes.NOTFOUND,
      data: { message: "Customer not found!" },
    };
  }
  customer.created_date=moment(customer.created_date).format("DD MMM YYYY")

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Customer retrieved successfully!",
      data: customer,
    },
  };
};

module.exports.editCustomer = async (req) => {
  const id = req.params.id || req.body.id; // Accepting ID from params or body

  if (!id) {
    return {
      status: statusCodes.BADREQUEST,
      data: {
        message: "Customer ID is required.",
      },
    };
  }

  const customer = await Customer.findOne({ where: { id } });

  if (!customer) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Customer not found!",
      },
    };
  }

  // Update customer with request body
  await customer.update(req.body);

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Customer updated successfully!",
      data: customer,
    },
  };
};

module.exports.deleteCustomer = async (req) => {
  const id = req.params.id; // Get ID from request parameters

  if (!id) {
    return {
      status: statusCodes.BADREQUEST,
      data: {
        message: "Customer ID is required.",
      },
    };
  }

  const customer = await Customer.findOne({ where: { id } });

  if (!customer) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "Customer not found!",
      },
    };
  }

  await customer.destroy(); // Delete the customer record

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Customer deleted successfully!",
    },
  };
};

module.exports.getCustomers = async (req) => {
  const { page = 1, pageSize = 10 } = req.body;

  const limit = parseInt(pageSize, 10);
  const offset = (parseInt(page, 10) - 1) * limit;

  const { count, rows: customers } = await Customer.findAndCountAll({
    attributes: [
      "id",
      "netsuite_id",
      "customer_status",
      "customer_username",
      "customer_email",
      "customer_first_name",
      "customer_last_name",
      "phone_number",
      "birth_date",
      "address",
      "pincode",
      "customer_type",
      "customer_fax",
      "customercode",
      "country_subsidiary",
      "customer_country",
      [
        Sequelize.literal(`TO_CHAR(created_date, 'DD Mon YYYY')`),
        "created_date",
      ],
      [
        Sequelize.literal(`TO_CHAR(updated_date, 'DD Mon YYYY')`),
        "updated_date",
      ],
    ],
    order: [["created_date", "DESC"]],
    limit,
    offset,
    raw: true,
  });

  if (customers.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No customers found!",
        data: [],
      },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Customers retrieved successfully!",
      totalRecords: count,
      currentPage: parseInt(page, 10),
      totalPages: Math.ceil(count / limit),
      data: customers,
    },
  };
};

module.exports.searchCustomers = async (req) => {
  const {
    customerName,
    startDate,
    endDate,
    customerType,
    customerPhoneNo,
    customerEmail,
  } = req.body;

  const whereClause = {};

  if (customerName) {
    whereClause[Op.or] = [
      { customer_first_name: { [Op.iLike]: `%${customerName}%` } },
      { customer_last_name: { [Op.iLike]: `%${customerName}%` } },
      { customer_username: { [Op.iLike]: `%${customerName}%` } },
    ];
  }

  if (customerType) {
    whereClause.customer_type = customerType; // ENUMs require exact match
  }

  if (customerPhoneNo) {
    whereClause.phone_number = { [Op.iLike]: `%${customerPhoneNo}%` };
  }

  if (customerEmail) {
    whereClause.customer_email = { [Op.iLike]: `%${customerEmail}%` };
  }

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setUTCHours(23, 59, 59, 999); // Set to end of the day
    whereClause.created_date = {
      [Op.between]: [start, end],
    };
  } else if (startDate) {
    whereClause.created_date = { [Op.gte]: new Date(startDate) };
  } else if (endDate) {
    whereClause.created_date = { [Op.lte]: new Date(endDate) };
  }
  const customers = await Customer.findAll({
    attributes: [
      "id",
      "netsuite_id",
      "customer_status",
      "customer_username",
      "customer_email",
      "customer_first_name",
      "customer_last_name",
      "phone_number",
      "birth_date",
      "address",
      "pincode",
      "customer_type",
      "customer_fax",
      "customercode",
      "country_subsidiary",
      "customer_country",
      [
        Sequelize.literal(`TO_CHAR(created_date, 'DD Mon YYYY')`),
        "created_date",
      ],
      [
        Sequelize.literal(`TO_CHAR(updated_date, 'DD Mon YYYY')`),
        "updated_date",
      ],
    ],
    where: whereClause,
    order: [["created_date", "DESC"]],
    raw: true,
  });

  if (customers.length === 0) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "No customers found!",
        data: [],
      },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Customers retrieved successfully!",
      totalRecords: customers.length,
      data: customers,
    },
  };
};

//#endregion
