export type IOType = 'image' | 'video' | 'text' | 'audio';

export type IOField = {
  type: IOType;
  name: string; // API ключ/имя параметра
  title: string; // Заголовок поля
  is_required?: boolean | null;
  hint?: string | null;
  description?: string | null;
  // Для text
  content?: string | null;
  // Для media
  url?: string | null;
  meta?: Record<string, any> | null;
};

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
  hint?: string | null;
  max_file_count?: number | null;
  demo_input?: IOField[] | null;
  demo_output?: IOField[] | null;
}


