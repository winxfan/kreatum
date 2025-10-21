/**** Next.js config ****/
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    'antd',
    '@ant-design/icons',
    '@ant-design/icons-svg',
    '@ant-design/cssinjs',
    // rc-* deps used by antd
    'rc-util',
    'rc-motion',
    'rc-trigger',
    'rc-resize-observer',
    'rc-overflow',
    'rc-dropdown',
    'rc-menu',
    'rc-select',
    'rc-tree',
    'rc-table',
    'rc-pagination',
    'rc-picker',
    'rc-upload',
    'rc-dialog',
    'rc-drawer',
    'rc-input',
    'rc-input-number',
    'rc-virtual-list',
    'rc-collapse',
    'rc-steps',
    'rc-notification',
    'rc-tooltip',
    'rc-image',
    'rc-tabs',
    'rc-segmented',
    'rc-progress',
    'rc-rate',
    'rc-switch',
    'rc-cascader',
    'rc-field-form'
  ],
  experimental: {
    esmExternals: 'loose',
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' }
    ]
  },
  webpack: (config) => {
    // Поддержка импорта медиафайлов как URL
    config.module.rules.push({
      test: /\.(mp4|webm|ogg|mp3|wav|m4a)$/i,
      type: 'asset/resource',
      generator: { filename: 'static/media/[name].[hash][ext]' },
    });
    return config;
  },
};

module.exports = nextConfig;
