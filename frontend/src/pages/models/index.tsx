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
    <Box>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>Модели</Typography>
      <Box sx={{ mb: 2 }}>
        <TextField fullWidth placeholder="Поиск моделей" InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }} />
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

