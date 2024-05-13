import { SimplifiedUser } from './simplified-user';
import { WafrnMedia } from './wafrn-media';
import { Tag } from './tag';
import { WafrnMention } from './wafrn-mention';
import { Emoji } from './emoji';
import { RawPost } from './raw-post';
import { QuestionPoll } from './questionPoll';
import { PostEmojiReaction } from './unlinked-posts';

export interface ProcessedPost {
  id: string;
  content_warning: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  user: SimplifiedUser;
  medias?: WafrnMedia[];
  tags: Tag[];
  mentionPost?: SimplifiedUser[];
  notes: number;
  privacy: number;
  remotePostId: string;
  userLikesPostRelations: string[];
  emojis: Emoji[];
  descendents: RawPost[];
  questionPoll?: QuestionPoll;
  emojiReactions: PostEmojiReaction[];
  quotes: ProcessedPost[];
  parentId?: string
}
