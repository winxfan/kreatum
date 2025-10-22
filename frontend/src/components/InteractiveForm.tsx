import { useMemo, useRef, useState, useEffect } from 'react';
import AudioPlayer from 'react-h5-audio-player';
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
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Slider from '@mui/material/Slider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { API_BASE } from '@/lib/api';
import { useAtom } from 'jotai';
import { userAtom } from '@/state/user';
import type { Model, IOType, IOField } from '@/types/model';

type Props = { model: Model; userId?: string | null };

type PreviewItem = { url: string; type: IOType; name: string; index: number; isDemo?: boolean };

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

export default function InteractiveForm({ model, userId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [snack, setSnack] = useState<string | null>(null);
  const [count, setCount] = useState<number>(1);
  const [authOpen, setAuthOpen] = useState(false);
  const [balanceOpen, setBalanceOpen] = useState(false);
  const [user] = useAtom(userAtom);

  const [files, setFiles] = useState<File[]>([]);

  const maxFileCount = model.max_file_count ?? 1;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const previews: PreviewItem[] = useMemo(() => {
    return files.map((f, idx) => ({ url: URL.createObjectURL(f), type: model.from, name: f.name, index: idx }));
  }, [files, model.from]);

  const [demoMedia, setDemoMedia] = useState<IOField[]>([]);
  useEffect(() => {
    const list = Array.isArray(model.demo_input) ? model.demo_input : [];
    const media = list.filter((f) => (f.type === 'image' || f.type === 'video' || f.type === 'audio') && !!f.url);
    setDemoMedia(media);
  }, [model.demo_input]);

  const fileNameFromUrl = (url: string): string => {
    try {
      const u = new URL(url, 'http://localhost');
      const last = (u.pathname.split('/').pop() || '').split('?')[0];
      return decodeURIComponent(last || url);
    } catch {
      const last = (url.split('/').pop() || '').split('?')[0];
      return decodeURIComponent(last || url);
    }
  };

  const demoPreviews: PreviewItem[] = useMemo(() => {
    return demoMedia.map((f, idx) => ({ url: f.url as string, type: f.type as IOType, name: fileNameFromUrl(f.url as string), index: idx, isDemo: true }));
  }, [demoMedia]);

  const allPreviews: PreviewItem[] = useMemo(() => {
    return [...demoPreviews, ...previews];
  }, [demoPreviews, previews]);

  const demoTextFields: IOField[] = useMemo(() => {
    const list = Array.isArray(model.demo_input) ? model.demo_input : [];
    return list.filter((f) => f.type === 'text');
  }, [model.demo_input]);

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

  const removeDemoAt = (index: number) => {
    setDemoMedia((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Простые проверки статусов
    if (!user) {
      setAuthOpen(true);
      return;
    }
    if ((user.balance_tokens ?? 0) <= 0) {
      setBalanceOpen(true);
      return;
    }
    setLoading(true);
    setError(null);
    setResultUrl(null);
    setProgress(10);
    try {
      // Валидация обязательных текстовых полей из схемы
      const requiredFields = (Array.isArray(model.demo_input) ? model.demo_input : []).filter((f) => f.type === 'text' && f.is_required);
      for (const f of requiredFields) {
        const el = e.currentTarget.elements.namedItem(f.name) as HTMLInputElement | null;
        if (!el || !el.value?.trim()) {
          setLoading(false);
          setError(`Поле "${f.title || f.name}" обязательно для заполнения`);
          return;
        }
      }

      // На данном этапе отправляем JSON-заглушку; позже заменим на multipart с файлами
      const body: Record<string, any> = {
        duration_seconds: Number((e.currentTarget.elements.namedItem('duration_seconds') as HTMLInputElement)?.value || durationOptions[0]),
        audio: (e.currentTarget.elements.namedItem('audio') as HTMLInputElement)?.checked || false,
        input_files_count: files.length,
        count,
      };
      if (demoTextFields.length > 0) {
        for (const field of demoTextFields) {
          const el = e.currentTarget.elements.namedItem(field.name) as HTMLInputElement | null;
          if (el) body[field.name] = el.value;
        }
      } else {
        body.prompt = (e.currentTarget.elements.namedItem('prompt') as HTMLInputElement)?.value;
      }
      if (userId) body.user_id = userId;

      const res = await fetch(`${API_BASE}/api/v1/models/${model.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
      setResultUrl(data.result_url || null);
      setSnack('Демо-запуск выполнен');
      // Имитация прогресса до 100%
      setProgress(70);
      setTimeout(() => setProgress(100), 800);
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
                {model.from === 'image' && 'Кликните или перетащите изображения'}
                {model.from === 'video' && 'Кликните или перетащите видео'}
                {model.from === 'audio' && 'Кликните или перетащите аудио'}
                {model.from === 'text' && 'Кликните чтобы выбрать файл'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Подсказка: перетащите файлы с компьютера, вставьте из буфера обмена (Ctrl/Cmd+V).
              </Typography>
              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                Допустимые типы: {allowedExtText(model.from)}
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
              {allPreviews.map((p) => (
                <Box key={`${p.url}-${p.index}`} sx={{ width: 148, position: 'relative' }}>
                  {p.type === 'image' && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.url} alt={p.name} style={{ width: '100%', borderRadius: 8 }} />
                  )}
                  {p.type === 'video' && (
                    <video src={p.url} style={{ width: '100%', borderRadius: 8 }} controls />
                  )}
                  {p.type === 'audio' && (
                    <AudioPlayer src={p.url} style={{ width: '100%' }} customAdditionalControls={[]} customVolumeControls={[]} layout="horizontal" />
                  )}
                  <IconButton aria-label="Удалить" onClick={() => (p.isDemo ? removeDemoAt(p.index) : removeFileAt(p.index))} size="small" color="error" sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'background.paper', boxShadow: 1 }}>
                    <DeleteForeverRoundedIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" color="text.secondary" title={p.name}>
                    {p.name.length > 18 ? p.name.slice(0, 18) + '…' : p.name}
                  </Typography>
                </Box>
              ))}
            </Box>

            {demoTextFields.length > 0 ? (
              demoTextFields.map((f) => (
                <TextField
                  key={f.name}
                  name={f.name}
                  label={f.title || f.name}
                  required={!!f.is_required}
                  placeholder={f.hint || 'Введите значение'}
                  defaultValue={f.content || ''}
                  multiline rows={4} sx={{ mt: 2 }} fullWidth
                />
              ))
            ) : (
              <TextField
                name="prompt"
                label="Описание (prompt)" required
                placeholder="Опишите желаемый результат"
                defaultValue="Балерина танцует на зелёной траве у циркового шатра"
                multiline rows={4} sx={{ mt: 2 }} fullWidth
              />
            )}

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Количество</Typography>
              <Slider value={count} onChange={(_, v) => setCount(v as number)} min={1} max={10} step={1} valueLabelDisplay="on" />
            </Box>

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
            {(loading || progress > 0) && progress < 100 && (
              <Box sx={{ mb: 2 }}>
                <LinearProgress variant={progress ? 'determinate' : 'indeterminate'} value={progress || undefined} />
              </Box>
            )}
            {model.to === 'image' && resultUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="result" src={resultUrl} style={{ maxWidth: '100%', borderRadius: 8 }} />
            )}
            {model.to === 'video' && resultUrl && (
              <video src={resultUrl} controls style={{ width: '100%', borderRadius: 8, aspectRatio: '16/9' }} />
            )}
            {model.to === 'audio' && resultUrl && (
              <audio src={resultUrl} controls style={{ width: '100%' }} />
            )}
            {!resultUrl && (
              <Box sx={{ p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 2, color: 'text.secondary' }}>
                Результат появится здесь после генерации
              </Box>
            )}

            {/* Демо-выходы из схемы модели */}
            {Array.isArray(model.demo_output) && model.demo_output.length > 0 && (
              <Box sx={{ mt: 2, display: 'grid', gap: 1.5 }}>
                <Typography variant="caption" color="text.secondary">Демо результат</Typography>
                {model.demo_output.map((o) => (
                  <Box key={`${o.name}-${o.type}`}>
                    {o.type === 'image' && o.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={o.title || o.name} src={o.url} style={{ maxWidth: '100%', borderRadius: 8 }} />
                    )}
                    {o.type === 'video' && o.url && (
                      <video src={o.url} controls style={{ width: '100%', borderRadius: 8, aspectRatio: '16/9' }} />
                    )}
                    {o.type === 'audio' && o.url && (
                      <audio src={o.url} controls style={{ width: '100%' }} />
                    )}
                  </Box>
                ))}
              </Box>
            )}

            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
              Стоимость зависит от параметров модели и длительности
            </Typography>
            <Button variant="outlined" sx={{ mt: 2 }} disabled={!resultUrl} fullWidth onClick={() => {
              if (resultUrl) {
                const a = document.createElement('a');
                a.href = resultUrl;
                a.download = 'result';
                a.click();
              }
            }}>
              Скачать
            </Button>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Box>
        </Box>
        <Snackbar open={!!snack} autoHideDuration={2500} message={snack || ''} onClose={() => setSnack(null)} />
        <Dialog open={authOpen} onClose={() => setAuthOpen(false)}>
          <DialogTitle>Требуется авторизация</DialogTitle>
          <DialogContent>
            <Typography>Пожалуйста, войдите, чтобы запустить генерацию.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setAuthOpen(false)}>Закрыть</Button>
            <Button variant="contained" href="/profile">Войти</Button>
          </DialogActions>
        </Dialog>
        <Dialog open={balanceOpen} onClose={() => setBalanceOpen(false)}>
          <DialogTitle>Недостаточно токенов</DialogTitle>
          <DialogContent>
            <Typography>Пополните баланс для продолжения.</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBalanceOpen(false)}>Закрыть</Button>
            <Button variant="contained" href="/balance">Пополнить</Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}


