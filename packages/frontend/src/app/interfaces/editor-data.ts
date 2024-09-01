import { Ask } from "./ask";
import { ProcessedPost } from "./processed-post";

export interface EditorData {
    scrollDate: Date,
    path: string,
    ask?: Ask,
    post?: ProcessedPost,
    quote?: ProcessedPost,
    edit?: boolean
}
