export interface WafrnMedia {
  id: string;
  NSFW: boolean;
  description: string;
  url: string;
  external: boolean;
  mediaOrder: number;
  mediaType?: string;
  height?: number;
  width?: number;
  blurhash?: string;
}
