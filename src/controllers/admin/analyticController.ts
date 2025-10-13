import { Request, Response } from "express";
import { PaginationQuery } from "../../types/response";
import { createResponse, handleError } from "../../utils/heplers";
import { SimpleProductService } from "../../services/productService";
import { AnalyticClass } from "../../services/admin/analyticService";

const productclass = new SimpleProductService();
const analyticclass = new AnalyticClass();

// for stock alert
export const stockAlert = async (req: Request, res: Response) => {
  const query = req.query as unknown as PaginationQuery;
  if (!query || Object.keys(query).length === 0) {
    createResponse({
      res,
      success: false,
      message: "Provide Query for pagination",
      status: 400,
    });
    return;
  }
  try {
    const products = await productclass.getProductsForLessStock({ query });
    if (!products) {
      createResponse({
        res,
        success: false,
        message: "Error during find low stock products",
        status: 404,
      });
      return;
    }
    if (products.products.length === 0) {
      createResponse({
        res,
        success: true,
        message: "No any products have low stock",
        status: 200,
      });
      return;
    }

    createResponse({
      res,
      success: true,
      message: " products have low stock",
      status: 200,
      data: products.products,
      hasNextPage: products.hasNextPage,
      hasPrevPage: products.hasPrevPage,
      currentPage: products.currentPage,
    });
    return;
  } catch (error) {
    handleError(error, res);
    return;
  }
};

// for
export const totalSales = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;
    const incomingData = await analyticclass.getTotalSale({
      startDate: startDate as string,
      endDate: endDate as string,
    });
    if (!incomingData) {
      createResponse({
        success: false,
        status: 404,
        message: "Error during fetch total sales",
        res,
      });
      return;
    }
    createResponse({
      success: true,
      status: 200,
      message: "total sales and total orders are",
      res,
      data: incomingData,
    });
  } catch (error) {
    handleError(error, res);
    return;
  }
};

// top selling products
export const topSellingProduct = async (req: Request, res: Response) => {
  try {
    const topProduct = await analyticclass.topProduct();
    if (!topProduct) {
      createResponse({
        res,
        success: false,
        status: 404,
        message: "Error during get top selling product",
      });
      return;
    }

    createResponse({
      res,
      success: true,
      status: 200,
      message: "Top selling products fetched successfully",
      data: topProduct,
    });
    return;
  } catch (error) {
    handleError(error, res);
    return;
  }
};

// total customers
export const totalCustomers = async (req: Request, res: Response) => {
  try {
    const totalUsers = await analyticclass.userDocs();
    if (!totalUsers) {
      createResponse({
        success: false,
        status: 404,
        res,
        message: "Error during get total customers",
      });
      return;
    }
    if (totalUsers === 0) {
      createResponse({
        success: true,
        status: 200,
        res,
        message: "No customers yet",
        data: 0,
      });
      return;
    }
    createResponse({
      success: true,
      status: 200,
      res,
      message: "Total customers:",
      data: totalUsers,
    });
    return;
  } catch (error) {
    handleError(error, res);
    return;
  }
};
// monthly revenue for line chart in admin dashboard 
export const salesByMonth = async (req: Request, res: Response) => {
  try {
    const totalsale = await analyticclass.saleinamonth();
    if (!totalsale) {
      createResponse({
        success: false,
        status: 404,
        res,
        message: "Error during get total sale by month",
      });
      return;
    }
    if (totalsale.length === 0) {
      createResponse({
        success: true,
        status: 200,
        res,
        message: "No sales in month yet",
        data: [],
      });
      return;
    }
    createResponse({
      success: true,
      status: 200,
      res,
      message: "Total customers:",
      data: totalsale,
    });
    return;
  } catch (error) {
    handleError(error, res);
    return;
  }
};
