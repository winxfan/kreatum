import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

type MediaItem = {
  src: string;
  type?: 'image' | 'video';
  title?: string;
  caption?: string;
  poster?: string;
};

type Props = {
  title?: string;
  items: MediaItem[];
};

export default function MediaGallery({ title, items }: Props) {
  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      {title && (
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>{title}</Typography>
      )}
      <Grid container spacing={2}>
        {items.map((m, idx) => (
          <Grid item xs={12} sm={6} md={4} key={`${m.src}-${idx}`}>
            <figure style={{ margin: 0 }}>
              {m.type === 'video' || m.src.endsWith('.mp4') || m.src.endsWith('.webm') || m.src.endsWith('.ogg') ? (
                <video src={m.src} poster={m.poster} muted playsInline preload="metadata" style={{ width: '100%', borderRadius: 12 }} onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()} onMouseLeave={(e) => (e.currentTarget as HTMLVideoElement).pause()} />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={m.title || m.caption || 'элемент галереи'} src={m.src} loading="lazy" style={{ width: '100%', borderRadius: 12 }} />
              )}
              {(m.title || m.caption) && (
                <figcaption style={{ color: 'var(--mui-palette-text-secondary)', fontSize: 12, marginTop: 6 }}>
                  {m.title && <strong>{m.title}</strong>} {m.caption}
                </figcaption>
              )}
            </figure>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}


