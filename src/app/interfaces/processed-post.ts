import { SimplifiedUser } from "./simplified-user";
import { WafrnMedia } from "./wafrn-media";

export interface ProcessedPost {

    id:             string;
    NSFW:           boolean;
    content:        string;
    createdAt:      Date;
    updatedAt:      Date;
    userId:         string;
    user:           SimplifiedUser;
    medias?:        WafrnMedia[];
}
