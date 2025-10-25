import Head from 'next/head';

type VideoObject = {
  name: string;
  description?: string;
  thumbnailUrl?: string;
  uploadDate?: string;
  contentUrl: string;
};

type FAQItem = { question: string; answer: string };

type Props = {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string | null;
  videoObjects?: VideoObject[];
  faq?: FAQItem[];
};

export default function SEOHead({ title, description, canonical, ogImage, videoObjects = [], faq = [] }: Props) {
  const jsonLd: any[] = [];

  if (videoObjects.length > 0) {
    for (const v of videoObjects) {
      jsonLd.push({
        '@context': 'https://schema.org',
        '@type': 'VideoObject',
        name: v.name,
        description: v.description || description,
        thumbnailUrl: v.thumbnailUrl ? [v.thumbnailUrl] : undefined,
        uploadDate: v.uploadDate,
        contentUrl: v.contentUrl,
      });
    }
  }

  if (faq.length > 0) {
    jsonLd.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faq.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
  }

  return (
    <Head>
      <title>{title}</title>
      <meta name="description" content={description} />
      {canonical && <link rel="canonical" href={canonical} />}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {ogImage && <meta property="og:image" content={ogImage} />}
      {jsonLd.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      )}
    </Head>
  );
}


