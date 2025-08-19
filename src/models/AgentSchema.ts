import mongoose from "mongoose";
import bcrypt from "bcryptjs";


export interface AgentProps {
  name:string;
  email:string;
  code:mongoose.Types.ObjectId;
  password:string;
  phone:string;
  isMainAdmin?:string;
}

interface AgentDocument extends mongoose.Document,AgentProps{
  comparePassword(candidatePassword:string):Promise<boolean>;
}

const agentSchema = new mongoose.Schema<AgentDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    code: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InviteCode",
      required:false,
    },
    password: {
      type: String,
      required: true,
      validate: {
        validator: (values: string) => {
          return  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&]).{6,}$/.test(values);
        },
        message: `Enter a valid password of minimum 8 characters`,
      },
    },
    phone: { type: String, required: true },
    isMainAdmin: { type: Boolean, default: "false", required: false },
  },
  { timestamps: true }
);

agentSchema.pre("save", async function (next){
  const agent = this as AgentDocument;
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


// method to compare password
agentSchema.methods.comparePassword = async function(candidatePassword:string){
return bcrypt.compare(candidatePassword,this.password);
}

const Agent = mongoose.models.Agent || mongoose.model<AgentDocument>("Agent", agentSchema);

export default Agent;
