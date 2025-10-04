import Razorpay  from "razorpay";
import crypto from 'crypto'
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils";

const razorpay = new Razorpay({
  key_id: process.env.PAYMENT_KEY,
  key_secret: process.env.PAYMENT_SECRET,
});
export class RAZORPAY_SERVICES{
    async createOrder({amount,notes,currency}:{amount:number,notes?:Record<string,any>,
        currency:string
    }){
        try {
             const options = {
                 amount,
                 currency,
                 notes: notes || {},
               };
           
               const order = await razorpay.orders.create(options); 
               return order;
        } catch (error) {
            console.error("Error during create order in razorpay");
            throw new Error("Error during create order in razorpay")
        }
    }
    verifySignature({razorpay_order_id,razorpay_payment_id,razorpay_signature}:{
       razorpay_order_id:string,razorpay_payment_id:string,razorpay_signature:string
    }):boolean{
     const body = razorpay_order_id + "|" + razorpay_payment_id;
     const expectedSignature = crypto
  .createHmac("sha256", process.env.PAYMENT_SECRET!)
  .update(body)
  .digest("hex");

 return expectedSignature === razorpay_signature
   
    }
}