import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import { useAtom } from 'jotai';
import { userAtom } from '@/state/user';

export default function BalancePage() {
  const [user] = useAtom(userAtom);
  const balance = user?.balance_tokens ?? 0;
  const history = [] as Array<{ id: string; type: 'in' | 'out'; amount: number; date: string }>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>Баланс</Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6">Текущий баланс: {balance} токенов</Typography>
          <Button variant="contained" sx={{ mt: 1 }} href="/checkout">Пополнить</Button>
        </CardContent>
      </Card>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>История</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Дата</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>Сумма</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.length === 0 && (
                <TableRow><TableCell colSpan={3}>Нет операций</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 1 }}>Тарифы</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {[{ name: 'Старт', price: 299 }, { name: 'Про', price: 999 }].map((t) => (
              <Card key={t.name} sx={{ minWidth: 220 }}>
                <CardContent>
                  <Typography variant="subtitle1">{t.name}</Typography>
                  <Typography variant="h6">{t.price} ₽</Typography>
                  <Button variant="outlined" sx={{ mt: 1 }}>Пополнить</Button>
                </CardContent>
              </Card>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}


