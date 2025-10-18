import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { API_BASE } from '@/lib/api';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Alert from '@mui/material/Alert';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { id } = ctx.query as { id: string };
  try {
    const res = await fetch(`${API_BASE}/api/v1/models/${id}`);
    const data = await res.json();
    return { props: { model: data } };
  } catch {
    return { props: { model: { id, title: 'Veo 3.1' } } };
  }
};

export default function ModelPage({ model }: { model: any }) {
  const [resp, setResp] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: any) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/models/${model.id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data === 'string' ? data : JSON.stringify(data));
      setResp(data);
    } catch (e: any) {
      setError(e.message || 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>{model.title}</Typography>
      <Card sx={{ maxWidth: 760 }}>
        <CardContent>
          <Box component="form" onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget as any;
            const values = {
              prompt: form.prompt.value,
              duration_seconds: Number(form.duration_seconds.value || 5),
              audio: form.audio.checked,
            };
            onFinish(values);
          }}>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <Box sx={{ gridColumn: '1 / -1' }}>
              <TextField name="prompt" label="Prompt" placeholder="Опишите желаемое видео" multiline rows={4} fullWidth />
              </Box>
              <Box>
              <TextField name="duration_seconds" label="Длительность, сек" type="number" inputProps={{ min: 1, max: 60 }} fullWidth defaultValue={5} />
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel control={<Switch name="audio" />} label="Аудио" />
              </Box>
              <Box sx={{ gridColumn: '1 / -1' }}>
                <Button type="submit" variant="contained" disabled={loading}>Запустить</Button>
              </Box>
            </Box>
          </Box>
          {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
          {resp && (
            <Alert severity="success" sx={{ mt: 2 }}>
              {`Задача поставлена (${resp.job_id}), зарезервировано токенов: ${resp.tokens_reserved}. Оценочная стоимость: ${resp.estimated_rub_cost} ₽`}
            </Alert>
          )}
        </CardContent>
      </Card>
    </>
  );
}

