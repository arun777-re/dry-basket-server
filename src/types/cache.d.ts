export interface RedisCacheDTO {
    set<T>(key:string,value:T,ttlSeconds?:number):Promise<void>;
    get<T>(key:string):Promise<T | null>;
    del(key:string):Promise<void>;
    exists(key:string):Promise<boolean>;
    setIfNotExists<T>(key:string,value:T,ttlSeconds?:number):Promise<boolean>;
    atomicUpdate<T>(key:string,updateFn:(prev:T | null)=>T):Promise<T>
}