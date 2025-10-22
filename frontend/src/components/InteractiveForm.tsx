import { useMemo, useRef, useState, useEffect } from 'react';
import AudioPlayer from 'react-h5-audio-player';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import Checkbox from '@mui/material/Checkbox';
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
import type { Model, IOType, OptionField } from '@/types/model';

type Props = { model: Model; userId?: string | null };

type PreviewItem = { url: string; type: IOType; name: string; index: number };

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

  // demo_input больше не используется — превью только из выбранных пользователем файлов

  const optionFields: OptionField[] = useMemo(() => Array.isArray(model.options) ? model.options : [], [model.options]);
  const baseFields = useMemo(() => optionFields.filter((f) => f.group !== 'advanced'), [optionFields]);
  const advancedFields = useMemo(() => optionFields.filter((f) => f.group === 'advanced'), [optionFields]);
  const hasAdvanced = advancedFields.length > 0;
  const [rangeValues, setRangeValues] = useState<Record<string, number>>({});
  useEffect(() => {
    const initial: Record<string, number> = {};
    optionFields.forEach((f) => {
      if (f.type === 'range') {
        const dv = typeof f.default_value === 'number' ? f.default_value : (typeof f.min === 'number' ? f.min : 0);
        initial[f.name] = dv as number;
      }
    });
    setRangeValues(initial);
  }, [optionFields]);

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
      // Валидация обязательных полей из options (кроме boolean)
      for (const f of optionFields) {
        if (!f.is_required) continue;
        if (f.type === 'switch' || f.type === 'checkbox') continue;
        if (f.type === 'range') {
          const val = rangeValues[f.name];
          if (val === undefined || val === null) {
            setLoading(false);
            setError(`Поле "${f.title || f.name}" обязательно для заполнения`);
            return;
          }
          continue;
        }
        const el = e.currentTarget.elements.namedItem(f.name) as HTMLInputElement | HTMLSelectElement | null;
        if (!el) {
          setLoading(false);
          setError(`Поле "${f.title || f.name}" обязательно для заполнения`);
          return;
        }
        if ((el as HTMLInputElement).value !== undefined) {
          const v = (el as HTMLInputElement).value;
          if (v == null || String(v).trim() === '') {
            setLoading(false);
            setError(`Поле "${f.title || f.name}" обязательно для заполнения`);
            return;
          }
        }
      }

      // На данном этапе отправляем JSON-заглушку; позже заменим на multipart с файлами
      const body: Record<string, any> = { input_files_count: files.length, count };
      for (const f of optionFields) {
        if (f.type === 'switch' || f.type === 'checkbox') {
          const el = e.currentTarget.elements.namedItem(f.name) as HTMLInputElement | null;
          body[f.name] = !!el?.checked;
        } else if (f.type === 'multiselect') {
          const el = e.currentTarget.elements.namedItem(f.name) as HTMLSelectElement | null;
          const vals = el ? Array.from(el.selectedOptions).map((o) => o.value) : [];
          body[f.name] = vals;
        } else if (f.type === 'range') {
          body[f.name] = rangeValues[f.name];
        } else {
          const el = e.currentTarget.elements.namedItem(f.name) as HTMLInputElement | HTMLSelectElement | null;
          if (el) body[f.name] = (el as HTMLInputElement).value;
        }
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

  // unified options are rendered above via optionFields

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
              {previews.map((p) => (
                <Box key={`${p.url}-${p.index}`} sx={{ width: p.type === 'audio' ? '100%' : 148, position: 'relative' }}>
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
                  <IconButton aria-label="Удалить" onClick={() => removeFileAt(p.index)} size="small" color="error" sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'background.paper', boxShadow: 1 }}>
                    <DeleteForeverRoundedIcon fontSize="small" />
                  </IconButton>
                  <Typography variant="caption" color="text.secondary" title={p.name}>
                    {p.name.length > 18 ? p.name.slice(0, 18) + '…' : p.name}
                  </Typography>
                </Box>
              ))}
            </Box>

            {baseFields.map((f) => {
              if (f.type === 'text') {
                return (
                  <TextField key={f.name} name={f.name} label={f.title || f.name} required={!!f.is_required} placeholder={f.hint || ''} defaultValue={f.default_value ?? ''} multiline rows={f.name === 'prompt' ? 4 : 2} sx={{ mt: 2 }} fullWidth />
                );
              }
              if (f.type === 'number') {
                return (
                  <TextField key={f.name} name={f.name} type="number" label={f.title || f.name} required={!!f.is_required} inputProps={{ min: f.min ?? undefined, max: f.max ?? undefined, step: f.step ?? 1 }} defaultValue={f.default_value ?? ''} sx={{ mt: 2 }} fullWidth />
                );
              }
              if (f.type === 'select') {
                return (
                  <TextField key={f.name} select name={f.name} label={f.title || f.name} required={!!f.is_required} defaultValue={f.default_value ?? (Array.isArray(f.options) ? f.options[0] : '')} sx={{ mt: 2 }} fullWidth>
                    {(f.options || []).map((o) => (
                      <MenuItem key={String(o)} value={o as any}>{String(o)}</MenuItem>
                    ))}
                  </TextField>
                );
              }
              if (f.type === 'multiselect') {
                return (
                  <TextField key={f.name} select SelectProps={{ multiple: true }} name={f.name} label={f.title || f.name} defaultValue={f.default_value ?? []} sx={{ mt: 2 }} fullWidth>
                    {(f.options || []).map((o) => (
                      <MenuItem key={String(o)} value={o as any}>{String(o)}</MenuItem>
                    ))}
                  </TextField>
                );
              }
              if (f.type === 'switch') {
                return (
                  <FormControlLabel key={f.name} control={<Switch name={f.name} defaultChecked={!!f.default_value} />} label={f.title || f.name} sx={{ mt: 1 }} />
                );
              }
              if (f.type === 'checkbox') {
                return (
                  <FormControlLabel key={f.name} control={<Checkbox name={f.name} defaultChecked={!!f.default_value} />} label={f.title || f.name} sx={{ mt: 1 }} />
                );
              }
              if (f.type === 'range') {
                const min = f.min ?? 0;
                const max = f.max ?? 100;
                const step = f.step ?? 1;
                const val = rangeValues[f.name] ?? min;
                return (
                  <Box key={f.name} sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>{f.title || f.name}</Typography>
                    <Slider value={val} onChange={(_, v) => setRangeValues((s) => ({ ...s, [f.name]: v as number }))} min={min} max={max} step={step} valueLabelDisplay="on" />
                    <input type="hidden" name={f.name} value={val} />
                  </Box>
                );
              }
              return null;
            })}

            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>Количество</Typography>
              <Slider value={count} onChange={(_, v) => setCount(v as number)} min={1} max={10} step={1} valueLabelDisplay="on" />
            </Box>

            {hasAdvanced && (
            <>
            <Divider sx={{ my: 2 }} />
            <Button size="small" onClick={() => setAdvancedOpen((v) => !v)}>
              {advancedOpen ? 'Скрыть дополнительные настройки' : 'Показать дополнительные настройки'}
            </Button>
            <Collapse in={advancedOpen} timeout="auto" unmountOnExit>
              <Box sx={{ mt: 2 }}>
                {advancedFields.map((f) => {
                  if (f.type === 'text') {
                    return (
                      <TextField key={f.name} name={f.name} label={f.title || f.name} required={!!f.is_required} placeholder={f.hint || ''} defaultValue={f.default_value ?? ''} multiline rows={2} sx={{ mt: 2 }} fullWidth />
                    );
                  }
                  if (f.type === 'number') {
                    return (
                      <TextField key={f.name} name={f.name} type="number" label={f.title || f.name} required={!!f.is_required} inputProps={{ min: f.min ?? undefined, max: f.max ?? undefined, step: f.step ?? 1 }} defaultValue={f.default_value ?? ''} sx={{ mt: 2 }} fullWidth />
                    );
                  }
                  if (f.type === 'select') {
                    return (
                      <TextField key={f.name} select name={f.name} label={f.title || f.name} required={!!f.is_required} defaultValue={f.default_value ?? (Array.isArray(f.options) ? f.options[0] : '')} sx={{ mt: 2 }} fullWidth>
                        {(f.options || []).map((o) => (
                          <MenuItem key={String(o)} value={o as any}>{String(o)}</MenuItem>
                        ))}
                      </TextField>
                    );
                  }
                  if (f.type === 'multiselect') {
                    return (
                      <TextField key={f.name} select SelectProps={{ multiple: true }} name={f.name} label={f.title || f.name} defaultValue={f.default_value ?? []} sx={{ mt: 2 }} fullWidth>
                        {(f.options || []).map((o) => (
                          <MenuItem key={String(o)} value={o as any}>{String(o)}</MenuItem>
                        ))}
                      </TextField>
                    );
                  }
                  if (f.type === 'switch') {
                    return (
                      <FormControlLabel key={f.name} control={<Switch name={f.name} defaultChecked={!!f.default_value} />} label={f.title || f.name} sx={{ mt: 1 }} />
                    );
                  }
                  if (f.type === 'checkbox') {
                    return (
                      <FormControlLabel key={f.name} control={<Checkbox name={f.name} defaultChecked={!!f.default_value} />} label={f.title || f.name} sx={{ mt: 1 }} />
                    );
                  }
                  if (f.type === 'range') {
                    const min = f.min ?? 0;
                    const max = f.max ?? 100;
                    const step = f.step ?? 1;
                    const val = rangeValues[f.name] ?? min;
                    return (
                      <Box key={f.name} sx={{ mt: 2 }}>
                        <Typography variant="caption" sx={{ mb: 1, display: 'block' }}>{f.title || f.name}</Typography>
                        <Slider value={val} onChange={(_, v) => setRangeValues((s) => ({ ...s, [f.name]: v as number }))} min={min} max={max} step={step} valueLabelDisplay="on" />
                        <input type="hidden" name={f.name} value={val} />
                      </Box>
                    );
                  }
                  return null;
                })}
              </Box>
            </Collapse>
            </>
            )}

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
              <AudioPlayer src={resultUrl} style={{ width: '100%' }} customAdditionalControls={[]} customVolumeControls={[]} layout="horizontal" />
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
                      <AudioPlayer src={o.url} style={{ width: '100%' }} customAdditionalControls={[]} customVolumeControls={[]} layout="horizontal" />
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


