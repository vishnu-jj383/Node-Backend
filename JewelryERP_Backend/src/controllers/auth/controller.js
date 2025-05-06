//#region imports
const { statusCodes,userCategory } = require("../../utils/constants");
const User = require("../../models/auth/userModel");
const bcrypt = require("bcryptjs");
const { createToken, createRefreshToken } = require("../../Helper/jwt");
const Role = require("../../models/auth/roles");
const { Op, Sequelize } = require("sequelize");
//#endregion

//#region modules
module.exports.signup = async (req) => {
  const {
    name,
    email,
    password,
    emp_id,
    emp_subsidiary,
    designation,
    role,
    department,
    emp_mobile_no,
    supervisor_name,
    date_of_joining,
    isLogin,
    roleCategory,
  } = req.body;
  // Check if all required fields are present (optional step)
  if (!email || !password) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "Required fields missing!" },
    };
  }

  // Check if email already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    return {
      status: statusCodes.CONFLICT,
      data: { message: "Email Alredy Exists!" },
    };
  }

  // Hash the password before storing it
  const hashedPassword = await bcrypt.hash(password, 12); // 12 is the salt rounds
let  access={}
  if(roleCategory==userCategory.ADMIN){
     access={
      "dashboard": true,
      "pd": true,
      "pdList": true,
      "pdApprovalList": true,
      "sketches": true,
      "sketchesList": true,
      "sketchApprovalList": true,
      "sketchGridView": true,
      "cad": true,
      "cadList": true,
      "cadApprovalList": true,
      "render": true,
      "renderList": true,
      "renderApprovalList": true,
      "design": true,
      "designBank": true,
      "designMaster": true,
      "reports": true,
      "designReports": true,
      "designerReport": true,
      "albums": true,
      "sendToCustomer": true,
      "dewAlbum": true
  }
  }

  // Create the new user
  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    emp_id,
    emp_subsidiary,
    designation,
    role,
    department,
    emp_mobile_no,
    supervisor_name,
    date_of_joining,
    isLogin,
    roleCategory,
    access
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "User created successfully!",
      data: newUser,
    },
  };
};

module.exports.login = async (req) => {
  const { email, password } = req.body;

  // Check if user exists
  let userDetails = await User.findOne({
    where: { email, isLogin: true },
  });
  if (!userDetails) {
    return {
      status: statusCodes.NOTFOUND,
      data: { message: "Invalid email or no login access" },
    };
  }

  // Compare incoming password with db password
  let validPassword = await bcrypt.compare(password, userDetails.password);

  if (!validPassword) {
    return {
      status: statusCodes.FORBIDDEN,
      data: { message: "Invalid login credentials" },
    };
  }

  const id = userDetails.id
   const access=userDetails.access
   const roleCategory=userDetails.roleCategory

  // If valid credentials, then send jwt to the client
  const token = createToken(id,access,roleCategory);

  const refreshToken = createRefreshToken(id,access,roleCategory);

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Account logged in successfully",
      token,
      refreshToken,
      user:userDetails.name,
      email:userDetails.email
    },
  };
};

module.exports.addRoles = async (roles) => {
  // Ensure the request contains data
  if (!roles || (Array.isArray(roles) && roles.length === 0)) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "No role data provided." },
    };
  }

  // If the input is a single object, convert it to an array for consistency
  if (!Array.isArray(roles)) {
    roles = [roles];
  }

  // Extract role names for duplicate check
  const roleNames = roles.map((role) => role.roleName);

  // Check for existing roles with the same names
  const existingRecords = await Role.findAll({
    where: {
      roleName: { [Op.in]: roleNames },
    },
  });

  // Extract existing role names
  const existingNames = new Set(existingRecords.map((r) => r.roleName));

  // Filter out roles that already exist
  const newRoles = roles.filter((role) => !existingNames.has(role.roleName));

  if (newRoles.length === 0) {
    return {
      status: statusCodes.CONFLICT,
      data: { message: "All roles already exist!" },
    };
  }

  // Insert the new roles into the database
  const insertedData = await Role.bulkCreate(newRoles, {
    validate: true, // Ensures validation before insertion
    ignoreDuplicates: true, // Prevents inserting duplicates if unique constraints exist
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Role(s) created successfully",
      data: insertedData,
    },
  };
};

module.exports.getAllRoles = async (type) => {
  let whereCondition = {};
  if (type) whereCondition.type = type;
  const roles = await Role.findAll({
    attributes: ["id", "roleName","type"],
    where: whereCondition,
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Roles fetched successfully",
      data: roles,
    },
  };
};

module.exports.updateAccess = async (req) => {
  const { empId, access } = req.body;

  if (typeof access !== "object" || access === null) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: {
        message: "Invalid access format. It should be an object.",
      },
    };
  }

  // Find user by emp_id
  const user = await User.findOne({ where: { id: empId } });

  if (!user) {
    return {
      status: statusCodes.NOTFOUND,
      data: {
        message: "User not found with the given emp_id.",
      },
    };
  }

  // Update access field
  await user.update({ access });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Access updated successfully.",
      data: {
        empId: user.emp_id,
        access: user.access,
      },
    },
  };
};

