import { CartMongooseDocument } from "../types/cart";
import mongoose, { Model } from "mongoose";

const cartSchema = new mongoose.Schema<CartMongooseDocument>(
  {
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        categoryOfProduct: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          default: 0,
        },
        variant: {
          weight: { type: Number, required: true },
          price: { type: Number, required: true },
          priceAfterDiscount: {
            type: Number,
            required: false,
            default: parseFloat("0.00"),
          },
        },
        addedAtPrice: {
          type: Number,
          required: true,
        },
        subtotal: {
          type: Number,
          required: true,
          default: 0,
        },
      },
    ],
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    total: {
      type: Number,
      required: true,
      default: 0,
    },
    coupon: [
      {
        code: { type: String, default: null },
        discountAmount: { type: Number, default: 0 },
        percentage: { type: Number, default: 0 },
      },
    ],
    finalTotal: {
      type: Number,
      required: true,
      default: 0,
    },
    totalWeight:{
      type:Number,
      default:0
    }
  },
  { timestamps: true, optimisticConcurrency: true, versionKey: "__v" }
);

cartSchema.pre("save", function (next) {
  const cart = this as unknown as CartMongooseDocument;
  // calculate subtotal for each item
  cart.items = cart.items.map((item: any) => {
    let discountedPrice = item.variant.priceAfterDiscount ?? item.variant.price;
    item.subtotal = discountedPrice * item.quantity;
    return item;
  });
  // cart total = sum of all subtotals
  cart.total = Array.isArray(cart.items) && cart.items.length > 0 && cart.items.reduce((acc: number, item: any) => {
    return acc + item.subtotal;
  }, 0);

  // usefull for shipment
  cart.totalWeight = Array.isArray(cart.items) && cart.items.length > 0 ? cart.items.reduce((acc:number,item:any)=>{
    const totalWeightOfProduct = (item.variant.weight * item.quantity)
    return acc + totalWeightOfProduct
  },0) : 0;
  let finalTotal = cart.total;

  cart.finalTotal = Math.max(finalTotal, 0);
  next();
});

cartSchema.index({ userId: 1, __v: 1 }, { unique: true });


const Cart: Model<CartMongooseDocument> =
  mongoose.models.Cart ||
  mongoose.model<CartMongooseDocument>("Cart", cartSchema);
export default Cart;
