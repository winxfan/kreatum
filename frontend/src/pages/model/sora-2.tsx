import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { API_BASE } from '@/lib/api';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import CategoryTag from '@/components/CategoryTag';
import InteractiveForm from '@/components/InteractiveForm';
import ModelIntro from '@/components/ModelIntro';

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
      <ModelIntro model={model} />
      <Box id="playground">
        <InteractiveForm model={model} />
      </Box>
    </>
  );
}

