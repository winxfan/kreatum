import { useState } from 'react';
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
import { API_BASE } from '@/lib/api';
import type { Model, IOType } from '@/types/model';

type Props = { model: Model; userId?: string | null };

function FileOrUrlInput({ accept, name, label }: { accept: string; name: string; label: string }) {
  const [url, setUrl] = useState('');
  return (
    <Box sx={{ display: 'grid', gap: 1 }}>
      <TextField type="file" inputProps={{ accept }} name={`${name}_file`} />
      <TextField label={`${label} URL`} placeholder="https://..." value={url} onChange={(e) => setUrl(e.target.value)} name={`${name}_url`} />
    </Box>
  );
}

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

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResultUrl(null);
    try {
      const formData = new FormData(e.currentTarget);
      formData.append('model_id', model.id);
      if (userId) formData.append('user_id', userId);
      // For demo: send as JSON to existing POST endpoint; adapt later to real upload
      const body: Record<string, any> = Object.fromEntries(formData.entries());
      const res = await fetch(`${API_BASE}/api/v1/models/${model.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
      // In real impl you'll poll job result; here show stub
      setResultUrl(data.result_url || null);
    } catch (e: any) {
      setError(e.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  const opt = model.options || {};
  const has = (v: any) => v !== undefined && v !== null;

  return (
    <Card>
      <CardContent>
        <Box component="form" onSubmit={onSubmit} sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
          <Box>
            {['image','video','audio'].includes(model.from) && (
              <FileOrUrlInput accept={acceptByFrom(model.from)} label={model.from.toUpperCase()} name="input" />
            )}
            <TextField name="prompt" label="Prompt" placeholder="Опишите желаемый результат" multiline rows={4} sx={{ mt: 2 }} />

            {has(opt.durationOptions) && Array.isArray(opt.durationOptions) && opt.durationOptions!.length > 0 && (
              <TextField select fullWidth label="Duration" name="duration" sx={{ mt: 2 }} defaultValue={opt.durationOptions![0]}> 
                {opt.durationOptions!.map((n) => (
                  <MenuItem key={String(n)} value={n}>{n}s</MenuItem>
                ))}
              </TextField>
            )}

            {has(opt.resolutionOptions) && Array.isArray(opt.resolutionOptions) && opt.resolutionOptions!.length > 0 && (
              <TextField select fullWidth label="Resolution" name="resolution" sx={{ mt: 2 }} defaultValue={opt.resolutionOptions![0]}> 
                {opt.resolutionOptions!.map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </TextField>
            )}

            {has(opt.aspectRatioOptions) && Array.isArray(opt.aspectRatioOptions) && opt.aspectRatioOptions!.length > 0 && (
              <TextField select fullWidth label="Aspect Ratio" name="aspect_ratio" sx={{ mt: 2 }} defaultValue={opt.aspectRatioOptions![0]}> 
                {opt.aspectRatioOptions!.map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </TextField>
            )}

            {has(opt.negativePrompt) && (
              <TextField name="negative_prompt" label="Negative Prompt" multiline rows={2} sx={{ mt: 2 }} />
            )}

            {has(opt.generateAudio) && (
              <FormControlLabel control={<Switch name="generate_audio" defaultChecked={!!opt.generateAudio} />} label="Generate Audio" sx={{ mt: 1 }} />
            )}
            {has(opt.removeBackground) && (
              <FormControlLabel control={<Switch name="remove_background" defaultChecked={!!opt.removeBackground} />} label="Remove Background" />
            )}
            {has(opt.enhancePrompt) && (
              <FormControlLabel control={<Switch name="enhance_prompt" defaultChecked={!!opt.enhancePrompt} />} label="Enhance Prompt" />
            )}

            <Button type="submit" variant="contained" disabled={loading} sx={{ mt: 1 }}>Запустить</Button>
          </Box>

          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Output</Typography>
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
            <Button variant="outlined" sx={{ mt: 2 }} disabled={!resultUrl}>Скачать</Button>
            <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
              Стоимость зависит от параметров модели и длительности
            </Typography>
            {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}


