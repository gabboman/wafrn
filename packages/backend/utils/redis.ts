import { Redis } from "ioredis";
import { environment } from "../environment.js";
const redisCache = new Redis(environment.redisioConnection);

export { redisCache };
