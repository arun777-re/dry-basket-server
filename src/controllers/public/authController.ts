import {
  createResponse,
  handleError,
  validateFields,
} from "../../utils/heplers";
import { Request, Response } from "express";
import { UserServices } from "../../services/userService";

import { setAuthCookies } from "../../utils/cookieHelpers";
import { TokenService } from "../../utils/tokenService";
import { sendEmail } from "../../utils/sendEmail";
import { hashPassWord } from "../../utils/bcryptHelpers";
import { UserDocument, UserOutgoingReqDTO } from "../../types/user";
import mongoose from "mongoose";
import { CustomReq } from "../../types/customreq";
import { cacheServices, checkRateLimit } from "../../services/redis/cache";
import { cacheKeyToGetUser } from "../../utils/cacheKeyUtils";

const userService = new UserServices();

export const signupUser = async (req: Request, res: Response) => {
  const { firstName, lastName, email, password } = req.body;
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
  try {
    // check whether any user with email exists before
    const existingUser = await userService.findUserByEmail(email);
    if (existingUser) {
      createResponse({
        success: false,
        status: 400,
        message: "User already exists with this email",
        res,
      });
      return;
    }

    //   create user
    const newUser = await userService.createUserService(req.body);
    if (!newUser) {
      createResponse({
        success: false,
        status: 500,
        message: "User creation failed",
        res,
      });
      return;
    }

    if (!newUser._id) {
      throw new Error("Id is required");
    }
    const accesstoken = TokenService.generateAccessToken(newUser._id);
    const refreshtoken = TokenService.generateRefreshToken(newUser._id);
    setAuthCookies(res, accesstoken, refreshtoken);

    createResponse({
      success: true,
      message: `${firstName} account created successfully`,
      status: 201,
      res,
      data: {
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
      },
    });
    return;
  } catch (error: any) {
    console.error("Validation error during save", error.message);
    handleError(error, res);
  }
};

export const signin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // validate fields
  validateFields({ email, password }, res);

  try {
    // limit incoming req
    const ip = req.ip;
    const allowed = await checkRateLimit(ip as string, 5, 60 * 5);
    if (!allowed) {
      createResponse({
        success: false,
        status: 429,
        message: "Too many requests.Try again later",
        res,
      });
      return;
    }
    // check user exists with the email
    const userservice = new UserServices();
    const user = await userservice.findUserByEmail(email);
    if (!user) {
      createResponse({
        success: false,
        status: 401,
        message: "No User exists with email",
        res,
      });
      return;
    }

    const comparePass = await user.comparePassword(password);

    if (!comparePass) {
      createResponse({
        success: false,
        status: 401,
        message: "Invalid credentials",
        res,
      });
      return;
    }

    if (!user._id) {
      throw new Error("Id is required");
    }
    const accesstoken = TokenService.generateAccessToken(user?._id.toString());
    const refreshtoken = TokenService.generateRefreshToken(
      user?._id.toString()
    );
    setAuthCookies(res, accesstoken, refreshtoken);

    createResponse({
      success: true,
      status: 200,
      message: "Login Successfull",
      res,
      data: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
    return;
  } catch (error: any) {
    if (process.env.NODE_ENV === "production") {
      console.error(error.message);
    }
    handleError(error, res);
  }
};

export const logout = async (req: CustomReq, res: Response) => {
  const userId = req?.user?._id;
  const cacheKey = cacheKeyToGetUser(userId as string);
  try {
    const statusChange = await userService.changeActiveStatus(userId as string);
    if (!statusChange) {
      createResponse({
        success: false,
        message: "User does not exists / error during change user status",
        status: 404,
        res,
      });
      return;
    }
    setAuthCookies(res, null, null);
    await cacheServices.del(cacheKey);
    createResponse({
      message: "Log Out Successfully",
      success: true,
      status: 200,
      data: [],
      res,
    });
    return;
  } catch (error: any) {
    handleError(error, res);
    return;
  }
};

// reset-request password
export const resetPassRequest = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    // basic validation
    validateFields(email, res);

    const userservice = new UserServices();
    const isUserExists = await userservice.findUserByEmail(email);
    if (!isUserExists) {
      createResponse({
        success: false,
        message: "You donot have any account with this email",
        status: 400,
        res,
      });
      return;
    }

    const resetToken = TokenService.generateRestToken(email);
    const resetLink = `${process.env.SERVER_URL}/reset-password?token=${resetToken}`;

    await sendEmail(
      email,
      "Reset Your Password",
      `Click the link to reset your password: ${resetLink}`
    );

    console.log("Email sent");
    createResponse({
      success: true,
      message: "Reset link sent to your email",
      status: 200,
      res,
    });
    return;
  } catch (error) {
    handleError(error, res);
    return;
  }
};

