import Agent from "../../models/AgentSchema";
import { createResponse, handleError, hashPass, validateFields } from "../../utils/heplers";
import jwt from "jsonwebtoken";
import { Request, RequestHandler, Response } from "express";
import InviteCode from "../../models/InviteCode";
import { sendEmail } from "../../utils/sendEmail";
import { verifyToken } from "../../middleware/verifyToken";

const secret = process.env.JWT_SECRET || "";

export const loginAdmin:RequestHandler = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // validate fields
    const invalid = validateFields({ email, password }, res);
    if (invalid) return;

    // check if admin exists
    const admin = await Agent.findOne({ email });
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
    const { _id, name, phone, isMainAdmin } = admin;

    // set token cookie
    res.cookie("adminToken", token, {
      httpOnly: true,
      sameSite: "none",
      secure:false,
      maxAge: 30 * 24 * 60 * 60 * 1000, 
      path: "/",
    });

    // send response
   createResponse({
      res,
      message: "Logged in successfully",
      success: true,
      status: 200,
      data: {
        _id,
        name,
        email,
        phone,
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
export const registerAdmin:RequestHandler = async(req:Request,res:Response)=>{
  try {
    const { name, phone, code, email, password } = req.body;

    // handle validation
  const invalid =  validateFields({
      name,
      phone,
      email,
      password,
    },res);
    
    if(invalid) return;

    const countDocuments = await Agent.countDocuments();

    const hashedPass = await hashPass(password);

    // check if it is first admin
    if (countDocuments === 0) {
      const newAdmin =  new Agent({
        name,
        phone,
        email,
        password:hashedPass,
        isMainAdmin: true,
      });

      await newAdmin.save();
      const admintoken = jwt.sign({ id: newAdmin._id }, secret, { expiresIn: "30d" });
    
      res.cookie("adminToken",admintoken, {
        httpOnly: true,
        secure:process.env.NODE_ENV === 'production',
        sameSite:process.env.NODE_ENV === 'production' ? 'none' :"lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
      });
  

        createResponse({res,
        message: `Admin account created with ${name}`,
        success: true,
        status: 201,
      });
      return;
    } else if (countDocuments >= 1 && code) {
      //   check for code duplicasy
      const isCode = await InviteCode.findOne({ code });
      if (!isCode || isCode.isUsed) {
        createResponse({
            res,
          message: "Used Code",
          success: false,
          status: 401,
        });
        return;
      }

      // check whether admin is existing with the same email
      const isExistingAdmin = await Agent.findOne({ email });
      if (isExistingAdmin) {
        createResponse({
            res,
          message: "User Already exists with same email",
          success: false,
          status: 401,
        });
        return;
      }
      const newAdmin = await new Agent({
        name,
        phone,
        email,
        password:hashedPass,
        code: isCode._id,
      });

      await newAdmin.save();

      isCode.isUsed = true;
      await isCode.save();

      //   generate token
      const token = jwt.sign({ id: newAdmin._id }, secret, { expiresIn: "30d" });
      //   set cookie
     
      res.cookie("adminToken", token, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
      });
       createResponse({
        res,
        message: `Admin account created with ${name}`,
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
    if (error instanceof Error) {
      handleError(error,res);
      return;
    }
    handleError("Unknown error occured",res);
    return;
  }
}

export const forgotPass = async(req:Request,res:Response)=>{
 try {
    const { email} = req.body;

    // basic validation
   const invalid = validateFields({ email},res);
   if(invalid) return;

    // check whether any user exists with this email
    const user = await Agent.findOne({ email: email });
    if (!user) {
       createResponse({
        res,
        success: false,
        status: 401,
        message: "Account does not exists",
      });
    }

    const resetToken = jwt.sign({ id: user._id,isMainAdmin:user.isMainAdmin}, secret, { expiresIn: "15m" });

    // reset url
    const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // send email
    await sendEmail(email,'Password Reset Request',
        `You requested a password reset. Click this link to reset:${resetURL}`
    )
     createResponse({
        res,
      success: true,
      status: 200,
      message: "Password reset link send to your email",
    });
    return;
  } catch (error) {
    if (error instanceof Error) {
      handleError(error,res);
      return;
    }
   handleError('Unknown error occured',res);
   return;
  }
}

export const resetPassword = async(req:Request,res:Response)=>{
    const {token} = req.params;
    const {password} = req.body;
    try {
      const decoded = await verifyToken(token);

      const admin = await Agent.findById(decoded._id);
      if(!admin){
        createResponse({
            res,
            success:false,
            status:400,
            message:"Admin not found"
        });
        return;
      }
     
      const hashedPass = await hashPass(password);

       admin.password = hashedPass;
       await admin.save();

       const adminToken = jwt.sign({id:admin._id},secret,{expiresIn:'30d'});
       res.cookie('adminToken',adminToken,{
        httpOnly:true,
        sameSite:'strict',
        secure:process.env.NODE_ENV === 'production',
        path:'/',
        maxAge: 30 * 24 * 60 * 60 * 1000,
       })

       createResponse({
        res,
        status:200,
        success:true,
        message:'Password Reset Successfull',
        data:admin
       })

    } catch (error) {
        handleError(error,res);
        return;
    }
}

interface CustomReq extends Request{
    admin?:{
        _id:string;
    }
}
export const getAdmin = async(req:CustomReq,res:Response)=>{
    try {
        const userId = req.admin?._id;

        const admin = await Agent.findById(userId).select('-password');
        if(!admin){
            createResponse({
                res,
                message:"Admin does not exists",
                status:400,
                success:false
            });
            return;
        }

        const {name,isMainAdmin,email,phone} = admin;
        createResponse({
            res,
            success:true,
            status:200,
            message:'Admin retrieved successfully',
            data:{
                name,email,phone,isMainAdmin
            }
        })
        return;
    } catch (error) {
        if(error instanceof Error){
            handleError(error,res);
            return;
        }
        handleError('Unknown error occured',res);
        return;
    }
}