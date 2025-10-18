import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PublicIcon from '@mui/icons-material/Public';
import InteractiveForm from '@/components/InteractiveForm';
import type { Model } from '@/types/model';
import banner from '@/assets/banner.jpg';

const demoModel: Model = {
  id: 'demo-veo', 
  banner_image_url: banner.src,
  title: 'Veo 3.1',
  description: 'Image to Video demo',
  from: 'image',
  to: 'video',
  options: {
    durationOptions: [3,5,10],
    resolutionOptions: ['720p','1080p'],
    generateAudio: false,
    aspectRatioOptions: ['16:9','9:16','1:1'],
    negativePrompt: '',
  }
};

export default function Home() {
  return (
    <div>
      <Box
        style={{
          backgroundImage: `url(${demoModel.banner_image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderRadius: 25,
        }}
      >
        <Box 
          sx={{
            display: 'grid', 
            gap: 2, 
            alignItems: 'center', 
            p: 6,
            mb: 6,
            height: '600px',
          }}
          style={{
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.25) 40%, rgba(0, 0, 0, 0.9) 100%)'
          }}
      >
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
      </Box>
      
      </Box>
      
    </Box>

      <Box>
        <InteractiveForm model={demoModel} />
      </Box>
    </div>
  );
}

