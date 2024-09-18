export interface WafrnMedia {
  id: string;
  NSFW: boolean;
  description: string;
  url: string;
  external: boolean;
  order: number;
  type?: string;
}
