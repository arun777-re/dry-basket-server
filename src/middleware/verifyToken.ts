import { createResponse, getUserFromToken } from "../utils/heplers";
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import Agent from "../models/AgentSchema";
import { setAuthCookies } from "../utils/cookieHelpers";
import { TokenService } from "../utils/tokenService";
import { CustomReq } from "../types/customreq";

const secret = process.env.JWT_SECRET || "";
// Helper function to verify jwt token
export const verifyToken = (token: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!token) {
      reject(new Error("No Token provided"));
      return;
    }
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
};

// ✅ Verify Admin Token middleware
export const verifyAdminToken = async (
  req: CustomReq,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.adminToken;
    if (!token) {
      createResponse({
        res,
        success: false,
        status: 401,
        message: "You are not authenticated, login/signup first",
      });
      return;
    }

    const verify = await verifyToken(token);
    if (!verify || !verify.id) {
      createResponse({
        res,
        success: false,
        status: 401,
        message: "Invalid or expired token",
      });
      return;
    }
    const admin = await Agent.findById(verify.id);
    if (!admin) {
      createResponse({
        res,
        success: false,
        status: 401,
        message: "Admin not found",
      });
      return;
    }
    // Attach admin to req if needed
    req.admin = admin;
    next();
  } catch (error) {
    createResponse({
      res,
      success: false,
      status: 401,
      message: "Invalid or expired token",
    });
    return;
  }
};

// ✅ Verify User Token middleware
export const verifyUserToken = async (
  req: CustomReq,
  res: Response,
  next: NextFunction,
  required = false
) => {
  try {
    const token = req.cookies.accesstoken;

    // 📌 No access token
    if (!token) {
      const refreshToken = req.cookies.refreshtoken;

      // 📌 No refresh token either
      if (!refreshToken) {
        if (required) {
          createResponse({
            res,
            success: false,
            status: 401,
            message: "No token provided",
          });
          return;
        }
        return next();
      }

      // 📌 If refresh token exists
      const user = await getUserFromToken(refreshToken);
      if (!user) {
        if (required) {
          createResponse({
            res,
            success: false,
            status: 404,
            message: "User not found",
          });
          return;
        }
        return next();
      }

      // 📌 Generate new tokens
      const newAccessToken = TokenService.generateAccessToken(
        user._id as string
      );
      const newRefreshToken = TokenService.generateRefreshToken(
        user._id as string
      );

      // 📌 Set cookies
      setAuthCookies(res, newAccessToken, newRefreshToken);

      req.user = user;
      return next();
    }

    // 📌 If access token exists
    const user = await getUserFromToken(token);

    if (!user) {
      if (required) {
        return createResponse({
          res,
          success: false,
          status: 404,
          message: "User not found",
        });
      }
      return next();
    }

    // 📌 Optional: mark user as active if needed
    user.isActive = true;
    await user.save({ validateBeforeSave: false });

    req.user = user;
    return next();
  } catch (error: any) {
    if (process.env.NODE_ENV !== "production") {
      console.error("Token verification error", error.message);
    }

    if (error.name === "TokenExpiredError") {
      if (required) {
        return createResponse({
          res,
          message: "Token expired",
          success: false,
          status: 401,
        });
      }
      return next();
    } else if (error.name === "JsonWebTokenError") {
      if (required) {
        return createResponse({
          res,
          message: "Invalid token",
          success: false,
          status: 401,
        });
      }
      return next();
    } else {
      if (required) {
        return createResponse({
          res,
          message: "Internal Server Error",
          success: false,
          status: 500,
        });
      }
      return next();
    }
  }
};
