import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InteractiveForm from '@/components/InteractiveForm';
import type { Model } from '@/types/model';

type Props = { model: Model };

export default function DemoForm({ model }: Props) {
  return (
    <Box id="playground" sx={{ py: { xs: 4, md: 6 } }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Попробуйте прямо сейчас</Typography>
      <InteractiveForm model={model} />
    </Box>
  );
}


