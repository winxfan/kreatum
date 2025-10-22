import { useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import type { IOType } from '@/types/model';

function acceptByFrom(from: IOType) {
  if (from === 'image') return 'image/*';
  if (from === 'video') return 'video/*';
  if (from === 'audio') return 'audio/*';
  return '*/*';
}

function allowedExtText(from: IOType) {
  if (from === 'image') return 'jpg, jpeg, png, webp, gif, avif';
  if (from === 'video') return 'mp4, webm, ogg';
  if (from === 'audio') return 'mp3, wav, ogg, m4a';
  return '';
}

type Props = {
  type: IOType;
  hint?: string | null;
  multiple?: boolean;
  maxFileCount?: number;
  onFiles: (files: File[]) => void;
};

export default function UploadZone({ type, hint, multiple, maxFileCount = 1, onFiles }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleDrop = (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    const dropped = Array.from(ev.dataTransfer.files || []);
    if (!dropped.length) return;
    const accepted = acceptByFrom(type);
    const filtered = dropped.filter((f) => accepted === '*/*' || f.type.startsWith(accepted.split('/')[0] + '/'));
    onFiles(filtered.slice(0, maxFileCount));
  };

  const handleSelect = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(ev.target.files || []);
    if (!picked.length) return;
    const accepted = acceptByFrom(type);
    const filtered = picked.filter((f) => accepted === '*/*' || f.type.startsWith(accepted.split('/')[0] + '/'));
    onFiles(filtered.slice(0, maxFileCount));
  };

  return (
    <Box
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      sx={{
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        p: 3,
        textAlign: 'center',
        cursor: 'pointer',
        bgcolor: 'background.default',
      }}
    >
      <InsertDriveFileRoundedIcon color="action" sx={{ fontSize: 40, mb: 1 }} />
      <Typography variant="body1" sx={{ mb: 1 }}>
        {type === 'image' && 'Кликните или перетащите изображения'}
        {type === 'video' && 'Кликните или перетащите видео'}
        {type === 'audio' && 'Кликните или перетащите аудио'}
        {type === 'text' && 'Кликните чтобы выбрать файл'}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {hint || 'Подсказка: перетащите файлы с компьютера или вставьте из буфера'}
      </Typography>
      <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
        Допустимые типы: {allowedExtText(type)}
      </Typography>
      <input
        ref={inputRef}
        type="file"
        multiple={!!multiple}
        accept={acceptByFrom(type)}
        onChange={handleSelect}
        style={{ display: 'none' }}
      />
    </Box>
  );
}


