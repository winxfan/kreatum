import Link from 'next/link';
import { useState, MouseEvent, useEffect } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import AddIcon from '@mui/icons-material/Add';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useQuery } from '@tanstack/react-query';
import { useAtom } from 'jotai';
import { userAtom } from '@/state/user';
import { API_BASE, getUser } from '@/lib/api';
import { useRouter } from 'next/router';

const photoModels = [
  { label: 'Reve / text-to-image', href: '/models?category=photo' },
  { label: 'Reve / remix', href: '/models?category=photo' },
];

const videoModels = [
  { label: 'Veo 3.1', href: '/models?category=video' },
  { label: 'Kling Video', href: '/models?category=video' },
];

const textModels = [
  { label: 'LLM Text', href: '/models?category=text' },
];

export default function Header() {
  const [user, setUser] = useAtom(userAtom);
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ['me'],
    queryFn: getUser,
    staleTime: 60_000,
  });
  useEffect(() => {
    if (data) setUser(data);
  }, [data, setUser]);

  const [anchorPhoto, setAnchorPhoto] = useState<null | HTMLElement>(null);
  const [anchorVideo, setAnchorVideo] = useState<null | HTMLElement>(null);
  const [anchorText, setAnchorText] = useState<null | HTMLElement>(null);
  const [anchorUser, setAnchorUser] = useState<null | HTMLElement>(null);

  const openMenu = (
    setter: (el: HTMLElement | null) => void,
  ) => (e: MouseEvent<HTMLElement>) => setter(e.currentTarget);
  const closeMenu = (setter: (el: HTMLElement | null) => void) => () => setter(null);

  return (
    <AppBar position="sticky" color="default" sx={{ bgcolor: 'background.paper', borderBottom: '1px solid', borderColor: 'divider' }}>
      <Toolbar sx={{ gap: 2 }}>
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Креатум</Typography>
        </Link>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
          <Link href="/models" style={{ textDecoration: 'none' }}>
            <Button color="inherit">Все модели</Button>
          </Link>

          <Button color="inherit" endIcon={<KeyboardArrowDownIcon />} onClick={openMenu(setAnchorPhoto)}>AI фото</Button>
          <Menu anchorEl={anchorPhoto} open={!!anchorPhoto} onClose={closeMenu(setAnchorPhoto)}>
            {photoModels.map((m) => (
              <MenuItem key={m.label} component={Link as any} href={m.href} onClick={closeMenu(setAnchorPhoto)}>
                {m.label}
              </MenuItem>
            ))}
          </Menu>

          <Button color="inherit" endIcon={<KeyboardArrowDownIcon />} onClick={openMenu(setAnchorVideo)}>Ai видео</Button>
          <Menu anchorEl={anchorVideo} open={!!anchorVideo} onClose={closeMenu(setAnchorVideo)}>
            {videoModels.map((m) => (
              <MenuItem key={m.label} component={Link as any} href={m.href} onClick={closeMenu(setAnchorVideo)}>
                {m.label}
              </MenuItem>
            ))}
          </Menu>

          <Button color="inherit" endIcon={<KeyboardArrowDownIcon />} onClick={openMenu(setAnchorText)}>AI текст</Button>
          <Menu anchorEl={anchorText} open={!!anchorText} onClose={closeMenu(setAnchorText)}>
            {textModels.map((m) => (
              <MenuItem key={m.label} component={Link as any} href={m.href} onClick={closeMenu(setAnchorText)}>
                {m.label}
              </MenuItem>
            ))}
          </Menu>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {!user && (
          <Button color="primary" variant="contained" onClick={() => {
            router.replace({ pathname: router.pathname, query: { ...router.query, auth: 'true' } }, undefined, { shallow: true });
          }}>
            Войти
          </Button>
        )}

        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ mr: 0.5 }}>Баланс: {user.balance_tokens}</Typography>
            <IconButton color="primary" size="small" component={Link as any} href="/profile" aria-label="Пополнить">
              <AddIcon />
            </IconButton>
            <IconButton onClick={openMenu(setAnchorUser)} size="small">
              <Avatar sx={{ width: 28, height: 28 }} src={user.avatar_url || undefined} />
            </IconButton>
            <Menu anchorEl={anchorUser} open={!!anchorUser} onClose={closeMenu(setAnchorUser)}>
              <MenuItem component={Link as any} href="/profile" onClick={closeMenu(setAnchorUser)}>Профиль</MenuItem>
              <MenuItem onClick={() => { window.location.href = `${API_BASE}/api/v1/auth/logout`; }}>Выйти</MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
}


