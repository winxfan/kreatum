import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

type Props = {
  title: string;
  text?: string;
  mediaType?: 'image' | 'video' | 'none';
  mediaSrc?: string | null;
  layout?: 'single' | 'grid';
  mediaGallery?: string[];
  steps?: string[];
};

export default function InfoBlock({ title, text, mediaType = 'none', mediaSrc = null, layout = 'single', mediaGallery, steps }: Props) {
  if (layout === 'grid' && mediaGallery && mediaGallery.length > 0) {
    return (
      <Box sx={{ py: { xs: 6, md: 10 } }}>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>{title}</Typography>
        {text && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 840 }}>{text}</Typography>
        )}
        <Grid container spacing={2}>
          {mediaGallery.map((src, idx) => (
            <Grid item xs={12} sm={6} md={4} key={`${src}-${idx}`}>
              {src.endsWith('.mp4') || src.endsWith('.webm') || src.endsWith('.ogg') ? (
                <video src={src} style={{ width: '100%', borderRadius: 12 }} controls playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt="пример" src={src} style={{ width: '100%', borderRadius: 12 }} />
              )}
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>{title}</Typography>
      {text && (
        <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 840, mb: 3 }}>{text}</Typography>
      )}
      {Array.isArray(steps) && steps.length > 0 && (
        <Grid container spacing={2}>
          {steps.map((s, i) => (
            <Grid item xs={12} md={4} key={`${i}-${s}`}>
              <Box sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Typography variant="overline" color="text.secondary">Шаг {i + 1}</Typography>
                <Typography variant="subtitle1" sx={{ mt: 0.5 }}>{s}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      )}
      {mediaType !== 'none' && mediaSrc && (
        <Box sx={{ mt: 3 }}>
          {mediaType === 'video' ? (
            <video src={mediaSrc} style={{ width: '100%', borderRadius: 12 }} controls playsInline />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="медиа" src={mediaSrc} style={{ width: '100%', borderRadius: 12, maxWidth: '100%' }} />
          )}
        </Box>
      )}
    </Box>
  );
}


