import { ProcessedPost } from "./processed-post";
import { SimplifiedUser } from "./simplified-user";

export interface Reblog {
    user: SimplifiedUser,
    content: ProcessedPost,
    id: string,
    createdAt: Date,
    parentId?: string
}
