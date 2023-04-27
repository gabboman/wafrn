import { SimplifiedUser } from "./simplified-user";

export interface Reblog {
    user: SimplifiedUser,
    content: string,
    id: string,
    createdAt: Date,
    parentId?: string
}
