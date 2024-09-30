import { pino } from "pino";
import { environment } from "../environment.js";

const transport = pino.transport(environment.pinoTransportOptions as any);

export const logger = pino(
	{
		level: environment.logLevel,
		timestamp: pino.stdTimeFunctions.isoTime,
	},
	transport,
);
