import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import IconButton from '@mui/material/IconButton';
import ArrowForwardIosRoundedIcon from '@mui/icons-material/ArrowForwardIosRounded';
import Button from '@mui/material/Button';

type LibraryItem = {
  img: string;
  title: string;
  prompt: string;
};

type Props = {
  title?: string;
  onSeeAllHref?: string;
  items: LibraryItem[];
  onRun?: (prompt: string) => void;
};

export default function GenerationsLibrary({ title = 'Библиотека генераций', onSeeAllHref = '/models', items, onRun }: Props) {
  const copy = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  };
  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>{title}</Typography>
        <Button href={onSeeAllHref} endIcon={<ArrowForwardIosRoundedIcon fontSize="small" />}>Посмотреть все</Button>
      </Box>
      <Box sx={{ width: '100%', overflowX: 'hidden' }}>
        <ImageList variant="masonry" cols={3} gap={8} sx={{ m: 0 }}>
          {items.map((item) => (
            <ImageListItem key={item.img} sx={{ position: 'relative' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.img}
                alt={item.title}
                loading="lazy"
                style={{ width: '100%', borderRadius: 12, display: 'block' }}
              />
              <Box sx={{ mt: 1, p: 1.25, bgcolor: 'background.default', border: '1px dashed', borderColor: 'divider', borderRadius: 1.5, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                {item.prompt}
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 1, mt: 1 }}>
                <Button size="small" variant="outlined" fullWidth onClick={() => copy(item.prompt)}>Скопировать</Button>
                {onRun && <Button size="small" variant="contained" fullWidth onClick={() => onRun(item.prompt)}>Запустить</Button>}
              </Box>
            </ImageListItem>
          ))}
        </ImageList>
      </Box>
    </Box>
  );
}


