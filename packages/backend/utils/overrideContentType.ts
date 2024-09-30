import type { NextFunction, Request, Response } from "express";

export default function overrideContentType(
	req: Request,
	_res: Response,
	next: NextFunction,
) {
	const UrlPath = req.path;
	if (UrlPath.startsWith("/fediverse")) {
		req.headers["content-type"] = "application/json;charset=UTF-8";
	}
	next();
}
