import bodyParser from "body-parser";
import cors from "cors";
import express from "express";
import { environment } from "./environment.js";
import type { SignedRequest } from "./interfaces/fediverse/signedRequest.js";
import { activityPubRoutes } from "./routes/activitypub/activitypub.js";
import { wellKnownRoutes } from "./routes/activitypub/well-known.js";
import checkIpBlocked from "./utils/checkIpBlocked.js";
import { logger } from "./utils/logger.js";
import overrideContentType from "./utils/overrideContentType.js";

const PORT = environment.fediPort;
const app = express();
app.use(cors());
app.use(checkIpBlocked);
app.use(overrideContentType);
app.set("trust proxy", 1);
app.use(
	bodyParser.json({
		limit: "50mb",
		verify: (req: SignedRequest, _res, buf) => {
			req.rawBody = buf.toString();
		},
	}),
);

app.use("/contexts", express.static("contexts"));
activityPubRoutes(app);
wellKnownRoutes(app);

app.listen(PORT, environment.listenIp, () => {
	logger.info("Started fedi listener");
});
