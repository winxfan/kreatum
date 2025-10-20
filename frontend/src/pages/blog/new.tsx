import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';

export default function BlogNew() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>Новая статья</Typography>
      <Box sx={{ display: 'grid', gap: 2 }}>
        <TextField label="Заголовок" value={title} onChange={(e) => setTitle(e.target.value)} fullWidth />
        <TextField label="Контент (Markdown)" value={content} onChange={(e) => setContent(e.target.value)} fullWidth multiline rows={12} />
        <Box>
          <Button variant="contained" disabled={!title || !content}>Опубликовать</Button>
        </Box>
      </Box>
    </Box>
  );
}


