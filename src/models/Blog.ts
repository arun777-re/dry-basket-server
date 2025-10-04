
import mongoose from 'mongoose';
import { BlogsSchemaDTO } from '../types/blog';


const blogSchema = new mongoose.Schema<BlogsSchemaDTO>({
slug:{type:String,required:true,unique:true,index:true},
heading:{type:String,required:true},
title:{type:String,required:true},
description:{type:String,required:true},
blogImage:{type:String,required:true},
authorName:{type:String,required:true},
tags:{type:[String],required:true,index:true}
},{timestamps:true});


const Blog = mongoose.model('Blog',blogSchema);

export default Blog;