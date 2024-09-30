import cors from "cors";
import express from "express";
import { environment } from "./environment.js";
import cacheRoutes from "./routes/remoteCache.js";
import checkIpBlocked from "./utils/checkIpBlocked.js";
import { logger } from "./utils/logger.js";

const PORT = environment.cachePort;

const app = express();
app.use(checkIpBlocked);
app.use(cors());
app.set("trust proxy", 1);

cacheRoutes(app);

app.listen(PORT, environment.listenIp, () => {
	logger.info("Started fedi listener");
});
