export type IOType = 'image' | 'video' | 'text' | 'audio';

export type ModelOptions = {
  durationOptions?: number[] | null;
  resolutionOptions?: string[] | null; // e.g. ['720p','1080p']
  generateAudio?: boolean | null;
  removeBackground?: boolean | null;
  aspectRatioOptions?: string[] | null; // e.g. ['1:1','16:9']
  negativePrompt?: string | null; // presence means show field
  enhancePrompt?: boolean | null;
};

export interface Model {
  id: string;
  title: string;
  description?: string;
  banner_image_url?: string | null;
  from: IOType;
  to: IOType;
  options?: ModelOptions;
}


