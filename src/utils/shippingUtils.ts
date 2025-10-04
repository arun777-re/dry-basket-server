import { OrderSchemaDTO } from "../types/order";
import { Dimensions, Rate, SHIPPINGRATEREQUESTDTO, ShippingRateResponseDTO } from "../types/shipping"


export const calculateDimensionsForShipping = (weight:number)=>{
    let dimensions:Dimensions;
  
  if (weight <= 500) {
    dimensions = { length: 10, width: 10, height: 5 }; // small packet
  } else if (weight <= 2000) {
    dimensions = { length: 20, width: 15, height: 10 }; // medium box
  } else if (weight <= 5000) {
    dimensions = { length: 30, width: 20, height: 15 }; // large box
  } else {
    dimensions = { length: 40, width: 30, height: 20 }; // XL box
  }

  return dimensions ;
}

export const bestRateCalculator = (rates:Rate[]):ShippingRateResponseDTO | null =>{
  if(!rates || rates.length === 0 ) return null;
  const best = rates.reduce((prev,current)=>
  prev.total_charges < current.total_charges ? prev : current);
  return {courierId:best.id,
    total_charges:best.total_charges
  }
}


// for map incoming order status from shipping to orderStatus
export const mapCourierStatus = (status:string) =>{
  const map:Record<string,OrderSchemaDTO["orderStatus"]> = {
     "PLACED": "PENDING",
    "CONFIRMED": "CONFIRMED",
    "IN_TRANSIT": "SHIPPED",
    "OUT_FOR_DELIVERY": "SHIPPED",
    "DELIVERED": "DELIVERED",
    "CANCELLED": "CANCELLED"
  };
  return map[status.toUpperCase()] || "PENDING"
};

// FUNCTION TO RETRY OR DEBOUNCE 
export async function withRetry<T>(
  fn:()=>Promise<T>,
  retries = 2,
  delay = 1000
):Promise<T>{
let attempts = 0;
while(true){
  try {
    return await fn();
  } catch (error:any) {
    attempts ++ ;
    if(attempts > retries){
      throw error;

    }
    console.warn(`Retrying after error(attempt ${attempts} / ${retries})`,error.message ||error);
    await new Promise((resolve)=> setTimeout(resolve,delay))
  }
}
}