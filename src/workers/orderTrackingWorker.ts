import "dotenv/config";
import dotenv from "dotenv";
dotenv.config({ path: require("path").resolve(__dirname, "../../.env") });

import { dbConnect } from "../db";

dbConnect();
import { Worker } from "bullmq";
import { trackOrderFromShipping } from "../utils/shipmozoClient";
import { BUSINESS_ORDER_SERVICE } from "../services/order/order.business";
import { bullWorkerConnection } from "../config/redis";
import { sendEmailWithNodemailer } from "../utils/email";

const orderbusinessclass = new BUSINESS_ORDER_SERVICE();

export const orderTrackWorker = new Worker(
  "orderTrackingQueue",
  async (job) => {
    console.log("Worker picked job:", job.id, job.data); 
    const {
      orderId,
      awbno,
      expectedVersion,
      userEmail,
      userName,
    }: { orderId: string; awbno: string; expectedVersion: number,userEmail?:string,userName?:string } = job.data;
    console.log("hello lode data", job.data);
    //   call tracking api here
    const trackingData = await trackOrderFromShipping(awbno);
    console.log("tracking data", trackingData);
    if (trackingData.result !== "1") {
      throw new Error("Error during tracking status from api");
    }
    // tracking history update only if current status is not equal to previous stored in db
    const isValidToUpdate =
      await orderbusinessclass.getLastTrackingStatusOfOrder({
        orderId,
        newStatus: trackingData.data.current_status,
      });
    if (isValidToUpdate) {
      await orderbusinessclass.updateTrackingHistory({
        orderId,
        trackingData,
        expectedVersion,
      });

      // send email to customer about status update
   await sendEmailWithNodemailer({
  to: userEmail ?? "", // recipient
  subject: `Order Update: Your AWB ${awbno} is now ${trackingData.data.current_status}`,
  email: `
    <p>Hi ${userName},</p>
    <p>Your order with <strong>AWB #${awbno}</strong> is now <strong>${trackingData.data.current_status}</strong>.</p>
    <p>You can track your order for more details here:</p>
    <a href="https://yourstore.com/track/${awbno}" target="_blank">Track Order</a>
    <br/><br/>
    <p>Thank you for shopping with us!</p>
  `,
});

// also here notification functionallity comes for whatsapp

    }

    // yahan parr condition based notification send karenge

    // stop repeating if delievered/cancelled
    if (
      ["delivered", "cancelled", "rto delivered"].includes(
        trackingData.data.current_status.toLowerCase()
      )
    ) {
      await job.remove();
      console.log("Stopped tracking for order", orderId);
    }
  },
  { connection: bullWorkerConnection, concurrency: 5 }
);

orderTrackWorker.on("completed", (job) => {
  console.log(`${job.id} has completed!`);
});
orderTrackWorker.on("failed", (job, err) => {
  console.log(`${job!.id} has failed with ${err.message}`);
});
