import mongoose, { Schema, Document } from "mongoose";

export interface IInviteCode extends Document {
  code: string;
  isUsed: boolean;
  createdAt: Date;
  usedAt?: Date;
}

const InviteCodeSchema: Schema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: (v: string) => {
          return /^[A-Z0-9a-z]{10}$/.test(v);
        },
        message: (props: any) => `${props.value} is not a valid invite code!`,
      },
    },
    isUsed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    usedAt: { type: Date },
  },
  {
    timestamps: true,
  }
);


const InviteCode = mongoose.models.InviteCode || mongoose.model("InviteCode",InviteCodeSchema);

export default InviteCode;
