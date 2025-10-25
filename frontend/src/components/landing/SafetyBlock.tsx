import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

type Props = {
  title?: string;
};

export default function SafetyBlock({ title = 'Безопасность и ограничения' }: Props) {
  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>{title}</Typography>
      <List>
        <ListItem>
          <ListItemText primary="Дипфейки и дезинформация" secondary="Не генерируйте реальных политических фигур, сцены насилия или приватных личностей. Используйте watermarks и safe-mode." />
        </ListItem>
        <ListItem>
          <ListItemText primary="Модерация на стороне сервиса" secondary="Добавьте server-side фильтрацию промптов и водяные знаки в вывод." />
        </ListItem>
        <ListItem>
          <ListItemText primary="Политика контента" secondary="Чекбокс подтверждения соблюдения прав и логирование запросов/результатов (audit trail)." />
        </ListItem>
      </List>
    </Box>
  );
}


