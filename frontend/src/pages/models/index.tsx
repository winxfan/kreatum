import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { Card, List, Typography } from 'antd';
import { getModels, API_BASE } from '@/lib/api';

export const getServerSideProps: GetServerSideProps = async () => {
  try {
    const res = await fetch(`${API_BASE}/api/v1/models`);
    const data = await res.json();
    return { props: { items: data.items || [] } };
  } catch {
    return { props: { items: [] } };
  }
};

export default function ModelsPage({ items }: { items: any[] }) {
  return (
    <main style={{ padding: 24 }}>
      <Typography.Title level={2} style={{ color: '#fff' }}>Модели</Typography.Title>
      <List
        grid={{ gutter: 16, column: 3 }}
        dataSource={items}
        renderItem={(item) => (
          <List.Item>
            <Link href={`/model/${item.id || 'stub'}`}>
              <Card title={item.title || 'Veo 3.1'}>
                {item.description || 'Image → Video'}
              </Card>
            </Link>
          </List.Item>
        )}
      />
    </main>
  );
}

