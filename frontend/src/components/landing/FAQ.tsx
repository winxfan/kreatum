import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

type QA = { q: string; a: string };

type Props = {
  title?: string;
  items?: QA[];
};

const DEFAULT: QA[] = [
  { q: 'Что делает модель Veo 3 уникальной?', a: 'Это модель для генерации реалистичных видео по тексту с управлением параметрами.' },
  { q: 'Как быстро выполняется генерация?', a: 'Обычно предварительный результат готов в течение нескольких секунд.' },
  { q: 'Можно ли использовать модель бесплатно?', a: 'Доступна демо-генерация; дальнейшее использование — по тарифу.' },
  { q: 'Поддерживает ли модель 4K?', a: 'Зависит от конфигурации. Базовый пресет — FullHD, продвинутые — выше.' },
];

export default function FAQ({ title = 'Часто задаваемые вопросы', items = DEFAULT }: Props) {
  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 2 }}>{title}</Typography>
      {items.map((it, idx) => (
        <Accordion key={`${idx}-${it.q}`}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography variant="subtitle1">{it.q}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography color="text.secondary">{it.a}</Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}


