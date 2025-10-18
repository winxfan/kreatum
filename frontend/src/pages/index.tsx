import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PublicIcon from '@mui/icons-material/Public';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';

const demoPrompts: Record<string, string> = {
  'image-to-video': 'A graceful ballerina dancing outside a circus tent',
  'text-to-image': 'A cinematic macro photo of a dewdrop on a leaf',
  'image-to-image': 'Remix this portrait into cyberpunk neon style',
};

export default function Home() {
  return (
    <Box sx={{ py: 6 }}>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, alignItems: 'center', mb: 6 }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>Neurolibrary</Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Агрегатор нейромоделей: фото, видео и текст в одной платформе.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button variant="contained" component={Link as any} href="/models">Зарегистрироваться и попробовать</Button>
            <Button variant="outlined" component={Link as any} href="/models">Посмотреть модели</Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, color: 'text.secondary' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CreditCardIcon fontSize="small" /> Оплата российскими картами</Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PublicIcon fontSize="small" /> Работает без VPN</Box>
          </Box>
        </Box>
        <Box>
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>Быстрый playground</Typography>
              <TextField select label="Режим" fullWidth defaultValue="image-to-video" sx={{ mb: 2 }}>
                <MenuItem value="image-to-video">image-to-video</MenuItem>
                <MenuItem value="text-to-image">text-to-image</MenuItem>
                <MenuItem value="image-to-image">image-to-image</MenuItem>
              </TextField>
              <TextField multiline rows={3} label="Prompt" fullWidth defaultValue={demoPrompts['image-to-video']} sx={{ mb: 2 }} />
              <Button variant="contained">Запустить демо</Button>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
}

