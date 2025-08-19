import mongoose from 'mongoose';
import { CategoryDocument } from '../types/category';


const categorySchema = new mongoose.Schema<CategoryDocument>({
    name:{type:String,required:true},
    slug:{type:String,required:true},
    parent:{type:mongoose.Schema.Types.ObjectId,
        ref:'Category',
        default:null
    }
},{timestamps:true});

// virtuals are not stored in db they are created during query
categorySchema.virtual('children',{
    ref:'Category',
    localField:'_id',
    foreignField:'parent'
});

// set them to odject and in json format
categorySchema.set('toObject',{virtuals:true});
categorySchema.set('toJSON',{virtuals:true});

const Category = mongoose.models.Category || mongoose.model('Category',categorySchema);

export default Category;