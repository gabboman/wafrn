import { NotificationType } from "../enums/notification-type";

export interface UserNotifications {
  url: string,
  avatar: string,
  userUrl: string,
  date: Date,
  type: NotificationType
}
