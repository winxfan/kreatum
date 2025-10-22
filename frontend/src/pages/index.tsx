import Link from 'next/link';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PublicIcon from '@mui/icons-material/Public';
import InteractiveForm from '@/components/InteractiveForm';
import type { Model } from '@/types/model';
import banner from '@/assets/banner.jpg';
import veo1 from '@/assets/veo3input1.png';
import veo2 from '@/assets/veo3input2.png';
import veo3 from '@/assets/veo3input3.png';
import veoOut from '@/assets/veo3output1.mp4';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useState, useMemo } from 'react';

const demoModel: Model = {
  id: 'demo-veo', 
  banner_image_url: banner.src,
  title: 'Veo 3.1',
  description: 'Image to Video demo',
  from: 'image',
  to: 'video',
  demo_input: [
    {
      type: 'text',
      name: 'prompt',
      title: 'Описание сцены',
      is_required: true,
      hint: 'Опишите, что должно произойти в видео',
      content: 'Ярмарка с каруселью и воздушными змеями; бабочки над цветущим полем; балерина делает пируэты на сцене, тёплый закатный свет',
    },
    {
      type: 'image',
      name: 'reference_1',
      title: 'Референс 1',
      url: veo1.src,
    },
    {
      type: 'image',
      name: 'reference_2',
      title: 'Референс 2',
      url: veo2.src,
    },
    {
      type: 'image',
      name: 'reference_3',
      title: 'Референс 3',
      url: veo3.src,
    },
  ],
  demo_output: [
    {
      type: 'video',
      name: 'result',
      title: 'Пример результата',
      url: (veoOut as any).src || (veoOut as unknown as string),
      meta: { preview: veo3.src },
    },
  ],
  options: {
    durationOptions: [3,5,10],
    resolutionOptions: ['720p','1080p'],
    generateAudio: false,
    aspectRatioOptions: ['16:9','9:16','1:1'],
    negativePrompt: '',
  }
};

export default function Home() {
  const models: Model[] = useMemo(() => [
    {
      id: 'img2video',
      banner_image_url: banner.src,
      title: 'Veo 3.1',
      description: 'Image to Video',
      from: 'image',
      to: 'video',
      demo_input: [
        { type: 'text', name: 'prompt', title: 'Описание сцены', is_required: true, content: 'Солнечная ярмарка, карусель, бабочки в цветущем поле, балерина на сцене' },
        { type: 'image', name: 'reference_1', title: 'Референс 1', url: veo1.src },
        { type: 'image', name: 'reference_2', title: 'Референс 2', url: veo2.src },
        { type: 'image', name: 'reference_3', title: 'Референс 3', url: veo3.src },
      ],
      demo_output: [
        { type: 'video', name: 'result', title: 'Пример результата', url: (veoOut as any).src || (veoOut as unknown as string), meta: { preview: veo3.src } },
      ],
      options: { durationOptions: [3,5,10], resolutionOptions: ['720p','1080p'], generateAudio: false, aspectRatioOptions: ['16:9','9:16','1:1'], negativePrompt: '' },
    },
    {
      id: 'text2image',
      title: 'PixArt XL',
      description: 'Text to Image',
      banner_image_url: banner.src,
      from: 'text',
      to: 'image',
      demo_input: [
        { type: 'text', name: 'prompt', title: 'Описание', is_required: true, content: 'Футуристический город на закате, неоновые вывески, синематика' },
        { type: 'text', name: 'negative_prompt', title: 'Негативные слова', is_required: false, content: '' },
      ],
      demo_output: [
        { type: 'image', name: 'result', title: 'Пример', url: veo2.src },
      ],
      options: { aspectRatioOptions: ['1:1','16:9','9:16'] },
    },
    {
      id: 'audio2audio',
      title: 'Audio Enhance',
      description: 'Audio to Audio',
      banner_image_url: banner.src,
      from: 'audio',
      to: 'audio',
      demo_input: [
        { type: 'audio', name: 'input_audio', title: 'Аудио', url: 'https://upload.wikimedia.org/wikipedia/commons/4/4f/Beethoven_Moonlight_1st_movement.ogg' },
      ],
      demo_output: [
        { type: 'audio', name: 'result', title: 'Пример', url: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Elgar_Nimrod.ogg' },
      ],
    },
    {
      id: 'video2audio',
      title: 'Narration Maker',
      description: 'Video to Audio',
      banner_image_url: banner.src,
      from: 'video',
      to: 'audio',
      demo_input: [
        { type: 'video', name: 'clip', title: 'Клип', url: (veoOut as any).src || (veoOut as unknown as string) },
        { type: 'text', name: 'voice', title: 'Голос', content: 'female, calm, studio quality' },
      ],
      demo_output: [
        { type: 'audio', name: 'result', title: 'Озвучка', url: 'https://file-examples.com/storage/fe5ac2f0f2cb4dc082d8b9da/2017/11/file_example_MP3_700KB.mp3' },
      ],
    },
  ], []);

  const [active, setActive] = useState(0);
  return (
    <div>
      <Box
        style={{
          backgroundImage: `url(${demoModel.banner_image_url})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          borderRadius: 25,
        }}
      >
        <Box 
          sx={{
            display: 'grid', 
            gap: 2, 
            alignItems: 'center', 
            p: 6,
            mb: 6,
            height: '600px',
          }}
          style={{
            background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.7) 0%, rgba(0, 0, 0, 0.25) 40%, rgba(0, 0, 0, 0.9) 100%)'
          }}
      >
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>Креатум - все нейросети в одном месте</Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Агрегатор нейромоделей: фото, видео и текст в одной платформе.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button variant="contained" component={Link as any} href="/models">Зарегистрироваться и попробовать</Button>
            <Button variant="outlined" component={Link as any} href="/models">Посмотреть модели</Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 3, color: 'text.secondary' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><CreditCardIcon fontSize="small" /> Оплата российскими картами</Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><PublicIcon fontSize="small" /> Работает без VPN</Box>
          </Box>
        </Box>
       </Box>
      </Box>

      <Box>
        <InteractiveForm model={demoModel} />
      </Box>

      {/* Блок 2: современные модели с табами */}
      <Box sx={{ mt: 8 }}>
        <Typography variant="h5" align="center" sx={{ fontWeight: 800, mb: 2 }}>Попробуйте современные модели!</Typography>
        <Tabs value={active} onChange={(_, v) => setActive(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3 }}>
          {models.map((m) => (
            <Tab key={m.id} label={`${m.title} (${m.from}→${m.to})`} />
          ))}
        </Tabs>
        <InteractiveForm model={models[active]} />
      </Box>
    </div>
  );
}

