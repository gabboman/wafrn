import { NotificationType } from '../enums/notification-type';
import { Emoji } from './emoji';

export interface UserNotifications {
  url: string;
  avatar: string;
  userUrl: string;
  date: Date;
  type: NotificationType;
  emojiReact?: Emoji;
  emojiName?: string;
}
