export const getShippingRateCacheKey = (
  pincode: string,
  weightInGrams: number
) => {
  return `shippingRate:${pincode}:${weightInGrams}`;
};

export const getAllOrdersCacheKey = (userID: string, query: any) => {
  return `ordersOfUser:${userID}:${JSON.stringify(query)}`;
};

export const checkPincodeForShippingCacheKey = (pinCode: number) => {
  return `shipping:pincode:${pinCode}`;
};

export const cacheKeyToGetCourierId = (orderId: string) => {
  return `courierId:${orderId}`;
};

export const cacheKeyToGetAdmin = (adminId: string) => {
  return `admin:${adminId}`;
};
export const cacheKeyForLoginAttempts = (ip: string) => {
  return `login:attempts:${ip}`;
};

export const cacheKeyToGetUser = (userId: string) => {
  return `user:${userId}`;
};

export const cacheKeyToGetFeaturedProducts = (query: any, catId: string) => {
  return `featuredProducts:${catId}:${JSON.stringify(query)}`;
};

export const cacheKeyToGetFilterProducts = ({
  category,
  page,
  limit,
  price,
  productName,
  weight,
}: {
  category: string;
  price: string;
  productName: string;
  page: number;
  limit: number;
  weight:string;
}) => {
  return `searchProducts:${JSON.stringify({
    category,
    price,
    productName,
    page,
    limit,
  })}`;
};

export const cacheKeyToGetRelatedProducts=({category,productName,query}:{category:string,productName:string,query:any})=>{
    return `relatedProducts:${JSON.stringify({
          category,
          productName,
        })}:${JSON.stringify(query)}`;
}
export const cacheKeyToGetRecommendedProducts=({catId,query}:{catId:string,query:any})=>{
    return `recommendedProducts:${catId}:${JSON.stringify(query)}`;
}

export const cacheKeyToGetAllCategoryProducts=({catId,query}:{catId:string,query:any})=>{
    return `allCategoryProducts:${catId}:${JSON.stringify(
      query
    )}`;
}

export const cacheKeyToGetAllWishList=({userId,query}:{userId:string,query?:any})=>{
   return `wl:${userId}:p=${query.page || 1}:l=${query.limit || 10}`;

}
