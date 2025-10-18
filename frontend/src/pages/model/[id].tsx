import { GetServerSideProps } from 'next';
import { useState } from 'react';
import { Button, Card, Form, Input, InputNumber, Switch, Typography, Alert } from 'antd';
import { API_BASE } from '@/lib/api';

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
    <main style={{ padding: 24 }}>
      <Typography.Title level={2} style={{ color: '#fff' }}>{model.title}</Typography.Title>
      <Card style={{ maxWidth: 720 }}>
        <Form layout="vertical" onFinish={onFinish} initialValues={{ duration_seconds: 5, audio: false }}>
          <Form.Item name="prompt" label="Prompt">
            <Input.TextArea rows={4} placeholder="Опишите желаемое видео" />
          </Form.Item>
          <Form.Item name="duration_seconds" label="Длительность, сек">
            <InputNumber min={1} max={60} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="audio" label="Аудио" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>Запустить</Button>
          </Form.Item>
        </Form>
        {error && <Alert type="error" message={error} style={{ marginTop: 16 }} />}
        {resp && (
          <Alert
            type="success"
            message={`Задача поставлена (${resp.job_id}), зарезервировано токенов: ${resp.tokens_reserved}`}
            description={`Оценочная стоимость: ${resp.estimated_rub_cost} ₽`}
            style={{ marginTop: 16 }}
          />
        )}
      </Card>
    </main>
  );
}