module.exports.addUser = async (req) => {
  const {
    name,
    email,
    password,
    emp_id,
    emp_subsidiary,
    designation,
    role,
    department,
    emp_mobile_no,
    supervisor_name,
    date_of_joining,
    isLogin,
    roleCategory,
    access
  } = req.body;

  // Check if required fields are present
  if (!email || !password || !emp_id) {
    return {
      status: statusCodes.NOTACCEPTABLE,
      data: { message: "Required fields missing!" },
    };
  }

  // Check if email or emp_id already exists
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ email }, { emp_id }],
    },
  });

  if (existingUser) {
    return {
      status: statusCodes.CONFLICT,
      data: { message: "Email or Employee ID already exists!" },
    };
  }

  // Hash the password before storing it
  const hashedPassword = await bcrypt.hash(password, 12); // 12 is the salt rounds

  // Set access permissions based on roleCategory


 // Create the new user
  const newUser = await User.create({
    name,
    email,
    password: hashedPassword,
    emp_id,
    emp_subsidiary,
    designation,
    role,
    department,
    emp_mobile_no,
    supervisor_name,
    date_of_joining,
    isLogin,
    roleCategory,
    access:access?access:{},
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "User created successfully!",
      data: newUser,
    },
  };
};

module.exports.updateUser = async (req) => {
  const { id } = req.params; // User ID from request params
  const {
    name,
    email,
    password,
    emp_id,
    emp_subsidiary,
    designation,
    role,
    department,
    emp_mobile_no,
    supervisor_name,
    date_of_joining,
    isLogin,
    roleCategory,
    access
  } = req.body;

  // Check if user exists
  const user = await User.findByPk(id);
  if (!user) {
    return {
      status: statusCodes.NOTFOUND,
      data: { message: "User not found!" },
    };
  }

  // Check if the new email or emp_id already exists (excluding current user)
  const existingUser = await User.findOne({
    where: {
      [Op.or]: [{ email }, { emp_id }],
      id: { [Op.ne]: id }, // Exclude current user
    },
  });

  if (existingUser) {
    return {
      status: statusCodes.CONFLICT,
      data: { message: "Email or Employee ID already exists!" },
    };
  }

  // Hash password if it's being updated
  let hashedPassword = user.password;
  if (password) {
    hashedPassword = await bcrypt.hash(password, 12);
  }

  // Update user data
  await user.update({
    name,
    email,
    password: hashedPassword,
    emp_id,
    emp_subsidiary,
    designation,
    role,
    department,
    emp_mobile_no,
    supervisor_name,
    date_of_joining,
    isLogin,
    roleCategory,
    access:access?access:{}
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "User updated successfully!",
      data: user,
    },
  };
};

module.exports.getUsersByRoleType = async (type) => {
    const users = await User.findAll({
      include: [
        {
          model: Role,
          attributes: [], // Exclude Role attributes
          where: { type}, // Filter users with this role type
        },
      ],
      attributes: ["id", "name"], // Fetch only required user attributes
    });

    return {
      status: statusCodes.SUCCESS,
      data: {
        message: "Users fetched successfully",
        data: users,
      },
    };
};

module.exports.getAllUsers = async (req) => {
  const pageSize = req.body?.pageSize ? parseInt(req.body.pageSize, 10) : null;
  const page = req.body?.page ? parseInt(req.body.page, 10) : null;

  let offset, limit;

  if (pageSize && page) {
    offset = (page - 1) * pageSize;
    limit = pageSize;
  }

  // Get total user count
  const totalUsersCount = await User.count();
  const totalPages = pageSize ? Math.ceil(totalUsersCount / pageSize) : 1;

  const users = await User.findAll({
    include: [
      {
        model: Role,
        attributes: ["id", "roleName", "type"],
      },
    ],
    attributes: [
      "id",
      "name",
      "email",
      "designation",
      "createdAt",
      [
        Sequelize.literal(`TO_CHAR("User"."createdAt", 'DD Mon YYYY')`),
        "formattedCreatedAt",
      ],
    ],
    order: [["createdAt", "DESC"]],
    ...(pageSize && page ? { offset, limit } : {}), // Apply pagination only if pageSize and page are provided
  });

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "Users fetched successfully",
      ...(pageSize && page ? { page, pageSize, totalPages } : {}), // Include pagination info only when applicable
      totalUsers: totalUsersCount,
      data: users,
    },
  };
}; 

module.exports.getUserById = async (id) => {
  const user = await User.findByPk(id, {
    attributes: [
      "id",
      "name",
      "email",
      "emp_id",
      "emp_subsidiary",
      "designation",
      "department",
      "emp_mobile_no",
      "supervisor_name",
      "date_of_joining",
      "access",
      "roleCategory",
    ],
    include: [
      {
        model: Role,
        attributes: ["id", "roleName"],
      },
    ],
  });

  if (!user) {
    return {
      status: statusCodes.NOT_FOUND,
      data: {
        message: "User not found",
      },
    };
  }

  return {
    status: statusCodes.SUCCESS,
    data: {
      message: "User retrieved successfully",
      data: user,
    },
  };
};

//#endregion
