import { Order } from "../../models";
import User from "../../models/User";

export class AnalyticClass {
  async getTotalSale({
    startDate,
    endDate,
  }: {
    startDate: string;
    endDate: string;
  }) {
    try {
      const match: any = { orderStatus: "DELIVERED" };
      if (startDate && endDate) {
        match.createdAt = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string),
        };
      }
      const result = await Order.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
            totalOrders: { $sum: 1 },
          },
        },
      ]);
      const data = result[0] || { totalRevenue: 0, totalOrders: 0 };
      return data;
    } catch (error: any) {
      console.error("Error during get total sale", error);
      throw new Error(`Error during get total sale:${error.message}`);
    }
  }
  async topProduct(){
    try {
        const result = await Order.aggregate([
            {$unwind:"$cartItems"},
            {
                $group:{
                    _id:"$cartItems.productId",
                    totalSold:{$sum:"$cartItems.quantity"}
                },
            },
            {$sort:{totalSold:-1}},
            {$limit:10},
            {
                $lookup:{
                    from:"products",
                    localField:"_id",
                    foreignField:"_id",
                    as:"product",
                },
            },
            {$unwind:'$product'},
            {
                $project:{
                    _id:0,
                    productName:"$product.productName",
                    totalSold:1,
                    category:"$product.category",
                }
            }
        ]);
        return result;
    } catch (error:any) {
     console.error("Error during get top selling product", error);
      throw new Error(`Error during get top selling product:${error.message}`);
    }
  }
  async userDocs(){
    try {
        const docs = await User.countDocuments();
        return docs;
    } catch (error:any) {
         console.error("Error during get total docs of users", error);
      throw new Error(`Error during get total docs of users:${error.message}`);
    }
  }
  async saleinamonth(){
    try {
        const data = await Order.aggregate([
            {$match:{orderStatus:"DELIVERED"}},
            {
                $group:{
                _id:{$month:"$createdAt"},
                totalSales:{$sum:"$amount"},
                totalOrders:{$sum:1},
                },
            },
            {$sort:{"_id":1}}
        ]);
        console.log("hello data comes:",data)
        return data;
    } catch (error:any) {
         console.error("Error during get total sales by month", error);
      throw new Error(`Error during get total sales by month:${error.message}`);
    }
  }
}
