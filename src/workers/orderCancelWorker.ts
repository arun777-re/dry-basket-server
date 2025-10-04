import dotenv from "dotenv";
dotenv.config({ path: require("path").resolve(__dirname, "../../.env") });
console.log("shipping key",process.env.SHIPMOZO_PUBLIC_KEY)
import { dbConnect } from "../db";

dbConnect();
import { Worker } from "bullmq";
import {
  cancelOrder,
} from "../utils/shipmozoClient";

import { SIMPLE_ORDER_SERVICES } from "../services/order/order.services";
import { BUSINESS_ORDER_SERVICE } from "../services/order/order.business";
import { bullWorkerConnection } from "../config/redis";
import { PopulatedOrderWithCartDTO } from "../types/order";

const orderserviceclass = new SIMPLE_ORDER_SERVICES();
const orderbusinessclass = new BUSINESS_ORDER_SERVICE();

// worker operating background jobs to cancel order and update stock
export const orderCancelWorker = new Worker(
  "orderCancelQueue",
  async (job) => {
    const { order,shipmentOrderId, awbno}: { shipmentOrderId: string; awbno: string,order:PopulatedOrderWithCartDTO} =
      job.data;
      console.log("hello lode :",job.data)

    //   call tracking api here 
    const cancelOrderFromShipping = await cancelOrder({orderId:shipmentOrderId,awb:awbno});
    if(cancelOrderFromShipping.result == "0"){
       throw new Error("Error during cancel order from api")
    }
    await orderbusinessclass.updateStockAfterCancelOrder({order});
  },
  { connection:bullWorkerConnection, concurrency: 5 }
);

orderCancelWorker.on("completed", (job) => {
  console.log(`${job.id} has completed!`);
});
orderCancelWorker.on("failed", (job, err) => {
  console.log(`${job!.id} has failed with ${err.message}`);
});
