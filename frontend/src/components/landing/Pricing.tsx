import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';

type Plan = {
  name: string;
  price: string;
  features: string[];
  cta?: string;
  href?: string;
  highlighted?: boolean;
};

const DEFAULT_PLANS: Plan[] = [
  { name: 'Free', price: '0 ₽', features: ['Демо-генерации', 'Ограниченная длина'], cta: 'Попробовать', href: '#playground' },
  { name: 'Pro', price: 'от 499 ₽', features: ['Приоритетная очередь', 'FullHD'], cta: 'Выбрать', href: '/balance', highlighted: true },
  { name: 'Business', price: 'по запросу', features: ['SLA', 'Пользовательские пресеты'], cta: 'Связаться', href: '/profile' },
];

type Props = {
  title?: string;
  plans?: Plan[];
};

export default function Pricing({ title = 'Попробуйте бесплатно или выберите тариф', plans = DEFAULT_PLANS }: Props) {
  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>{title}</Typography>
      <Grid container spacing={2}>
        {plans.map((p) => (
          <Grid item xs={12} md={4} key={p.name}>
            <Card sx={{ borderColor: p.highlighted ? 'primary.main' : 'divider', borderWidth: 2, borderStyle: 'solid' }}>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{p.name}</Typography>
                <Typography variant="h4" sx={{ my: 1 }}>{p.price}</Typography>
                <Box sx={{ display: 'grid', gap: 0.5, mb: 2 }}>
                  {p.features.map((f) => (
                    <Typography key={f} variant="body2" color="text.secondary">• {f}</Typography>
                  ))}
                </Box>
                <Button variant={p.highlighted ? 'contained' : 'outlined'} href={p.href || '#playground'} fullWidth>
                  {p.cta || 'Выбрать'}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}


