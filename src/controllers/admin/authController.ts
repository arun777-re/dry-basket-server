import {
  createResponse,
  handleError,
  hashPass,
  validateFields,
} from "../../utils/heplers";
import jwt from "jsonwebtoken";
import { Request, RequestHandler, Response } from "express";
import { verifyToken } from "../../middleware/verifyToken";
import { AdminAuthClaa } from "../../services/admin/authServices";
import { setAdminAuthCookie } from "../../utils/cookieHelpers";
import { InviteCodeClass } from "../../services/admin/invitecodeServices";
import mongoose, { Types } from "mongoose";
import { AdminProps } from "../../types/admin";
import { cacheServices, checkRateLimit } from "../../services/redis/cache";
import { cacheKeyToGetAdmin } from "../../utils/cacheKeyUtils";
import { sendEmailWithNodemailer } from "../../utils/email";

const secret = process.env.JWT_SECRET || "";
const adminservices = new AdminAuthClaa();
const inviteservices = new InviteCodeClass();

export const loginAdmin: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const { email, password } = req.body;
  // validate fields
  validateFields({ email, password }, res);
  try {
    // limit req at a time for login
    const ip = req.ip;
    const allowed = await checkRateLimit(ip as string, 5, 60 * 5);
    if (!allowed) {
      createResponse({
        res,
        message: "Too many attempts. Try again later",
        success: false,
        status: 429,
      });
      return;
    }
    // check if admin exists
    const admin = await adminservices.findAdmin(email);
    if (!admin) {
      createResponse({
        res,
        message: "No Admin available with this email",
        success: false,
        status: 401,
      });
      return;
    }

    // compare password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      createResponse({
        res,
        message: "Invalid credentials",
        success: false,
        status: 401,
      });
      return;
    }

    // generate token
    const token = jwt.sign({ id: admin._id }, secret, { expiresIn: "30d" });

    // destructure response data
    const { _id, firstName, isMainAdmin } = admin;

    // set cookies
    setAdminAuthCookie(res, token);
    // send response
    createResponse({
      res,
      message: "Logged in successfully",
      success: true,
      status: 200,
      data: {
        _id,
        firstName,
        email,
        isMainAdmin,
      },
    });
    return;
  } catch (error) {
    handleError(error, res);
    return;
  }
};

// register admin if code exits and not
export const registerAdmin: RequestHandler = async (
  req: Request,
  res: Response
) => {
  const { firstName, lastName, inviteCode, email, password } =
    req.body as AdminProps;
  // handle validation
  validateFields(
    {
      firstName,
      lastName,
      email,
      password,
    },
    res
  );
  const safePassword = password.trim();
  // payload for first admin
  const payload = {
    firstName: firstName,
    lastName: lastName,
    email: email,
    password: safePassword,
  };
  try {
    const countDocuments = await adminservices.checkWhetherIsFirstAdmin();

    // check if it is first admin
    if (countDocuments) {
      const newAdmin = await adminservices.createAdminIfFirst(payload);
      if (!newAdmin) {
        createResponse({
          res,
          message: `Admin account not created`,
          success: false,
          status: 404,
        });
        return;
      }
      const admintoken = jwt.sign({ id: newAdmin._id }, secret, {
        expiresIn: "30d",
      });
      setAdminAuthCookie(res, admintoken);

      createResponse({
        res,
        message: `Admin account created with ${firstName}`,
        success: true,
        status: 201,
      });
      return;
    } else if (!countDocuments && inviteCode) {
      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        //   check for code duplicasy
        const isCode = await inviteservices.checkWhetherCodeIsUsed(
          inviteCode as string,
          session
        );
        if (!isCode) {
          await session.abortTransaction()
          createResponse({
            res,
            message: "Used Code",
            success: false,
            status: 401,
          });
          return;
        }

        // check whether admin is existing with the same email
        const isExistingAdmin = await adminservices.findAdmin(email, session);
        if (isExistingAdmin) {
          await session.abortTransaction();
          createResponse({
            res,
            message: "User Already exists with same email",
            success: false,
            status: 401,
          });
          return;
        }
        // payload for other admin
        const payload1 = {
          firstName: firstName,
          lastName: lastName,
          email: email,
          password: safePassword,
          inviteCode: isCode._id as Types.ObjectId,
        };
        const newAdmin = await adminservices.createAdminIfNotFirst(
          payload1,
          session
        );
        isCode.isUsed = true;
        await isCode.save({ session });
        //   generate token
        const token = jwt.sign({ id: newAdmin._id }, secret, {
          expiresIn: "30d",
        });
        //   set cookie
        setAdminAuthCookie(res, token);
        const cacheKey = cacheKeyToGetAdmin(newAdmin._id);
        await cacheServices.del(cacheKey);
        await session.commitTransaction();
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        session.endSession();
      }

      createResponse({
        res,
        message: `Admin account created with ${firstName}`,
        success: true,
        status: 201,
      });
      return;
    }
    createResponse({
      res,
      message: "Invalid Request",
      success: false,
      status: 400,
    });
    return;
  } catch (error: any) {
    if (error.name === "ValidationError" && error.errors) {
      // extract all field error messages
      const messages = Object.values(error.errors).map(
        (err: any) => err.message
      );
      createResponse({
        res,
        status: 400,
        message: messages.join(", "), // combine all field messages
        success: false,
      });
      return;
    }
    if (error instanceof Error) {
      handleError(error, res);
      return;
    }
    handleError("Unknown error occured", res);
    return;
  }
};

