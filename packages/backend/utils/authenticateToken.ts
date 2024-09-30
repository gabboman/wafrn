import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { environment } from "../environment.js";
import type AuthorizedRequest from "../interfaces/authorizedRequest.js";

function authenticateToken(req: Request, res: Response, next: NextFunction) {
	const authHeader = req.headers.authorization;
	const token = authHeader?.split(" ")[1];

	if (token == null) {
		return res.sendStatus(401);
	}

	jwt.verify(
		token,
		environment.jwtSecret as string,
		(err: any, jwtData: any) => {
			if (err) {
				return res.sendStatus(401);
			}
			(req as AuthorizedRequest).jwtData = jwtData;
			next();
		},
	);
}

function adminToken(req: AuthorizedRequest, res: Response, next: NextFunction) {
	if (req.jwtData?.role === 10) {
		next();
	} else {
		return res.sendStatus(401);
	}
}

export { authenticateToken, adminToken };
