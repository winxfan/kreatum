import { GetServerSideProps } from 'next';
import Link from 'next/link';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import { API_BASE } from '@/lib/api';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import CategoryTag from '@/components/CategoryTag';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const q = (ctx.query.q as string) || '';
  const category = (ctx.query.category as string) || '';
  try {
    const url = new URL(`${API_BASE}/api/v1/models`);
    if (q) url.searchParams.set('q', q);
    if (category) url.searchParams.set('category', category);
    const res = await fetch(url.toString());
    const data = await res.json();
    return { props: { items: data.items || [], q, category } };
  } catch {
    return { props: { items: [], q, category } };
  }
};

export default function ModelsPage({ items, q, category }: { items: any[]; q: string; category: string }) {
  const router = useRouter();
  const [search, setSearch] = useState(q || '');
  const [tab, setTab] = useState(category || '');

  const applyQuery = (next: { q?: string; category?: string }) => {
    const query = { ...router.query } as any;
    if (next.q !== undefined) query.q = next.q || undefined;
    if (next.category !== undefined) query.category = next.category || undefined;
    router.push({ pathname: router.pathname, query }, undefined, { shallow: false });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>Модели</Typography>
      <Box sx={{ mb: 2, display: 'grid', gap: 1 }}>
        <TextField value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') applyQuery({ q: search }); }} fullWidth placeholder="Поиск моделей" InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
        <Tabs value={tab || 'all'} onChange={(_, v) => { setTab(v); applyQuery({ category: v === 'all' ? '' : v }); }} variant="scrollable" allowScrollButtonsMobile>
          <Tab label="Все" value="all" />
          <Tab label="Фото" value="photo" />
          <Tab label="Видео" value="video" />
          <Tab label="Текст" value="text" />
          <Tab label="Аудио" value="audio" />
        </Tabs>
      </Box>
      {/* Трендовый блок-баннер (заглушка) */}
      <Box sx={{
        mb: 2,
        p: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        background: 'linear-gradient(90deg, rgba(124,77,255,0.1), rgba(0,229,255,0.08))'
      }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>Трендовые модели</Typography>
        <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
          {items.slice(0, 10).map((t) => (
            <Card key={`trend-${t.id || t.title}`} sx={{ minWidth: 220 }}>
              <CardActionArea component={Link as any} href={`/model/${t.id || 'stub'}`}>
                <CardContent>
                  <Typography variant="subtitle2" noWrap>{t.title}</Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {t.description || ''}
                  </Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Box>
      </Box>

      <Box sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
      }}>
        {items.map((item) => (
          <Card key={item.id || item.title}>
            <CardActionArea component={Link as any} href={`/model/${item.id || 'stub'}`}>
              <CardContent>
                <Typography variant="h6">{item.title || 'Veo 3.1'}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {item.description || 'Image → Video'}
                </Typography>
                {item.from && item.to ? (
                  <Box sx={{ mt: 1 }}>
                    <CategoryTag from={item.from} to={item.to} />
                  </Box>
                ) : (
                  item.category && <Chip label={item.category} size="small" sx={{ mt: 1 }} />
                )}
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
}

