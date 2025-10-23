import { useMemo } from 'react';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import CloseIcon from '@mui/icons-material/Close';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import GoogleIcon from '@mui/icons-material/Google';
import { useRouter } from 'next/router';
import { API_BASE } from '@/lib/api';
import VkLogo from '@/assets/vk_logo.svg';
import YandexLogo from '@/assets/yandex_logo.svg';
import GoogleLogo from '@/assets/google_logo.svg';

function ProviderAvatar({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <Avatar sx={{ width: 28, height: 28, bgcolor: bg, color, fontWeight: 800, fontSize: 14 }}>{label}</Avatar>
  );
}

function asUrl(mod: any): string {
  return typeof mod === 'string' ? mod : (mod && typeof mod.src === 'string' ? mod.src : '');
}

export default function AuthDialog() {
  const router = useRouter();
  const open = useMemo(() => {
    const q = router.query?.auth;
    return q === 'true' || q === '1' || q === '';
  }, [router.query]);

  const close = () => {
    const { auth, ...rest } = router.query || {};
    router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true });
  };

  const oauth = (provider: 'vk' | 'yandex' | 'google') => {
    window.location.href = `${API_BASE}/api/v1/auth/oauth/${provider}/login`;
  };

  const email = () => {
    // Временная точка входа по почте — переведём в профиль
    router.push('/profile');
  };

  return (
    <Dialog open={!!open} onClose={close} fullWidth maxWidth="xs">
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', mb: 2, textAlign: 'center' }}>
            <div>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Вход или регистрация</Typography>
          <Typography variant="body2" sx={{ fontWeight: 400 }}>
                Получите доступ к современным моделям генерации видео, изображений и текста.
            </Typography>
            </div>
          <IconButton onClick={close} size="small" aria-label="Закрыть">
            <CloseIcon />
          </IconButton>
        </Box>

        <Stack spacing={1.5}>
          <Button onClick={() => oauth('vk')} variant="text" color="inherit" sx={{
            justifyContent: 'flex-start',
            bgcolor: 'action.hover',
            '&:hover': { bgcolor: 'action.selected' },
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: 18,
            fontWeight: 600,
            color: 'text.primary',
            px: 2,
            gap: 1.5,
          }}
            startIcon={<Avatar src={asUrl(VkLogo)} sx={{ width: 28, height: 28, bgcolor: 'transparent' }} />}
          >
            VK ID
          </Button>

          <Button onClick={() => oauth('yandex')} variant="text" color="inherit" sx={{
            justifyContent: 'flex-start',
            bgcolor: 'action.hover',
            '&:hover': { bgcolor: 'action.selected' },
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: 18,
            fontWeight: 600,
            color: 'text.primary',
            px: 2,
            gap: 1.5,
          }}
            startIcon={<Avatar src={asUrl(YandexLogo)} sx={{ width: 28, height: 28, bgcolor: 'transparent' }} />}
          >
            Яндекс
          </Button>

          <Button onClick={() => oauth('google')} variant="text" color="inherit" sx={{
            justifyContent: 'flex-start',
            bgcolor: 'action.hover',
            '&:hover': { bgcolor: 'action.selected' },
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: 18,
            fontWeight: 600,
            color: 'text.primary',
            px: 2,
            gap: 1.5,
          }}
            startIcon={<Avatar src={asUrl(GoogleLogo)} sx={{ width: 28, height: 28, bgcolor: 'transparent' }} />}
          >
            Google
          </Button>

          <Button onClick={email} variant="text" color="inherit" sx={{
            justifyContent: 'flex-start',
            bgcolor: 'action.hover',
            '&:hover': { bgcolor: 'action.selected' },
            py: 1.5,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: 18,
            fontWeight: 600,
            color: 'text.primary',
            px: 2,
            gap: 1.5,
          }}
            startIcon={<Avatar sx={{ width: 28, height: 28, bgcolor: 'green.200', color: 'text.primary' }}><MailOutlineIcon fontSize="small" /></Avatar>}
          >
            Электронная почта
          </Button>
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          Продолжая, вы даёте{' '}
          <a href="#" style={{ color: 'inherit' }}>согласие</a>{' '}на обработку{' '}
          <a href="#" style={{ color: 'inherit' }}>персональных данных</a>{' '}и
          {' '}соглашаетесь с{' '}<a href="#" style={{ color: 'inherit' }}>офертой</a>.
        </Typography>
      </Box>
    </Dialog>
  );
}


