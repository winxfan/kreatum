import { Typography } from 'antd';

export default function ProfilePage() {
  return (
    <main style={{ padding: 24 }}>
      <Typography.Title level={2} style={{ color: '#fff' }}>Профиль</Typography.Title>
      <Typography.Paragraph style={{ color: '#bbb' }}>
        Баланс: 0 токенов (заглушка)
      </Typography.Paragraph>
    </main>
  );
}