export const forgotPass = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // basic validation
    const invalid = validateFields({ email }, res);
    if (invalid) return;

    // check whether any user exists with this email
    const user = await adminservices.findAdmin(email);
    if (!user) {
      createResponse({
        res,
        success: false,
        status: 401,
        message: "Account does not exists",
      });
    }
    const resetToken =
      user &&
      jwt.sign({ id: user._id, isMainAdmin: user.isMainAdmin }, secret, {
        expiresIn: "15m",
      });

    // reset url
    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // send email
    await sendEmailWithNodemailer({
    to:email,
     subject: "Password Reset Request",
      email:`You requested a password reset. Click this link to reset:${resetURL}`
    }
  
    );
    createResponse({
      res,
      success: true,
      status: 200,
      message: "Password reset link send to your email",
    });
    return;
  } catch (error) {
    if (error instanceof Error) {
      handleError(error, res);
      return;
    }
    handleError("Unknown error occured", res);
    return;
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const decoded = await verifyToken(token);

    const admin = await adminservices.findAdminByIdForDbOperation(decoded._id);
    if (!admin) {
      createResponse({
        res,
        success: false,
        status: 400,
        message: "Admin not found",
      });
      return;
    }

    const hashedPass = await hashPass(password);

    admin.password = hashedPass;
    await admin.save();

    const adminToken = jwt.sign({ id: admin._id }, secret, {
      expiresIn: "30d",
    });

    // set cookie for admin
    setAdminAuthCookie(res, adminToken);

    createResponse({
      res,
      status: 200,
      success: true,
      message: "Password Reset Successfull",
      data: admin,
    });
  } catch (error) {
    handleError(error, res);
    return;
  }
};

interface CustomReq extends Request {
  admin?: {
    _id: string;
  };
}
export const getAdmin = async (req: CustomReq, res: Response) => {
  const userId = req.admin?._id;
  try {
    const admin = await adminservices.findAdminById(userId as string);
    if (!admin) {
      createResponse({
        res,
        message: "Admin does not exists",
        status: 400,
        success: false,
      });
      return;
    }

    const { firstName, isMainAdmin, email } = admin;
    createResponse({
      res,
      success: true,
      status: 200,
      message: "Admin retrieved successfully",
      data: {
        firstName,
        email,
        isMainAdmin,
      },
    });
    return;
  } catch (error) {
    if (error instanceof Error) {
      handleError(error, res);
      return;
    }
    handleError("Unknown error occured", res);
    return;
  }
};
