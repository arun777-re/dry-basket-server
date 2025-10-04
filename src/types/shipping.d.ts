export type SHIPMOZOCREATEORDERDTO = {
  order_id: string;
  order_date: Date | string;
  consignee_name: string;
  consignee_phone: number;
  consignee_email?: string;
  consignee_address_line_one: string;
  consignee_address_line_two?: string;
  consignee_pin_code: number;
  consignee_city: string;
  consignee_state: string;
  product_detail: any[];
  payment_type: string;
  cod_amount?: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  warehouse_id: string;
};


export type SHIPMOZOASSIGNCOURIERDTO = {
    order_id:string;
    courier_id:number;
}

export type ShippingRateServiceParams = {
    result:string;
    message:string;
    data:any[]
  }

 export type PUSHORDERTOSHIIPINGRESDTO = {
    result:string;
    message:string;
    data:{
      Info:string;
      order_id:string;
      reference_id:string;
    }
 } 

 export type ASSIGNORDERTOSHIIPINGRESDTO = {
    result:string;
    message:string;
    data:{
      order_id:string;
      reference_id:string;
      courier:string;
      awb_number:string;
    }
 } 

 export type TRACKORDERSHIPPINGRESDTO = {
   result:string;
    message:string;
    data:{
      order_id:string;
      reference_id:string;
      courier:string;
      expected_delivery_date:string;
      current_status:string;
      status_time:Date;
      scan_detail:any[];
    }
 }
 export type CHECKAVAILABILITYOFSHIPPINGRESDTO = {
   result:string;
    message:string;
    data:{
      serviceable:boolean;
    }
 }
 export type CANCELORDERRESDTO = {
   result:string;
    message:string;
    data:{
      order_id:string;
      awb_number:number;
    }
 }


  export type SHIPPINGRATEREQUESTDTO = {
    weight: number;
  pincode: string;
  }

  export interface ShippingRateResponseDTO {
  courierId: string;
  total_charges: number;
}
  export type Dimensions = {
    length: number;
  width: number;
  height: number;
  }
  export type Rate = {
    total_charges: number;
    [key: string]: any;
  };