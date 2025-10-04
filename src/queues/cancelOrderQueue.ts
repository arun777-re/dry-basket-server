import {Queue} from 'bullmq';

import { bullqConnection } from '../config/redis';


// creating a queue using bullmq and passing connection 
export const orderCancelQueue = new Queue('orderCancelQueue',{connection:bullqConnection});
