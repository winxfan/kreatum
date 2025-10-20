import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';

export default function BlogIndex() {
  const posts: Array<{ id: string; title: string; likes: number; views: number }>= [];
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Блог</Typography>
        <Button variant="contained" component={Link as any} href="/blog/new">Написать статью</Button>
      </Box>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' } }}>
        {posts.length === 0 && <Typography color="text.secondary">Пока нет статей</Typography>}
        {posts.map((p) => (
          <Card key={p.id}>
            <CardContent>
              <Typography variant="h6">{p.title}</Typography>
              <Typography variant="caption" color="text.secondary">❤ {p.likes} · 👁 {p.views}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}


