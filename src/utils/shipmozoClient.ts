import axios from "axios";
import {
  ASSIGNORDERTOSHIIPINGRESDTO,
  CANCELORDERRESDTO,
  CHECKAVAILABILITYOFSHIPPINGRESDTO,
  PUSHORDERTOSHIIPINGRESDTO,
  SHIPMOZOASSIGNCOURIERDTO,
  SHIPMOZOCREATEORDERDTO,
  ShippingRateServiceParams,
  TRACKORDERSHIPPINGRESDTO,
} from "../types/shipping";

export const validPrefixes = ["11", "40", "56", "60", "70", "12", "20", "30", "38","13","14","15","16","17","18","19","21","22","23","24","25","26","27","28","29","31","32","33","34","35","36","37","39","41","42","43","44","45","46","47","48","49","50","51","52","53","54","55","57","58","59","61","62","63","64","65","66","67","68","69","71","72","73","74","75","76","77","78","79","80","81","82","83","84","85","86","87","88","89", "90", "91", "92", "93", "94", "95", "96", "97", "98", "99"];
// for realtime shipping rate calculation
// export const shippingRateService = async ({
//   pincode,
//   weight,
// }: {
//   pincode: number;
//   weight: number;
// }): Promise<ShippingRateServiceParams> => {
//   console.log("shipozoz key:", process.env.SHIPMOZO_PUBLIC_KEY);
//   console.log("pickup pincode:", process.env.PICKUP_PINCODE);
//  const result = await axios.post(
//   "https://shipping-api.com/app/api/v1/rate-calculator",
//   {
//     pickup_pincode: 131001,
//     delivery_pincode: pincode,
//     weight,
//     payment_mode: "prepaid",
//     shipment_type: "forward",
//     order_amount: 1000,
//     type_of_package: "SPS",
//     cod_amount: 0,
//     dimensions: [
//       {
//         no_of_box: "1",
//         length: "22",
//         width: "10",
//         height: "10",
//       },
//     ],
//   },
//   {
//     headers: {
//       "public-key": process.env.SHIPMOZO_PUBLIC_KEY,
//       "private-key": process.env.SHIPMOZO_PRIVATE_KEY,
//       "Content-Type": "application/json",
//     },
//   }
// );

// console.log("shipping rate service response:", result.data);
//   return result.data as unknown as ShippingRateServiceParams;
// };

// sandbox shipping rate service
export const shippingRateService = async ({
  pincode,
  weight,
}: {
  pincode: number;
  weight: number;
}): Promise<ShippingRateServiceParams> => {
 
 const result = {
    data: {
      result:1,
      message:"Success",
      data:[
        {
        "total_charges": 150 + weight * 0.05,
        "id": "courier_121",
        "courier_name": "ExpressBees"
        },
        {
        "total_charges": 140 + weight * 0.05,
        "id": "courier_125",
        "courier_name": "FastExpress"
        },
        {
        "total_charges": 130 + weight * 0.05,
        "id": "courier_124",
        "courier_name": "DTDC"
        },
        {
        "total_charges": 155 + weight * 0.05,
        "id": "courier_120",
        "courier_name": "RareX"
        },
        {
        "total_charges": 160 + weight * 0.05,
        "id": "courier_122",
        "courier_name": "FedEx"
        },
      ]
 }
}
  return result.data as unknown as ShippingRateServiceParams;
};

// push order to shipmozo shipping
// export const pushOrderToShipmozo = async (
//   data: SHIPMOZOCREATEORDERDTO
// ): Promise<PUSHORDERTOSHIIPINGRESDTO> => {
//   console.log("shipozoz key:", process.env.SHIPMOZO_PUBLIC_KEY);
//   const result = await axios.post(
//     "https://shipping-api.com/app/api/v1/push-order",
//     data,
//     {
//       headers: {
//         "public-key": process.env.SHIPMOZO_PUBLIC_KEY,
//         "private-key": process.env.SHIPMOZO_PRIVATE_KEY,
//         "Content-Type": "application/json",
//       },
//     }
//   );
//   return result.data as unknown as PUSHORDERTOSHIIPINGRESDTO;
// };

// sandbox api to push order to shipmozo shipping
export const pushOrderToShipmozo = async (
  data: SHIPMOZOCREATEORDERDTO
): Promise<PUSHORDERTOSHIIPINGRESDTO> => {
  console.log("shipozoz key:", process.env.SHIPMOZO_PUBLIC_KEY);
  const result = {
    data: {
      success: true,
      message: "Order pushed successfully (sandbox)",
      data: {
        order_id: data.order_id,
        awb_number: "SBX123456789",
        courier_id: "courier_sbx_001",
        tracking_url: "https://sandbox-tracking-url.com/SBX123456789",
      },
    },
  };
  return result.data as unknown as PUSHORDERTOSHIIPINGRESDTO;
};

