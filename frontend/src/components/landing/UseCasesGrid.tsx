import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

type UseCase = {
  title: string;
  description: string;
  samplePrompt?: string;
};

type Props = {
  title?: string;
  items: UseCase[];
};

export default function UseCasesGrid({ title = 'Где используют Veo 3', items }: Props) {
  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>{title}</Typography>
      <Grid container spacing={2}>
        {items.map((c) => (
          <Grid item xs={12} md={4} key={c.title}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{c.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{c.description}</Typography>
                {c.samplePrompt && (
                  <Box sx={{ mt: 1.5, p: 1.25, fontFamily: 'monospace', bgcolor: 'background.default', border: '1px dashed', borderColor: 'divider', borderRadius: 1.5, whiteSpace: 'pre-wrap' }}>
                    {c.samplePrompt}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}


