import mongoose from "mongoose";
import { WishListSchemaDTO } from "../types/wishlist";



const wishlistSchema = new mongoose.Schema<WishListSchemaDTO>({
userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:true,
},
productId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Product',
    required:true,
},

},{timestamps:true});


wishlistSchema.index({ userId: 1, productId: 1 }, { unique: true });

const Wishlist = mongoose.model('Wishlist',wishlistSchema);

export default Wishlist;