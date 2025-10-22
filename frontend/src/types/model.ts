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

export type FieldType =
  | 'text'
  | 'number'
  | 'select'
  | 'multiselect'
  | 'switch'
  | 'checkbox'
  | 'range'
  | 'image'
  | 'video'
  | 'audio'
  | 'file';

export interface OptionField {
  name: string;
  title: string;
  type: FieldType;
  is_required?: boolean | null;
  default_value?: any;
  options?: any[] | null; // for select/multiselect
  min?: number | null; // for number/range
  max?: number | null; // for number/range
  step?: number | null; // for number/range
  hint?: string | null;
  description?: string | null;
  order?: number | null;
  group?: string | null;
  visible_if?: Record<string, any> | null;
}

export interface Model {
  id: string;
  title: string;
  description?: string;
  banner_image_url?: string | null;
  from: IOType;
  to: IOType;
  options?: OptionField[] | null;
  hint?: string | null;
  max_file_count?: number | null;
  demo_input?: IOField[] | null;
  demo_output?: IOField[] | null;
}


