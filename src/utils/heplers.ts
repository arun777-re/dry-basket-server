import Category from "../models/Category";
import mongoose, { ClientSession, Model } from "mongoose";
import { verifyToken, verifyUserToken } from "../middleware/verifyToken";
import { Request,Response,NextFunction } from "express";
import User from "../models/User";
import bcrypt from 'bcryptjs';
import { CustomReq } from "../types/customreq";
import { CartItemOutgoingDTO, CartMongooseDocument } from "../types/cart";
import items from "razorpay/dist/types/items";

export function validateFields(fields: Record<string, any>,res:Response) {
  // create an array from object recieved using entries method and then filter to check whether fields are provide or not
  const missing = Object.entries(fields).filter(
    ([_, value]) => value === undefined || value === null || value === ""
  );

  if (missing.length > 0) {
    const missingKeys = missing.map(([key]) => key).join(",");
    throw new Error(`Provide required fields: ${missingKeys}`)
  }
  return null;
}

// function to send response in the same way all over website
export function createResponse({
  res,
  success,
  status,
  message,
  data,
  currentPage,
  hasNextPage,
  hasPrevPage
  
}: {
  res:Response,
  success: boolean;
  status: number;
  message: string;
  data?: any;
  currentPage?:number,
  hasNextPage?:boolean,
  hasPrevPage?:boolean
}) {
  // assigning properties comes to a single object
  const body: Record<string, any> = { success, status, message };
  if (data !== undefined) body.data = data;
  return res.status(status).json(body);
}

// function for pagination 
export async function pagination ({query,model}:{query:any,model:Model<any>}){
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;

  // use safelimit 
  const safelimit = limit > 0 ? limit : 10;

  const totalDocs = await model.countDocuments();
  const totalPages = Math.ceil(totalDocs / safelimit);

  // current page
  const currentPage = Math.min(Math.max(page,1),totalPages);

  // how many items to skip
  const skip = (page - 1) * safelimit;

  return {
    limit:safelimit,
    skip,
    currentPage,
    hasNextPage:currentPage < totalPages,
    hasPrevPage : currentPage > 1, 
  }

}

// function to check whether category exists or is a leaf category means its has no parents

export const getValidLeafCategory = async(category:string)=>{
const categoryExist = await Category.findOne({name:category});
if(!categoryExist){
  throw new Error('No such category exists');
}
const isExistsInParent = await Category.exists({parent:categoryExist._id});
if(isExistsInParent){
   throw new Error('It is not a last/leaf category');
}

return categoryExist._id;
}

// get user from token 
export const getUserFromToken = async(token:string)=>{
  const decoded = await verifyToken(token);
  const user = await User.findById(decoded.id);
  return user || null;
}



// for the optional chaining runs both cases if user available or not
export const withAuth = (required = false)=>{
return async (req:CustomReq,res:Response,next:NextFunction)=>{
 await verifyUserToken(req,res,async()=>{
 const user = req.user;
 if(required && !user){
 return createResponse({
   message:'Unauthorized',
   status:401,
   success:false,
   res
 })
 }
  return next();

 },required);

}

}


// handle error in the same error pattern this is for catch block
export const handleError = (error: any, res: Response) => {
  if (process.env.NODE_ENV !== "production") {
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    } else {
      console.error("Unknown error:", error);
    }
  }
  return createResponse({
    status: error.statusCode || 500,
    message: "Internal Server Error",
    success: false,
    res
  });
};

// handle Error using createResponse func
export const sendError = async({
  res,
  session,
  message,
  status
}:{res:Response,
  session?:ClientSession | null,
  message:string,
  status:number
}):Promise<never>=>{
  if(session && session.inTransaction()){
   await session.abortTransaction();

  }
  createResponse({
    success:false,
    message,
    status,
    res
   });
   throw new Error(message);
}



// hash pass
export const hashPass = async(password:string)=>{
  const salt = await bcrypt.genSalt(12);
  const hashPass = await bcrypt.hash(password,salt);
  return hashPass;
}

// skip regex coming from input if by chance user send any not valuable characters
export const escapeRegex = (text:string)=>{
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g,'\\$&');
}

// js recursion func to make tree structured data coming form $graphlookup
export interface CategoryNode {
  _id: string;
  name: string;
  parent?: string;
}

export interface CategoryTreeNode extends CategoryNode {
  children: CategoryTreeNode[];
}

// this is recursive function who calls itself
export function buildTree(
  parentId: string,
  categories: CategoryNode[]
): CategoryTreeNode[] {
  return categories
    .filter(cat => String(cat.parent) === String(parentId))
    .map(cat => ({
      _id: cat._id,
      name: cat.name,
      parent: cat.parent,
      children: buildTree(cat._id, categories)
    }));
}



export async function runWithRetryTransaction<T>(
  fn: (session: ClientSession) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const result = await fn(session);
      await session.commitTransaction();
      return result;
    } catch (err: any) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      if (err.hasErrorLabel && err.hasErrorLabel('TransientTransactionError')) {
        await new Promise((r) => setTimeout(r, 200 * (i + 1)));
        continue;
      }
      throw err;
    } finally {
      session.endSession();
    }
  }
  throw new Error('Max retries exceeded');
}
