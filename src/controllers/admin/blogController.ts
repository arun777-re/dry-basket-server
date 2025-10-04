import { Request, Response } from "express";
import slugify from "slugify";
import { v4 as uuid } from "uuid";
import {
  createResponse,
  handleError,
  validateFields,
} from "../../utils/heplers";
import { BlogIncomingReqDTO } from "../../types/blog";
import { BlogServiceClass } from "../../services/blog/blog.services";

const blogclass = new BlogServiceClass();

export const createBlog = async (req: Request, res: Response) => {
    const { authorName, heading, description, blogImage, tags,title } =
      req.body as BlogIncomingReqDTO;
  try {
  
    validateFields({ authorName, heading, description, blogImage, tags,title }, res);

    // generate a unique slug
    const slug = slugify(`${blogImage}-${uuid().slice(0, 6)}`, {
      lower: true,
      strict: true,
    });

    const createBlogOperation = await blogclass.createBlog(req.body, slug);
    if (!createBlogOperation) {
      createResponse({
        success: false,
        message: "Error occured during create Blog",
        status: 404,
        res,
      });
      return;
    }
    createResponse({
      success: true,
      message: "Operation successfull create Blog",
      status: 201,
      res,
    });
    return;
  } catch (error) {
    console.error(
      "Error during create Blog",
      error instanceof Error ? error.message : error
    );
    handleError(
      error instanceof Error
        ? error.message
        : "Unknown error occured during create blog",
      res
    );
  }
};

export const deleteBlog = async (req: Request, res: Response) => {
  const { slug } = req.query;
  if (!slug) {
    createResponse({
      res,
      success: false,
      status: 400,
      message: "Provide slug for the blog",
    });
    return;
  }
  try {
    const dltBlogOperation = await blogclass.deleteBlog(slug as string);
    if (!dltBlogOperation) {
      createResponse({
        res,
        success: false,
        status: 404,
        message: "Not found or already deleted blog",
      });
      return;
    }

    createResponse({
      res,
      success: true,
      status: 200,
      message: "Operation delete blog successfull",
    });
    return;
  } catch (error) {
    console.error(
      "Error during delete Blog",
      error instanceof Error ? error.message : error
    );
    handleError(
      error instanceof Error
        ? error.message
        : "Unknown error occured during delete blog",
      res
    );
  }
};

export const getBlog = async (req: Request, res: Response) => {
  const { slug } = req.query;
  if (!slug) {
    createResponse({
      res,
      success: false,
      status: 400,
      message: "Provide slug for the blog",
    });
    return;
  }
  try {
    const blog = await blogclass.getBlogBySlug(slug as string);
    if (!blog) {
      createResponse({
        res,
        success: false,
        status: 404,
        message: `Blog not found for this slug:${slug}`,
      });
      return;
    }

    createResponse({
      res,
      success: true,
      status: 200,
      message: `Blog found for this slug:${slug}`,
      data: blog,
    });
    return;
  } catch (error) {
    console.error(
      "Error during get Blog",
      error instanceof Error ? error.message : error
    );
    handleError(
      error instanceof Error
        ? error.message
        : "Unknown error occured during get blog",
      res
    );
  }
};
export const updateBlog = async (req: Request, res: Response) => {
  const { slug } = req.query;
  const safeSlug = (slug as string).trim();
  const { tags, heading } = req.body as Partial<BlogIncomingReqDTO>;
  if (!safeSlug && !tags && !heading) {
    createResponse({
      res,
      success: false,
      status: 400,
      message: "Provide slug for the blog or body fields missing",
    });
    return;
  }
  try {

    const blogOperation = await blogclass.updateBlog(safeSlug, req.body);
    if (!blogOperation) {
      createResponse({
        res,
        success: false,
        status: 404,
        message: `Blog not updated for given fields:${slug}`,
      });
      return;
    }

    createResponse({
      res,
      success: true,
      status: 200,
      message: `Blog updated for this slug:${slug}`,
    });
    return;
  } catch (error) {
    console.error(
      "Error during get Blog",
      error instanceof Error ? error.message : error
    );
    handleError(
      error instanceof Error
        ? error.message
        : "Unknown error occured during get blog",
      res
    );
  }
};
export const getAllBlog = async (req: Request, res: Response) => {
  const query = req.query;
  if (!query) {
    createResponse({
      res,
      success: false,
      status: 400,
      message: "Provide slug for the blog",
    });
    return;
  }
  try {
    const blog = await blogclass.getAllBlogs({ query });
    if (!blog) {
      createResponse({
        res,
        success: false,
        status: 404,
        message: `Blog not found for this slug`,
      });
      return;
    }

    createResponse({
      res,
      success: true,
      status: 200,
      message: `Blog found for this slug`,
      data: blog.products,
      currentPage: blog.currentPage,
      hasNextPage: blog.hasNextPage,
      hasPrevPage: blog.hasPrevPage,
    });
    return;
  } catch (error) {
    console.error(
      "Error during get Blog",
      error instanceof Error ? error.message : error
    );
    handleError(
      error instanceof Error
        ? error.message
        : "Unknown error occured during get blog",
      res
    );
  }
};
