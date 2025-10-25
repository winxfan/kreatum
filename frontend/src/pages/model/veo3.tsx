import { GetServerSideProps } from 'next';
import { API_BASE } from '@/lib/api';
import Box from '@mui/material/Box';
import ModelIntro from '@/components/ModelIntro';
import InfoBlock from '@/components/landing/InfoBlock';
import Pricing from '@/components/landing/Pricing';
import FAQ from '@/components/landing/FAQ';
import CTA from '@/components/landing/CTA';
import type { Model } from '@/types/model';
import InteractiveForm from '@/components/InteractiveForm';
import Typography from '@mui/material/Typography';
import { SEOHead, PromptsBlock, UseCasesGrid, MediaGallery } from '@/components/landing';

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const { id } = ctx.query as { id: string };
  try {
    const res = await fetch(`${API_BASE}/api/v1/models/${id}`);
    const data = await res.json();
    return { props: { model: data } };
  } catch {
    return { props: { model: { id, title: 'Veo 3.1' } } };
  }
};

export default function ModelPage({ model }: { model: Model }) {
  const title = model?.title ? `${model.title} — генерация видео` : 'Veo 3 — генерация видео';
  const description = model?.description || 'AI генерация видео с Veo 3: нейросеть от Google для профессионалов. Попробуйте бесплатно.';
  const canonical = `/model/veo3`;

  const gallery = [
    { src: '/media/example1.mp4', type: 'video' as const, title: 'Пейзаж на рассвете', caption: 'Кинематографичный наезд камеры, 10 с' },
    { src: '/media/example2.mp4', type: 'video' as const, title: 'Вертикальный стрит-арт', caption: 'Вертикальный 9:16, 8 с' },
    { src: '/media/example3.mp4', type: 'video' as const, title: 'Демонстрация продукта', caption: '360°, 12 с' },
    { src: '/media/example4.mp4', type: 'video' as const, title: 'Изображение→Видео', caption: 'Движение 6 с' },
    { src: '/media/example5.mp4', type: 'video' as const, title: 'Диалог под дождём', caption: '10 с, киношный стиль' },
    { src: '/media/example6.mp4', type: 'video' as const, title: 'Зацикленный брендовый фон', caption: 'Зацикливание 8 с' },
  ];

  const videoObjects = gallery.slice(0, 4).map((g) => ({
    name: g.title || 'Демо Veo 3',
    description: `${g.title || 'Демо Veo 3'} — ${description}`,
    contentUrl: g.src,
  }));

  const faqItems = [
    { question: 'Что делает модель Veo 3 уникальной?', answer: 'Нативная генерация видео и звука, поддержка image-to-video, гибкие параметры.' },
    { question: 'Как быстро выполняется генерация?', answer: 'Предпросмотр обычно за секунды; итог — в зависимости от параметров.' },
    { question: 'Можно ли использовать модель бесплатно?', answer: 'Есть демо-запуски; далее — оплата по тарифу.' },
    { question: 'Поддерживает ли модель 4K?', answer: 'Базово — до 1080p; расширенные пресеты зависят от конфигурации API.' },
  ];

  const prompts = [
    { title: 'Кинематографичная сцена (16:9)', prompt: 'Сумрачный утёс на рассвете, медленный наезд камеры, кинематографичные блики, реалистичные брызги воды, 10 с, приглушённый шум волн, мягкий женский шёпот: «помни море».', params: { 'Соотношение сторон': '16:9', 'Длительность': '10 с', 'Аудио': 'да', 'Стиль': 'кинематографичный' }, tags: ['би-ролл','кинематографично'] },
    { title: 'Вертикальная социальная анимация', prompt: 'Вертикальный клип: молодой художник расписывает стену яркими красками, быстрая смена кадров, ритмичный бодрый саундтрек, 8 с.', params: { 'Соотношение сторон': '9:16', 'Длительность': '8 с', 'Аудио': 'музыка' }, tags: ['соцсети','9:16'] },
    { title: 'Демонстрация продукта (360° + закадровый голос)', prompt: 'Студийная демонстрация продукта: вращающаяся матово-чёрная умная колонка на белом постаменте, 12 с, крупные планы, мягкий женский голос за кадром описывает функции, деликатный звуковой дизайн.', params: { 'Соотношение сторон': '16:9', 'Длительность': '12 с', 'Аудио': 'голос+эффекты', 'Стиль': 'фотореалистичный' }, tags: ['продукт','интернет‑магазин'] },
    { title: 'Изображение→Видео (оживление фото)', prompt: 'Возьмите загруженное фото старой городской площади и создайте 6‑секундный таймлапс: движущиеся облака и появляющиеся люди, тёплый свет «золотого часа».', params: { 'Режим': 'изображение→видео', 'Длительность': '6 с', 'Аудио': 'атмосферный' }, tags: ['изображение→видео'] },
    { title: 'Небольшая сюжетная сцена', prompt: 'Двое детей встречаются под неоновой вывеской под дождём. Короткий 10‑секундный диалог: «Ты принёс?» — «Да». Крупные планы, реалистичные капли дождя, мягкое пианино на фоне.', params: { 'Длительность': '10 с', 'Аудио': 'речь+эффекты', 'Стиль': 'кинематографичный' }, tags: ['сюжет'] },
    { title: 'Зацикленный брендовый фон', prompt: 'Бесшовная зацикленная абстрактная графика в фирменных цветах #0A74DA и #FFB400, мягкие волны движения, 8 с, подходит для зацикливания.', params: { 'Длительность': '8 с', 'Зацикливание': 'да', 'Аудио': 'атмосферная подложка' }, tags: ['зацикленный','бренд'] },
    { title: 'Быстрый демо‑ролик (эконом)', prompt: 'Малодетализированный стилизованный городской силуэт на закате, 5 с, упрощённые цвета, без звука.', params: { 'Вариант модели': 'Veo 3 Fast', 'Длительность': '5 с', 'Аудио': 'нет' }, tags: ['быстро'] },
    { title: 'Персонаж с липсинком', prompt: 'Мультяшный персонаж‑лиса говорит: «Здравствуйте, путешественники!» — полная синхронизация губ, дружелюбный тон, 6 с.', params: { 'Длительность': '6 с', 'Аудио': 'диалог', 'Стиль': 'стилизованный' }, tags: ['персонаж'] },
    { title: 'Объясняющий ролик', prompt: 'Анимация на «белой доске», объясняющая круговорот воды; простые рисунки плавно перетекают друг в друга, закадровый текст: «Испарение, конденсация, осадки».', params: { 'Длительность': '15 с', 'Аудио': 'закадровый голос', 'Стиль': 'иллюстрация' }, tags: ['эдтех'] },
    { title: 'Новостной B‑roll (этично)', prompt: 'Симулированный пустой новостной зал: камеры, бегущая строка, без реальных людей, 7 с, атмосферные звуки ньюсрума.', params: { 'Длительность': '7 с', 'Аудио': 'эффекты', 'Безопасный режим': 'да' }, tags: ['безопасно','би-ролл'] },
  ];

  const useCases = [
    { title: 'Маркетинг и реклама', description: 'Быстрые креативы для A/B тестов, тизеры, демонстрации товара. Гибкие пресеты качества/скорости.', samplePrompt: prompts[2].prompt },
    { title: 'Социальные сети', description: 'Вертикальные клипы 9:16 для Reels/Shorts/TikTok без съёмок.', samplePrompt: prompts[1].prompt },
    { title: 'E-commerce', description: '360° превью продуктов, динамика для карточек товара.', samplePrompt: prompts[2].prompt },
    { title: 'Образование (EdTech)', description: 'Объяснительные анимации, оживление диаграмм, micro-lessons.', samplePrompt: prompts[8].prompt },
    { title: 'Медиа и storytelling', description: 'Прототипы сцен, раскадровки, быстрые иллюстрации к материалам.', samplePrompt: prompts[4].prompt },
    { title: 'Инструменты для креаторов', description: 'Ассеты, бэкграунды, SFX для прототипов, moodboards.', samplePrompt: prompts[5].prompt },
  ];

  const handleRunPrompt = () => {
    const el = document.getElementById('playground');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <>
      <SEOHead title={title} description={description} canonical={canonical} videoObjects={videoObjects} faq={faqItems} />
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 3 } }}>
      <ModelIntro
        model={model}
        title="Veo 3 — генерация видео по тексту с нативным звуком"
        description="Veo 3 — это нейросеть для генерации видео на основе текста, созданная Google DeepMind. Она поддерживает управление стилем, длительностью и камерой, создавая последовательные и реалистичные сцены."
      />

      <Box sx={{p: 4}}>
        <Typography variant='h4' textAlign="center">Начните использовать Veo 3 сейчас</Typography>
        <Typography variant="body1" color="text.secondary" textAlign="center" sx={{mb: 4, mt: 2}}>
          Veo 3 — это нейросеть для генерации видео на основе текста, созданная Google DeepMind. Она поддерживает управление стилем, длительностью и камерой, создавая последовательные и реалистичные сцены.
        </Typography>

        <InteractiveForm 
          model={model}
        />
      </Box>

      <MediaGallery title="Примеры генерации" items={gallery} />
      <InfoBlock
        title="Как это работает"
        steps={[
          'Введите описание видео',
          'Выберите параметры модели',
          'Получите сгенерированное видео',
        ]}
      />
      <PromptsBlock title="Готовые промпты" items={prompts as any} onRun={handleRunPrompt} />
      <UseCasesGrid items={useCases} />
      
      <Pricing />
      <FAQ />
      <CTA title="Создавайте видео с Veo 3" buttonText="Начать генерацию" background="/media/cta-bg.mp4" />
      </Box>
    </>
  );
}

