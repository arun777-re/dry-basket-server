import mongoose from 'mongoose';
import { ReviewDocument } from '../types/review';


const reviewSchema = new mongoose.Schema<ReviewDocument>({
userId:{type:mongoose.Schema.Types.ObjectId,
    ref:'User'
},
productId:{
type:mongoose.Schema.Types.ObjectId,
ref:'Product'
},
rating:{
    type:Number,
    required:true,
    min:1,
    max:5,
    default:0
},
reviewText:{
    type:String,
    required:[true,"Enter some text about product"],
},

},{timestamps:true});


reviewSchema.index({productId:1})

const Review = mongoose.models.Review || mongoose.model('Review',reviewSchema);


export default Review;