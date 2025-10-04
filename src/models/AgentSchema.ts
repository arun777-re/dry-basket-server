import mongoose, { Document } from "mongoose";
import bcrypt from "bcryptjs";
import { AdminProps } from "../types/admin";




export interface AgentDocument extends Document,AdminProps{
  comparePassword(candidatePassword:string):Promise<boolean>;
}

const agentSchema = new mongoose.Schema<AgentDocument>(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true,index:true },
    inviteCode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InviteCode",
      required:false,
      unique:true,
      sparse:true
    },
    password: {
      type: String,
      required: true,
      trim:true,
      minLength:[6,'Password must have 6 charactrers'],
      maxLength:[10,'Password cannot be large than 10 charactres'],
      validate: {
        validator: (values: string) => {
          return  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&]).{6,10}$/.test(values);
        },
        message: `Password must be 6-10 characters must include uppercase,number,special characters,lowercase`,
      },
    },
    isMainAdmin: { type: Boolean, default:false, required: false },
  },
  { timestamps: true }
);

agentSchema.pre("save", async function (next){
  if (!this.isModified("password")) return next();
  try {
      const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
  } catch (error) {
    next(error as any);
  }
});


// method to compare password
agentSchema.methods.comparePassword = async function(candidatePassword:string){
return bcrypt.compare(candidatePassword,this.password);
}

const Agent = mongoose.models.Agent || mongoose.model<AgentDocument>("Agent", agentSchema);

export default Agent;
