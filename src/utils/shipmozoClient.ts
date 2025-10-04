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

export const shippingRateService = async ({
  pincode,
  weight,
}: {
  pincode: number;
  weight: number;
}): Promise<ShippingRateServiceParams> => {
  const result = await axios.post(
    "https://shipping-api.com/app/api/v1/rate-calculator",
    {
      pickup_pincode: "131001", // Example pickup pincode
      delivery_pincode: pincode,
      weight,
      payment_type: "PREPAID",
      shipment_type: "FORWARD",
      order_amount: 1000,
      type_of_package: "SPS",
      cod_amount: 0,
      dimensions: [
        {
          no_of_box: "1",
          length: "22",
          width: "10",
          height: "10",
        },
      ],
    },
    {
      headers: {
        "public-key": process.env.SHIPMOZO_PUBLIC_KEY,
        "private-key": process.env.SHIPMOZO_PRIVATE_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  return result.data as unknown as ShippingRateServiceParams;
};

export const pushOrderToShipmozo = async (
  data: SHIPMOZOCREATEORDERDTO
): Promise<PUSHORDERTOSHIIPINGRESDTO> => {
  console.log("shipozoz key:", process.env.SHIPMOZO_PUBLIC_KEY);
  const result = await axios.post(
    "https://shipping-api.com/app/api/v1/push-order",
    data,
    {
      headers: {
        "public-key": process.env.SHIPMOZO_PUBLIC_KEY,
        "private-key": process.env.SHIPMOZO_PRIVATE_KEY,
        "Content-Type": "application/json",
      },
    }
  );
  return result.data as unknown as PUSHORDERTOSHIIPINGRESDTO;
};

// assign courier for an order
export const assignCourierToShipmozo = async (
  data: SHIPMOZOASSIGNCOURIERDTO
): Promise<ASSIGNORDERTOSHIIPINGRESDTO> => {
  const result = await axios.post(
    "https://shipping-api.com/app/api/v1/assign-courier",
    data,
    {
      headers: {
        "public-key": process.env.SHIPMOZO_PUBLIC_KEY,
        "private-key": process.env.SHIPMOZO_PRIVATE_KEY,
        "Content-Type": "application/json",
      },
    }
  );
  return result.data as unknown as ASSIGNORDERTOSHIIPINGRESDTO;
};

// track order using awb(airwaybill number)
export const trackOrderFromShipping = async (
  awb: string
): Promise<TRACKORDERSHIPPINGRESDTO> => {
  const result = await axios.get(
    "https://shipping-api.com/app/api/v1/track-order",
    {
      params: {
        awb_number: awb,
      },
      headers: {
        "public-key": process.env.SHIPMOZO_PUBLIC_KEY,
        "private-key": process.env.SHIPMOZO_PRIVATE_KEY,
        "Content-Type": "application/json",
      },
    }
  );
  return result.data as unknown as TRACKORDERSHIPPINGRESDTO;
};

// cancel order
export const cancelOrder = async ({
  orderId,
  awb,
}: {
  orderId: string;
  awb: string;
}): Promise<CANCELORDERRESDTO> => {
  const deleteOrder = await axios.post(
    "https://shipping-api.com/app/api/v1/cancel-order",{
      awb_number: parseFloat(awb),
        order_id: orderId,
    },
    {
    
      headers: {
        "public-key": process.env.SHIPMOZO_PUBLIC_KEY,
        "private-key": process.env.SHIPMOZO_PRIVATE_KEY,
      },
    }
  );
  return deleteOrder.data;
};

// check pincode serviceability
export const checkPincodeForShipping = async ({
  pickup_pincode,
  delivery_pincode,
}: {
  pickup_pincode: number;
  delivery_pincode: number;
}): Promise<boolean> => {
  const check = await axios.post(
    "https://shipping-api.com/app/api/v1/pincode-serviceability",
    {
      pickup_pincode,
      delivery_pincode,
    },
    {
      headers: {
        "public-key": process.env.SHIPMOZO_PUBLIC_KEY,
        "private-key": process.env.SHIPMOZO_PRIVATE_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  return check.data.data.serviceable;
};
