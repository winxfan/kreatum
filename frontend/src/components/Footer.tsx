import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import TelegramIcon from '@mui/icons-material/Telegram';
import PublicIcon from '@mui/icons-material/Public';

const videoLinks = [
  { label: 'Veo 3.1', href: '/models?category=video' },
  { label: 'Kling Video', href: '/models?category=video' },
];
const photoLinks = [
  { label: 'Reve text-to-image', href: '/models?category=photo' },
  { label: 'Reve remix', href: '/models?category=photo' },
];
const textLinks = [
  { label: 'LLM Text', href: '/models?category=text' },
];

export default function Footer() {
  return (
    <Box component="footer" sx={{ mt: 6, borderTop: '1px solid', borderColor: 'divider', py: 4 }}>
      <Box sx={{ px: { xs: 2, md: 4 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>AI видео</Typography>
          {videoLinks.map((l) => (
            <Typography key={l.label} component={Link as any} href={l.href} color="text.secondary" sx={{ display: 'block', textDecoration: 'none', mb: 0.5 }}>
              {l.label}
            </Typography>
          ))}
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>AI фото</Typography>
          {photoLinks.map((l) => (
            <Typography key={l.label} component={Link as any} href={l.href} color="text.secondary" sx={{ display: 'block', textDecoration: 'none', mb: 0.5 }}>
              {l.label}
            </Typography>
          ))}
        </Box>
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700 }}>AI текст</Typography>
          {textLinks.map((l) => (
            <Typography key={l.label} component={Link as any} href={l.href} color="text.secondary" sx={{ display: 'block', textDecoration: 'none', mb: 0.5 }}>
              {l.label}
            </Typography>
          ))}
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2, md: 4 }, mt: 3, color: 'text.secondary' }}>
        <Typography variant="body2">© 2025, Neurolibrary</Typography>
        <Typography variant="body2">ИП Резбаев Данил Эдуардович, ИНН 021904517407, ОГРНИП 325028000186815</Typography>
        <Typography variant="body2">Поддержка: <a href="mailto:hello@Neurolibrary">hello@Neurolibrary</a></Typography>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
          <Typography component={Link as any} href="/privacy" color="text.secondary" sx={{ textDecoration: 'none' }}>Политика конфиденциальности</Typography>
          <Typography component={Link as any} href="/terms" color="text.secondary" sx={{ textDecoration: 'none' }}>Пользовательское соглашение</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <IconButton component="a" href="https://vk.com" target="_blank" rel="noreferrer" size="small" color="inherit" aria-label="VK">
            <PublicIcon fontSize="small" />
          </IconButton>
          <IconButton component="a" href="https://t.me" target="_blank" rel="noreferrer" size="small" color="inherit" aria-label="Telegram">
            <TelegramIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
}


