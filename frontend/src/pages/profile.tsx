import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useAtom } from 'jotai';
import { userAtom } from '@/state/user';

export default function ProfilePage() {
  const [user] = useAtom(userAtom);
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>Профиль</Typography>
      <Typography variant="body1" sx={{ color: 'text.secondary', mb: 2 }}>
        Баланс: {user?.balance_tokens ?? 0} токенов
      </Typography>
      <Button variant="contained">Пополнить баланс</Button>
    </Box>
  );
}

