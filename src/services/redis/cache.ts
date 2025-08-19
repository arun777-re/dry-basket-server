import { redisClient } from "../../config/redis";
import { RedisCacheDTO } from "../../types/cache";


export const cacheServices:RedisCacheDTO = {
  async set<T>(key:string,value:T,ttlSeconds?:number){
    const serialized = JSON.stringify(value);
    if(ttlSeconds){
        await redisClient.setEx(key,ttlSeconds,serialized);
    }else{
        await redisClient.set(key,serialized);
    }
  },
  async get<T>(key:string){
    const data = await redisClient.get(key);
    return data ? (JSON.parse(data) as T) : null;

  },
  async del(key){
    await redisClient.del(key);
  },
  async exists(key){
    return (await redisClient.exists(key)) > 0;
  },

//   OCC safe insert (only if key does not exists)
async setIfNotExists<T>(key:string,value:T,ttlSeconds?:number){
    const serialized = JSON.stringify(value);
    const result = ttlSeconds ? 
    await redisClient.set(key,serialized,{condition:'NX',expiration:{type:'EX',value:ttlSeconds}}) :
    await redisClient.set(key,serialized,{condition:'NX'});

    return result === 'OK'
},

// OCC safe atomic updates 
async atomicUpdate<T>(key:string, updateFn:((prev:T | null)=>T),maxRetry = 5,
retryDelay = 50) {
    let updatedValue:T;
    let success = false;
    let attempts = 0;
    while(!success && attempts < maxRetry){
        attempts++;
        await redisClient.watch(key);
        const currentData = await redisClient.get(key);
        const currentValue = currentData ? (JSON.parse(currentData) as T) : null;

        updatedValue = updateFn(currentValue);
        const serialized = JSON.stringify(updatedValue);
        const multi = redisClient.multi();
        multi.set(key,serialized);
        // only succeds if no one modified bw watch and exec
        const execResult = await multi.exec();
        success = !!execResult;
        if(!success){
            // delay before new req to avoid constant collision
            await redisClient.unwatch();
            await new Promise(res => setTimeout(res,retryDelay))

        }
    }
      if (!success) {
    throw new Error(`Atomic update failed after ${maxRetry} retries for key: ${key}`);
  }
   return updatedValue!;
},
}