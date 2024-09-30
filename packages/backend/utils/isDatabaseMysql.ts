import { environment } from "../environment.js";

function isDatabaseMysql(): boolean {
	return environment.databaseConnectionString.toLowerCase().startsWith("m");
}

export { isDatabaseMysql };
