import { ProcessedPost } from './processed-post'

export enum Action {
  None,
  New,
  Response,
  Close
}

export interface EditorLauncherData {
  action: Action
  post?: ProcessedPost
}
