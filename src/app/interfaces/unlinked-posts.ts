import { Emoji } from './emoji';
import { SimplifiedUser } from './simplified-user';

export interface unlinkedPosts {
  posts: basicPost[];
  emojiRelations: EmojiRelations;
  mentions: Mention[];
  users: SimplifiedUser[];
  polls: Poll[];
  medias: Media[];
  tags: Tag[];
  likes: Like[];
}

interface basicPost {
  id: string;
  content_warning: string;
  content: string;
  remotePostId?: string;
  privacy: number;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  hierarchyLevel: number;
  parentId?: string;
  ancestors: basicPost[];
  notes?: number;
}

interface EmojiRelations {
  userEmojiRelation: UserEmojiRelation[];
  postEmojiRelation: PostEmojiRelation[];
  emojis: Emoji[];
}

interface PostEmojiRelation {
  emojiId: string;
  postId: string;
}

interface UserEmojiRelation {
  userId: string;
  emojiId: string;
}

interface Mention {
  userMentioned: string;
  post: string;
}

interface Media {
  id: string;
  NSFW: boolean;
  description: string;
  url: string;
  adultContent: boolean;
  external: boolean;
  posts: Array<{
    postMediaRelations: postMediaRelations;
  }>;
}

interface postMediaRelations {
  mediaId: string;
  postId: string;
}

interface Tag {
  postId: string;
  tagName: string;
}

interface Like {
  userId: string;
  postId: string;
}

interface Poll {
  id: number;

  endDate: string;

  multiChoice: boolean;

  createdAt: string;

  updatedAt: string;

  postId: string;

  questionPollQuestions: QuestionPollQuestion[];
}

interface QuestionPollQuestion {
  id: number;

  questionText: string;

  index: number;

  remoteReplies: number;

  createdAt: string;

  updatedAt: string;

  questionPollId: number;

  questionPollAnswers: any[];
}
