import { SimplifiedUser } from "./simplified-user";
import { WafrnMedia } from "./wafrn-media";
import { Tag } from "./tag";

export interface RawPost {
    id:             string;
    NSFW:           boolean;
    content:        string;
    createdAt:      Date;
    updatedAt:      Date;
    userId:         string;
    hierarchyLevel: number;
    ancestors?:     RawPost[];
    user:           SimplifiedUser;
    medias?:        WafrnMedia[];
    tags:           Tag[]

}
