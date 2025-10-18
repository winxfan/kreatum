import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import ImageIcon from '@mui/icons-material/Image';
import MovieIcon from '@mui/icons-material/Movie';
import TextFieldsIcon from '@mui/icons-material/TextFields';
import AudiotrackIcon from '@mui/icons-material/Audiotrack';
import SmartToyIcon from '@mui/icons-material/SmartToy';

type IO = 'image' | 'video' | 'text' | 'audio';

function getIcon(kind: IO) {
  switch (kind) {
    case 'image': return <ImageIcon fontSize="small" />;
    case 'video': return <MovieIcon fontSize="small" />;
    case 'text': return <TextFieldsIcon fontSize="small" />;
    case 'audio': return <AudiotrackIcon fontSize="small" />;
    default: return <SmartToyIcon fontSize="small" />;
  }
}

function getColors(from: IO, to: IO) {
  const map: Record<string, { bg: string; color: string; border: string }> = {
    'image:text': { bg: 'rgba(124,77,255,0.15)', color: '#b39ddb', border: 'rgba(124,77,255,0.4)' },
    'image:video': { bg: 'rgba(0,229,255,0.12)', color: '#80deea', border: 'rgba(0,229,255,0.4)' },
    'text:image': { bg: 'rgba(255,214,0,0.12)', color: '#ffe082', border: 'rgba(255,214,0,0.4)' },
    'text:video': { bg: 'rgba(0,191,165,0.12)', color: '#80cbc4', border: 'rgba(0,191,165,0.4)' },
    'video:image': { bg: 'rgba(255,64,129,0.12)', color: '#f48fb1', border: 'rgba(255,64,129,0.4)' },
    'audio:text': { bg: 'rgba(0,229,255,0.12)', color: '#80deea', border: 'rgba(0,229,255,0.4)' },
  };
  return map[`${from}:${to}`] || { bg: 'rgba(124,77,255,0.12)', color: '#b39ddb', border: 'rgba(124,77,255,0.4)' };
}

export default function CategoryTag({ from, to }: { from: IO; to: IO }) {
  const colors = getColors(from, to);
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 1, py: 0.5, borderRadius: 999, bgcolor: colors.bg, color: colors.color, border: '1px solid', borderColor: colors.border }}>
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        {getIcon(from)}
      </Box>
      <Chip size="small" label={`${from}-to-${to}`} sx={{ bgcolor: 'transparent', color: colors.color, px: 0 }} />
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
        {getIcon(to)}
      </Box>
    </Box>
  );
}


