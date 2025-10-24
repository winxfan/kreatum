import Head from 'next/head';
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
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: model?.title || 'Veo 3',
    applicationCategory: 'MultimediaApplication',
    operatingSystem: 'Web',
    description,
  } as const;

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>
      <Box sx={{ maxWidth: 1200, mx: 'auto', px: { xs: 2, md: 3 } }}>
      <ModelIntro model={model} />
      <InteractiveForm model={model} />
      <InfoBlock
        title="Что такое Veo 3?"
        text="Veo 3 — это нейросеть для генерации видео на основе текста, созданная Google DeepMind. Она поддерживает управление стилем, длительностью и камерой, создавая последовательные и реалистичные сцены."
        mediaType="video"
        mediaSrc="/media/veo3-overview.mp4"
      />
      <InfoBlock
        title="Примеры генерации"
        layout="grid"
        mediaGallery={[
          '/media/example1.mp4',
          '/media/example2.mp4',
          '/media/example3.mp4',
          '/media/example4.mp4',
          '/media/example5.mp4',
          '/media/example6.mp4',
        ]}
      />
      <InfoBlock
        title="Как это работает"
        steps={[
          'Введите описание видео',
          'Выберите параметры модели',
          'Получите сгенерированное видео',
        ]}
      />
      <Pricing />
      <FAQ />
      <CTA title="Создавайте видео с Veo 3" buttonText="Начать генерацию" background="/media/cta-bg.mp4" />
      </Box>
    </>
  );
}

