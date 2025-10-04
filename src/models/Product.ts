import { ProductDocument, ProductVariant } from "../types/product";
import mongoose from "mongoose";



const variantSchema = new mongoose.Schema({
 weight: { type: Number, required: true },
        price: {
          type: Number,
          required: [true, "Please enter Price of Product"],
          max: [99999999, "Price cannot be exceeds 8 digits"],
        },
        stock: {
          type: Number,
          required: [true, "Please enter Stock of Product"],
          default: 1,
          max: [99999, "Stock cannot exceeds 5 characters"],
        },
        sold:{type:Number,default:0},
        discount: { type: Number, default: 0},  
        discountExpiry: {
          type: Date,
          default: null,
        },
},{_id:false,toJSON:{virtuals:true},toObject:{virtuals:true}});


// virtual field for price after discount
variantSchema.virtual('priceAfterDiscount').get(function(){
  const now = new Date();
  const discountActive = this.discount > 0 && 
  (!this.discountExpiry || new Date(this.discountExpiry) > now);
  if(discountActive){
    const discountRate = this.discount / 100
    return Math.max(0,this.price *(1 - discountRate))
  }
  return this.price;
})

const productSchema = new mongoose.Schema<ProductDocument>(
  {
    slug: { type: String, required: true, unique: true, index: true },
    productName: {
      type: String,
      required: [true, "Please Enter Product Name"],
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Please Add a Product Category"],
    },
    status: {
      type: String,
      default: "available",
      enum: ["available", "unavailable"],
    },
    description: {
      type: String,
      required: true,
      minlength: [50, "Description must be 50 characters"],
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    isFeatured: {
      type: Boolean,
      default: false,
    },
    tags: [
      {
        type: String,
        required: true,
      },
    ],
    avgRating: {
      type: Number,
      required: false,
      default: 1,
    },
    variants: [
     variantSchema
    ],
  },
  { timestamps: true ,toJSON:{virtuals:true},toObject:{virtuals:true}}
);

// check on every modification is discount is greater than price
productSchema.pre("save", function (next) {
  if (this.isModified("variants")) {
    this.variants.forEach((variant) => {
      if (variant.discount && variant.discount > variant.price) {
        throw new Error("Discount cannot be greater than price");
      }
    });
  }
  next();
});

// compound index for text search
productSchema.index({ productName: "text", description: "text", tags: "text" });
productSchema.index({ productName: 1 });
productSchema.index({ description: 1 });
productSchema.index({ category: 1, status: 1 });

const Product =
  mongoose.models.Product ||
  mongoose.model<ProductDocument>("Product", productSchema);

export default Product;
