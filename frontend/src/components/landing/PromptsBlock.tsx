import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';

type PromptCard = {
  title: string;
  prompt: string;
  params?: Record<string, string | number | boolean | undefined>;
  tags?: string[];
};

type Props = {
  title?: string;
  items: PromptCard[];
  onRun?: (p: PromptCard) => void;
};

export default function PromptsBlock({ title = 'Промпты', items, onRun }: Props) {
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };
  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>{title}</Typography>
      <Grid container spacing={2}>
        {items.map((it) => (
          <Grid item xs={12} md={6} key={it.title}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{it.title}</Typography>
                <Box sx={{ mt: 1, p: 1.5, bgcolor: 'background.default', border: '1px dashed', borderColor: 'divider', borderRadius: 1.5, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                  {it.prompt}
                </Box>
                {it.params && (
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', columnGap: 1.5, rowGap: 0.5, mt: 1 }}>
                    {Object.entries(it.params).map(([k, v]) => (
                      <>
                        <Typography key={`${it.title}-${k}-k`} variant="caption" color="text.secondary">{k}</Typography>
                        <Typography key={`${it.title}-${k}-v`} variant="caption">{v}</Typography>
                      </>
                    ))}
                  </Box>
                )}
                {it.tags && it.tags.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {it.tags.map((t) => <Chip key={t} size="small" label={t} />)}
                  </Box>
                )}
                <Box sx={{ mt: 1.5, display: 'flex', gap: 1 }}>
                  <Button size="small" variant="outlined" onClick={() => copy(it.prompt)}>Скопировать</Button>
                  {onRun && <Button size="small" variant="contained" onClick={() => onRun(it)}>Запустить в демо</Button>}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}


