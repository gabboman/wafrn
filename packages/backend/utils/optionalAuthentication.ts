import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { environment } from "../environment.js";

export default function optionalAuthentication(
	req: Request,
	_res: Response,
	next: NextFunction,
) {
	try {
		const authHeader = req.headers.authorization;
		const token = authHeader?.split(" ")[1];

		jwt.verify(
			token!,
			environment.jwtSecret as string,
			(err: any, jwtData: any) => {
				if (err) {
					(req as any).jwtData = false;
				}
				(req as any).jwtData = jwtData;
			},
		);
	} catch (_error) {
		(req as any).jwtData = false;
	}
	next();
}