// assign courier for an order
// export const assignCourierToShipmozo = async (
//   data: SHIPMOZOASSIGNCOURIERDTO
// ): Promise<ASSIGNORDERTOSHIIPINGRESDTO> => {
//   const result = await axios.post(
//     "https://shipping-api.com/app/api/v1/assign-courier",
//     data,
//     {
//       headers: {
//         "public-key": process.env.SHIPMOZO_PUBLIC_KEY,
//         "private-key": process.env.SHIPMOZO_PRIVATE_KEY,
//         "Content-Type": "application/json",
//       },
//     }
//   );
//   return result.data as unknown as ASSIGNORDERTOSHIIPINGRESDTO;
// };

// sandbox assign courier for an order
export const assignCourierToShipmozo = async (
  data: SHIPMOZOASSIGNCOURIERDTO
): Promise<ASSIGNORDERTOSHIIPINGRESDTO> => {
  const result = {
    data: {
      success: true,
      message: "Courier assigned successfully (sandbox)",
      data: {
        order_id: data.order_id,
        awb_number: "SBX123456789",
        courier_id: data.courier_id,
        tracking_url: "https://sandbox-tracking-url.com/SBX123456789",
      },
    },
  };
  return result.data as unknown as ASSIGNORDERTOSHIIPINGRESDTO;
}

// track order using awb(airwaybill number)
// export const trackOrderFromShipping = async (
//   awb: string
// ): Promise<TRACKORDERSHIPPINGRESDTO> => {
//   const result = await axios.get(
//     "https://shipping-api.com/app/api/v1/track-order",
//     {
//       params: {
//         awb_number: awb,
//       },
//       headers: {
//         "public-key": process.env.SHIPMOZO_PUBLIC_KEY,
//         "private-key": process.env.SHIPMOZO_PRIVATE_KEY,
//         "Content-Type": "application/json",
//       },
//     }
//   );
//   return result.data as unknown as TRACKORDERSHIPPINGRESDTO;
// };

// sanbox track order using awb(airwaybill number)
export const trackOrderFromShipping = async (
  awb: string
): Promise<TRACKORDERSHIPPINGRESDTO> => {
  const result = {
    data: {
      success: true,
      message: "Order tracked successfully (sandbox)",
      data: {
        awb_number: awb,
        status: "IN_TRANSIT",
        history: [
          {
            location: "Warehouse A",
            status: "PICKED_UP",
            timestamp: "2023-10-01T10:00:00Z",
          },
          {
            location: "Sorting Center",
            status: "IN_TRANSIT",
            timestamp: "2023-10-02T14:30:00Z",
          },
          {
            location: "Destination City",
            status: "OUT_FOR_DELIVERY",
            timestamp: "2023-10-03T08:15:00Z",
          },
        ],
      },
    },
  };
  return result.data as unknown as TRACKORDERSHIPPINGRESDTO;
}

// cancel order for shipmozo shipping
// export const cancelOrder = async ({
//   orderId,
//   awb,
// }: {
//   orderId: string;
//   awb: string;
// }): Promise<CANCELORDERRESDTO> => {
//   const deleteOrder = await axios.post(
//     "https://shipping-api.com/app/api/v1/cancel-order",{
//       awb_number: parseFloat(awb),
//         order_id: orderId,
//     },
//     {
    
//       headers: {
//         "public-key": process.env.SHIPMOZO_PUBLIC_KEY,
//         "private-key": process.env.SHIPMOZO_PRIVATE_KEY,
//       },
//     }
//   );
//   return deleteOrder.data;
// };

// sandbox cancel order
export const cancelOrder = async ({
  orderId,
  awb,
}: {
  orderId: string;
  awb: string;
}): Promise<CANCELORDERRESDTO> => {
  const result = {
    data: {
      success: true,
      message: "Order cancelled successfully (sandbox)",
      data: {
        order_id: orderId,
        awb_number: awb,
        status: "CANCELLED",
      },
    },
  };
  return result.data as unknown as CANCELORDERRESDTO;
}

// check pincode serviceability for realtime shipping
// export const checkPincodeForShipping = async ({
//   pickup_pincode,
//   delivery_pincode,
// }: {
//   pickup_pincode: number;
//   delivery_pincode: number;
// }): Promise<boolean> => {
//   const check = await axios.post(
//     "https://shipping-api.com/app/api/v1/pincode-serviceability",
//     {
//       pickup_pincode,
//       delivery_pincode,
//     },
//     {
//       headers: {
//         "public-key": process.env.SHIPMOZO_PUBLIC_KEY,
//         "private-key": process.env.SHIPMOZO_PRIVATE_KEY,
//         "Content-Type": "application/json",
//       },
//     }
//   );

//   console.log("Pincode serviceability response:", check.data);
//   return check.data.data.serviceable;
// };

// dummy pickup pincode added
export const checkPincodeForShipping = async ({
  pickup_pincode,
  delivery_pincode,
}: {
  pickup_pincode: number;
  delivery_pincode: number;
}): Promise<boolean> => {
 

  const isValid =
    String(delivery_pincode).length === 6 &&
    validPrefixes.some(prefix => String(delivery_pincode).startsWith(prefix));

  return isValid;
};
