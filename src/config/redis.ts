import IORedis from 'ioredis'

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || 'redis://127.0.0.1:6379';

export const redisClient = new IORedis(REDIS_URL as string, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisClient.on('error',(err)=> console.log('Redis Error:',err));
redisClient.on('connect',()=>console.log('Redis connected'));



// creating a connection using redis with ioredis
export const bullqConnection= new IORedis(REDIS_URL as string,{
    maxRetriesPerRequest:null,
    enableReadyCheck:false
}); 

// creating a connection using redis with ioredis
export const bullWorkerConnection= new IORedis(REDIS_URL as string,{
    maxRetriesPerRequest:null,
    enableReadyCheck:false
}); 
