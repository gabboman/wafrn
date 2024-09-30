import type { SignedRequest } from "../interfaces/fediverse/signedRequest.js";
import { getUserOptions } from "./cacheGetters/getUserOptions.js";

async function checkuserAllowsThreads(req: SignedRequest, user: any) {
	if (req.fediData?.fediHost?.includes("threads.net")) {
		const options = await getUserOptions((await user).id);
		const userFederatesWithThreads = options.filter(
			(elem) =>
				elem.optionName === "wafrn.federateWithThreads" &&
				elem.optionValue === "true",
		);
		return userFederatesWithThreads.length > 0;
	}
	return true;
}

export { checkuserAllowsThreads };
