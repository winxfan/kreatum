import Link from 'next/link';
import { Button, Typography } from 'antd';

export default function Home() {
  return (
    <main style={{ padding: 24 }}>
      <Typography.Title style={{ color: '#fff' }}>Neurolibrary</Typography.Title>
      <Typography.Paragraph style={{ color: '#bbb' }}>
        Агрегатор нейромоделей. Начните с Veo 3.1 (image → video).
      </Typography.Paragraph>
      <Link href="/models"><Button type="primary">Перейти к моделям</Button></Link>
    </main>
  );
}

