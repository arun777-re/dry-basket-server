import mongoose, { ClientSession } from "mongoose";
import { PublicUserDTO } from "../dtos/user.dto";
import { toPublicUserDTO } from "../mapper/user.mapper";
import User from "../models/User";
import { UserDocument, UserOutgoingReqDTO, UserProps } from "../types/user";


export class UserServices {
    constructor(private userModel = User){}
async  findUserByEmail(
  email: string
): Promise<UserDocument | null> {
  try {
    const user = await User.findOne({ email });
    if (!user) return null;
    return user;
  } catch (error) {
    throw error;
  }
};
async findUserById (
  userId: string
): Promise<UserDocument | null>{
  try {
    const user = await User.findById(userId);
    if (!user) return null;
    return user ;
  } catch (error) {
    throw error;
  }
};
async findUserByIdNormal (
  userId: string
): Promise<UserOutgoingReqDTO | null>{
  try {
    const user = await User.findById(userId).select("-_id,-__v").lean();
    console.log("user",user)
    if (!user) return null;
    return user as unknown as UserOutgoingReqDTO;
  } catch (error) {
    throw error;
  }
};

async createUserService (
  data: Omit<UserProps, "_id" | "__v">
): Promise<PublicUserDTO | null>{
  try {
    const newUser = await User.create(data);
    if (!newUser) return null;

    return toPublicUserDTO(newUser?.toObject() as UserProps);
  } catch (error) {
   throw error;
  }
};

// occ: optimistic concurrency control
async updatePassService ({userId,hashPass,session,expectedVersion}:{
  userId: string,
  hashPass: string,
  session:ClientSession,
  expectedVersion?:number
}): Promise<UserDocument | null> {
  try {
    const query:any ={_id:userId};
    if(expectedVersion !== undefined)query.__v = expectedVersion;
    const updatePass = await User.findOneAndUpdate(
      query,
      {
        $set: { password: hashPass },
      },
      { new: true ,session}
    );
    return updatePass;
  } catch (error) {
   throw error
  }
}
}

