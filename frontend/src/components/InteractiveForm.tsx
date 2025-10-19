import { useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import DeleteForeverRoundedIcon from '@mui/icons-material/DeleteForeverRounded';
import InsertDriveFileRoundedIcon from '@mui/icons-material/InsertDriveFileRounded';
import { API_BASE } from '@/lib/api';
import type { Model, IOType } from '@/types/model';

type Props = { model: Model; userId?: string | null };

type PreviewItem = { url: string; type: IOType; name: string; index: number };

function acceptByFrom(from: IOType) {
  if (from === 'image') return 'image/*';
  if (from === 'video') return 'video/*';
  if (from === 'audio') return 'audio/*';
  return '*/*';
}

export default function InteractiveForm({ model, userId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [files, setFiles] = useState<File[]>([]);

  const maxFileCount = model.max_file_count ?? 1;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const previews: PreviewItem[] = useMemo(() => {
    return files.map((f, idx) => ({ url: URL.createObjectURL(f), type: model.from, name: f.name, index: idx }));
  }, [files, model.from]);

  const durationOptions = useMemo(() => {
    const opt = model.options?.durationOptions;
    return Array.isArray(opt) && opt.length > 0 ? opt : [5, 10, 15];
  }, [model.options?.durationOptions]);

  const onDrop = (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    const dropped = Array.from(ev.dataTransfer.files || []);
    if (!dropped.length) return;
    const accepted = acceptByFrom(model.from);
    const filtered = dropped.filter((f) => accepted === '*/*' || f.type.startsWith(accepted.split('/')[0] + '/'));
    setFiles((prev) => {
      const next = [...prev, ...filtered].slice(0, maxFileCount);
      return next;
    });
  };

  const onSelectFiles = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(ev.target.files || []);
    if (!picked.length) return;
    const accepted = acceptByFrom(model.from);
    const filtered = picked.filter((f) => accepted === '*/*' || f.type.startsWith(accepted.split('/')[0] + '/'));
    setFiles((prev) => [...prev, ...filtered].slice(0, maxFileCount));
  };

  const removeFileAt = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResultUrl(null);
    try {
      // На данном этапе отправляем JSON-заглушку; позже заменим на multipart с файлами
      const body: Record<string, any> = {
        prompt: (e.currentTarget.elements.namedItem('prompt') as HTMLInputElement)?.value,
        duration_seconds: Number((e.currentTarget.elements.namedItem('duration_seconds') as HTMLInputElement)?.value || durationOptions[0]),
        audio: (e.currentTarget.elements.namedItem('audio') as HTMLInputElement)?.checked || false,
        input_files_count: files.length,
      };
      if (userId) body.user_id = userId;

      const res = await fetch(`${API_BASE}/api/v1/models/${model.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
      setResultUrl(data.result_url || null);
    } catch (e: any) {
      setError(e.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const opt = model.options || {};

  return (
    <Card>
      <CardContent>
        <Box component="form" onSubmit={onSubmit} sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Вход</Typography>

            <Box
              onDragOver={(e) => e.preventDefault()}
              onDrop={onDrop}
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
                Для добавления файла кликните по области или перетащите сюда
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Подсказка: перетащите файлы с компьютера, изображения со страниц,
                вставьте из буфера обмена (Ctrl/Cmd+V).
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                Допустимые типы: jpg, jpeg, png, webp, gif, avif
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary">
                Максимум файлов: {maxFileCount}
              </Typography>
              <input
                ref={inputRef}
                type="file"
                name="input_files"
                multiple={maxFileCount > 1}
                accept={acceptByFrom(model.from)}
                onChange={onSelectFiles}
                style={{ display: 'none' }}
              />
            </Box>

            <Box sx={{ mt: 2, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {previews.map((p) => (
                <Box key={`${p.url}-${p.index}`} sx={{ width: 148, position: 'relative' }}>
                  {p.type === 'image' && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.url} alt={p.name} style={{ width: '100%', borderRadius: 8 }} />
                  )}
                  {p.type === 'video' && (
                    <video src={p.url} style={{ width: '100%', borderRadius: 8 }} controls />
                  )}
                  {p.type === 'audio' && (
                    <audio src={p.url} style={{ width: '100%' }} controls />
                  )}
                  <IconButton aria-label="Удалить" onClick={() => removeFileAt(p.index)} size="small" color="error" sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'background.paper', boxShadow: 1 }}>
                    <DeleteForeverRoundedIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" color="text.secondary" title={p.name}>
                    {p.name.length > 18 ? p.name.slice(0, 18) + '…' : p.name}
                  </Typography>
                </Box>
              ))}
            </Box>

            <TextField
              name="prompt"
              label="Описание (prompt)" required
              placeholder="Опишите желаемый результат"
              defaultValue="Балерина танцует на зелёной траве у циркового шатра"
              multiline rows={4} sx={{ mt: 2 }} fullWidth
            />

            <TextField
              select
              name="duration_seconds"
              label="Длительность, сек" required
              defaultValue={durationOptions[0]}
              sx={{ mt: 2 }} fullWidth
            >
              {durationOptions.map((n) => (
                <MenuItem key={String(n)} value={n}>{n}s</MenuItem>
              ))}
            </TextField>

            <FormControlLabel control={<Switch name="audio" />} label="Сгенерировать аудио" sx={{ mt: 1 }} />

            <Divider sx={{ my: 2 }} />
            <Button size="small" onClick={() => setAdvancedOpen((v) => !v)}>
              {advancedOpen ? 'Скрыть дополнительные настройки' : 'Показать дополнительные настройки'}
            </Button>
            <Collapse in={advancedOpen} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 2 }}>
                {/* Дополнительные настройки (скрыты по умолчанию) */}
                {Array.isArray(opt.durationOptions) && opt.durationOptions.length > 0 && (
                  <TextField select fullWidth label="Длительность (предустановки)" name="duration" sx={{ mt: 2 }} defaultValue={opt.durationOptions[0]}>
                    {opt.durationOptions.map((n) => (
                      <MenuItem key={String(n)} value={n}>{n}s</MenuItem>
                    ))}
                  </TextField>
                )}
                {Array.isArray(opt.resolutionOptions) && opt.resolutionOptions.length > 0 && (
                  <TextField select fullWidth label="Разрешение" name="resolution" sx={{ mt: 2 }} defaultValue={opt.resolutionOptions[0]}>
                    {opt.resolutionOptions.map((r) => (
                      <MenuItem key={r} value={r}>{r}</MenuItem>
                    ))}
                  </TextField>
                )}
                {Array.isArray(opt.aspectRatioOptions) && opt.aspectRatioOptions.length > 0 && (
                  <TextField select fullWidth label="Соотношение сторон" name="aspect_ratio" sx={{ mt: 2 }} defaultValue={opt.aspectRatioOptions[0]}>
                    {opt.aspectRatioOptions.map((r) => (
                      <MenuItem key={r} value={r}>{r}</MenuItem>
                    ))}
                  </TextField>
                )}
                {opt.negativePrompt && (
                  <TextField name="negative_prompt" label="Негативный prompt" multiline rows={2} sx={{ mt: 2 }} fullWidth />
                )}
                {opt.generateAudio && (
                  <FormControlLabel control={<Switch name="generate_audio" defaultChecked={!!opt.generateAudio} />} label="Сгенерировать аудио" sx={{ mt: 1 }} />
                )}
                {opt.removeBackground && (
                  <FormControlLabel control={<Switch name="remove_background" defaultChecked={!!opt.removeBackground} />} label="Удалить фон" />
                )}
                {opt.enhancePrompt && (
                  <FormControlLabel control={<Switch name="enhance_prompt" defaultChecked={!!opt.enhancePrompt} />} label="Улучшить prompt" />
                )}
                {model.hint && (
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
                    Подсказка модели: {model.hint}
                  </Typography>
                )}
              </Box>
            </Collapse>

            <Button type="submit" variant="contained" disabled={loading} sx={{ mt: 2 }} fullWidth>
              Запустить
            </Button>
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>Выход</Typography>
            {model.to === 'image' && resultUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="result" src={resultUrl} style={{ maxWidth: '100%', borderRadius: 8 }} />
            )}
            {model.to === 'video' && resultUrl && (
              <video src={resultUrl} controls style={{ width: '100%', borderRadius: 8 }} />
            )}
            {model.to === 'audio' && resultUrl && (
              <audio src={resultUrl} controls style={{ width: '100%' }} />
            )}
            {!resultUrl && (
              <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2, color: 'text.secondary' }}>
                Результат появится здесь после генерации
              </Box>
            )}

            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
              Стоимость зависит от параметров модели и длительности
            </Typography>
            <Button variant="outlined" sx={{ mt: 2 }} disabled={!resultUrl} fullWidth>
              Скачать
            </Button>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}


