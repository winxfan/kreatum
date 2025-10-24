import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

type Props = {
  title: string;
  buttonText?: string;
  background?: string | null; // video url
  href?: string;
};

export default function CTA({ title, buttonText = 'Начать генерацию', background = null, href = '#playground' }: Props) {
  return (
    <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', py: { xs: 8, md: 12 }, px: { xs: 3, md: 6 } }}>
      {background && (
        <Box sx={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.35 }}>
          <video src={background} autoPlay muted loop playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </Box>
      )}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>{title}</Typography>
        <Button href={href} size="large" variant="contained">{buttonText}</Button>
      </Box>
    </Box>
  );
}


