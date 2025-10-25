import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CategoryTag from '@/components/CategoryTag';
import banner from '@/assets/banner.jpg';

export default function ModelIntro({ model, title, description }: { model: any, title: string, description: string }) {
  return (
    <Box sx={{
      mb: 3,
      borderRadius: 0,
      position: 'relative',
      overflow: 'visible',
      height: '600px',
    }}>
      <Box component="img" alt="" src={model.banner_image_url || banner.src} sx={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        width: '100vw',
        height: '100%',
        objectFit: 'cover',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      <Box sx={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: '50%',
        right: '50%',
        marginLeft: '-50vw',
        marginRight: '-50vw',
        width: '100vw',
        background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.25) 40%, rgba(0, 0, 0, 0.9) 100%)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />
      <Box sx={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start', p: 6 }}>
        <CategoryTag from={model.from || 'image'} to={model.to || 'video'} />
        <Typography variant="h3" sx={{ fontWeight: 800, mt: 1 }}>{title}</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 720 }}>
          {model.description || description}
        </Typography>
        <Button variant="contained" sx={{ mt: 2 }} href="#playground">Попробовать сейчас</Button>
      </Box>
    </Box>
  );
}


