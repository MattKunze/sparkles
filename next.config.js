/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    instrumentationHook: true,
  },
  webpack: (config) => ({
    ...config,
    module: {
      ...config.module,
      rules: [
        ...config.module.rules,
        // needed for fsevents/chokidar
        {
          test: /.node$/,
          loader: "node-loader",
        },
      ],
    },
  }),
};

module.exports = nextConfig;
