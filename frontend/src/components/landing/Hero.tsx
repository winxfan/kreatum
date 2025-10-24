import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

type Props = {
  title: string;
  subtitle?: string;
  buttonText?: string;
  ctaHref?: string;
};

export default function Hero({ title, subtitle, buttonText = 'Начать генерацию', ctaHref = '#playground' }: Props) {
  return (
    <Box sx={{ py: { xs: 8, md: 14 }, textAlign: 'left' }}>
      <Typography component="h1" variant="h2" sx={{ fontWeight: 800, mb: 2 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 760, mb: 3 }}>
          {subtitle}
        </Typography>
      )}
      <Button href={ctaHref} size="large" variant="contained">
        {buttonText}
      </Button>
    </Box>
  );
}


