import { SimplifiedUser } from "./simplified-user";
import { WafrnMedia } from "./wafrn-media";
import { Tag } from "./tag";

export interface ProcessedPost {

    id:             string;
    NSFW:           boolean;
    content:        string;
    createdAt:      Date;
    updatedAt:      Date;
    userId:         string;
    user:           SimplifiedUser;
    medias?:        WafrnMedia[];
    tags:           Tag[];
}
