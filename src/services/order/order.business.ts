import { ClientSession } from "mongoose";
import {
  OrderIncomingReqDTO,
  OrderSchemaDTO,
  PopulatedOrderWithCartDTO,
} from "../../types/order";
import Order from "../../models/Order";
import { SIMPLE_ORDER_SERVICES } from "./order.services";
import { TRACKORDERSHIPPINGRESDTO } from "../../types/shipping";
import { mapCourierStatus } from "../../utils/shippingUtils";
import { Product } from "../../models";

const simpleorderservice = new SIMPLE_ORDER_SERVICES();

export class BUSINESS_ORDER_SERVICE {
  async updateCourierInfo({
    orderId,
    awbNumber,
    courier,
    session,
    shippingOrderId,
  }: {
    orderId: string;
    awbNumber: string;
    courier: string;
    session?: ClientSession;
    shippingOrderId: string;
  }): Promise<OrderSchemaDTO> {
    try {
      const query = {
        $set: {
          "courierInfo.courierName": courier,
          "courierInfo.awbNumber": awbNumber,
          "courierInfo.shipmentOrderId": shippingOrderId,
        },
      };
      const res = await Order.findOneAndUpdate({ _id: orderId }, query, {
        new: true,
        session,
      });
      console.log("hello function called from worker:",res)
      return res as OrderSchemaDTO;
    } catch (error) {
      console.log(`Error during update courierInfo of order:${orderId}`, error);
      throw new Error(`Error during update courierInfo of order:${orderId}`);
    }
  }

  async updateTrackingHistory({
    orderId,
    trackingData,
    expectedVersion,
  }: {
    orderId: string;
    trackingData: TRACKORDERSHIPPINGRESDTO;
    expectedVersion: number;
  }): Promise<PopulatedOrderWithCartDTO | null> {
    try {
      if (!trackingData)
        throw new Error("Error during update tracking history of order");
      const orderstatus = mapCourierStatus(trackingData.data.current_status);
      const updated = await Order.findByIdAndUpdate(
        { _id: orderId, __v: expectedVersion },
        {
          $set: {
            "courierInfo.estimatedDeliveryDate":
              trackingData.data.expected_delivery_date,
            orderStatus: orderstatus,
          },
          $addToSet: {
            trackingHistory: {
              status: trackingData.data.current_status,
              timeStamp: trackingData.data.status_time,
            },
          },
        },
        { new: true, versionKey: true }
      )
        .populate({
          path: "cartId",
          populate: {
            path: "items.productId",
            select: "productName categoryOfProduct",
          },
        })
        .lean();
      if (!updated) return null;
      return updated as unknown as PopulatedOrderWithCartDTO;
    } catch (error) {
      console.error(
        error instanceof Error
          ? error.message
          : "Unknown error occured during update order tracking History"
      );
      throw new Error("Error occured during update order tracking History");
    }
  }

  async updateStockAfterSuccessfullOrder({
    order,
    session
  }: {
    order: PopulatedOrderWithCartDTO;
    session:ClientSession
  }): Promise<boolean> {
    try {
    // bulk operations ka array banate hain
    const bulkOps = order.cartId.items.map((item)=>({
      updateOne:{
        filter:{_id:item.productId},
        update:{
          $inc:{"variants.$[elem].stock" : -item.quantity,"variants.$[elem].sold": + item.quantity}
        },
        arrayFilters:[{"elem.weight" : item.variant.weight,"elem.stock":{$gte:item.quantity}}]
      }
    }))

    const result = await Product.bulkWrite(bulkOps,{session});
    console.log("Bulk stock update result:",result);
      return true;
    } catch (error) {
      console.error(
        "Error during update stock",
        error instanceof Error ? error.message : error
      );
      throw new Error("Error during update stock");
    }
  }
  async updateStockAfterCancelOrder({
    order,
  }: {
    order: PopulatedOrderWithCartDTO;
  }): Promise<boolean> {
    try {

      const bulkOps = order.cartId.items.map((item)=>({
        updateOne:{
          filter:{_id:item.productId},
          update:{
            $inc:{"variants.$[elem].stock": + item.quantity,"variants.$[elem].sold": -item.quantity}
          },
          arrayFilters:[{"elem.weight": item.variant.weight}]
        }
      }
       
      ))
      const result = await Product.bulkWrite(bulkOps);
      console.log("result from update stock",result);
    
      return true;
    } catch (error) {
      console.error(
        "Error during update stock",
        error instanceof Error ? error.message : error
      );
      throw new Error("Error during update stock");
    }
  }
  // to get latest order tracking status
  async getLastTrackingStatusOfOrder({orderId,newStatus}:{orderId:string,newStatus:string}):Promise<boolean>{
try {
  const order = await Order.findOne({_id:orderId}).lean() as OrderIncomingReqDTO;
   if (!order) {
      return false; 
    }
   

  if(!order.trackingHistory ||order.trackingHistory?.length === 0) return true;
  const last = order.trackingHistory[order.trackingHistory.length - 1];
  if(last.status === newStatus) return false;
  return true;
} catch (error) {
    console.error(
        "Error during get tracking data of order",
        error instanceof Error ? error.message : error
      );
      throw new Error("Error during get tracking data of order");
}
  }
}
