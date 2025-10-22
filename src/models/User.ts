import mongoose, { Model } from "mongoose";
import bcrypt from "bcryptjs";
import { UserDocument} from "../types/user";


const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      unique: false,
    },
    lastName: {
      type: String,
      required: true,
      unique: false,
    },
    email: {
      type: String,
      required: true,
      unique: true,
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
    isActive: {
      type: Boolean,
      default:false,
    },
 
  },
  { timestamps: true, validateBeforeSave: true }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    const strongPassword =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&]).{6,}$/;
    if (!strongPassword.test(this.password)) {
      return next(
        new Error(
          "Password must be at least 6 characters long and include an uppercase letter, lowercase letter, number, and special character."
        )
      );
    }

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});


userSchema.methods.comparePassword = async function (
  candidatePassword: string
) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User: Model<UserDocument> =
  mongoose.models.User || mongoose.model<UserDocument>("User", userSchema);

export default User;
