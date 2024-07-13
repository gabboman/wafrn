import { environment } from "../environment";

function isDatabaseMysql(): boolean {
    return environment.databaseConnectionString.toLowerCase().startsWith('m')
}

export {isDatabaseMysql}