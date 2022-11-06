import { SimplifiedUser } from "./simplified-user";
import { WafrnMedia } from "./wafrn-media";
import { Tag } from "./tag";
import { WafrnMention } from "./wafrn-mention";

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
    postMentionsUserRelations?: WafrnMention[];
    notes:          number;
}
