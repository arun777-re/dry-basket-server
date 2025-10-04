import {Queue} from 'bullmq';

import { bullqConnection } from '../config/redis';




// creating a queue using bullmq and passing connection 
export const orderQueue = new Queue('orderQueue',{connection:bullqConnection}); 