// controller to reset-password
export const resetPassWord = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { token } = req.query;
    const { password } = req.body;

    // Basic validation
    validateFields({ token, password }, res);

    // Decode token
    const decoded = TokenService.staticVerifyToken(token as string);

    const email = decoded as string;

    const userservice = new UserServices();
    const user: UserDocument | null = await userservice.findUserByEmail(email);
    if (!user) {
      session.abortTransaction();
      createResponse({
        success: false,
        status: 404,
        message: "Account does not exist",
        res,
      });
      return;
    }

    const userId = (user!._id as any).toString();
    // Hash new password
    const hashedPassword = await hashPassWord(password);

    // Update password

    const isUpdated = await userservice.updatePassService({
      userId,
      hashPass: hashedPassword,
      session,
      expectedVersion: user.__v,
    });
    if (!isUpdated) {
      session.abortTransaction();
      createResponse({
        success: false,
        status: 500,
        message: "Password update failed",
        res,
      });
      return;
    }

    // Generate new tokens
    const accessToken = TokenService.generateAccessToken(userId.toString());
    const refreshToken = TokenService.generateRefreshToken(userId.toString());

    // Set cookies
    setAuthCookies(res, accessToken, refreshToken);
    session.commitTransaction();
    createResponse({
      success: true,
      status: 200,
      message: "Password was successfully updated",
      res,
    });
    return;
  } catch (error) {
    session.abortTransaction();
    handleError(
      error instanceof Error ? error : new Error("Unknown error occurred"),
      res
    );
    return;
  } finally {
    session.endSession();
  }
};

// update pass word if user wants to change
export const updatePassWord = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { email, password } = req.body;

    // basic validation
    validateFields({ email, password }, res);

    const userservice = new UserServices();
    const user = await userservice.findUserByEmail(email);
    if (!user) {
      session.abortTransaction();
      createResponse({
        success: false,
        status: 401,
        message: "Account does not exist",
        res,
      });
      return;
    }

    const userId = (user!._id as any).toString();
    const hashPass = await hashPassWord(password);

    const updatePass = await userservice.updatePassService({
      userId,
      hashPass,
      session,
      expectedVersion: user.__v,
    });
    if (!updatePass) {
      session.abortTransaction();
      createResponse({
        success: false,
        status: 500,
        message: "Password update failed",
        res,
      });
      return;
    }

    const accesstoken = TokenService.generateAccessToken(userId);
    const refreshtoken = TokenService.generateRefreshToken(userId);

    setAuthCookies(res, accesstoken, refreshtoken);

    session.commitTransaction();
    createResponse({
      success: true,
      status: 200,
      message: "Password was updated",
      res,
      data: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    });
    return;
  } catch (error) {
    session.abortTransaction();
    if (error instanceof Error) {
      handleError(error, res);
      return;
    }
    handleError("Unknown error occurred", res);
    return;
  } finally {
    session.endSession();
  }
};

// get user profile
export const getUserProfile = async (req: CustomReq, res: Response) => {
  const userId = req.user?._id;
  const cacheKey = cacheKeyToGetUser(userId as string);
  // check cache first
  const cached = await cacheServices.get<UserOutgoingReqDTO>(cacheKey);
  if (cached) {
    createResponse({
      success: true,
      message: "User profile fetched successfully",
      status: 200,
      res,
      data: cached,
    });
    return;
  }

  try {
    const user = await userService.findUserByIdNormal(userId as string);
    if (!user) {
      createResponse({
        success: false,
        status: 404,
        message: "User not found",
        res,
      });
      return;
    }
    const payload = {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    await cacheServices.set(cacheKey, payload, 60 * 60); // cache for 1 hour
    createResponse({
      success: true,
      status: 200,
      message: "User profile fetched successfully",
      res,
      data: payload,
    });
    return;
  } catch (error) {
    console.error(
      "Error fetching user profile:",
      error instanceof Error ? error.message : error
    );
    handleError("Error fetching user profile", res);
    return;
  }
};
