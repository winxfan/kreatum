import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';
import { useAtom } from 'jotai';
import { userAtom } from '@/state/user';

export default function ProfilePage() {
  const [user] = useAtom(userAtom);
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>Профиль</Typography>
      {user ? (
        <>
          {user.avatar_url ? (
            <Avatar src={user.avatar_url || undefined} alt={user.name || 'Аватар'} sx={{ width: 64, height: 64, mb: 2 }} />
          ) : null}
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>ID: {user.id}</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>Имя: {user.name ?? '—'}</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary' }}>Аватар (URL): {user.avatar_url ?? '—'}</Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
            Баланс: {user.balance_tokens} токенов
          </Typography>
          <Button variant="contained">Пополнить баланс</Button>
        </>
      ) : (
        <Typography variant="body1" sx={{ color: 'text.secondary' }}>Не авторизован</Typography>
      )}
    </Box>
  );
}

