import type { Request } from "express";

export default function getStartScrollParam(req: Request) {
	// read the date in ms from the url search params
	const dateMs = Number(req.query.startScroll);
	return new Date(dateMs || Date.now());
}
