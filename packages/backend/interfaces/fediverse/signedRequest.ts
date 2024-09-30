import type { Request } from "express";

export interface SignedRequest extends Request {
	fediData?: {
		fediHost: string;
		remoteUserUrl?: string;
		valid: boolean;
	};
	rawBody?: string;
}
