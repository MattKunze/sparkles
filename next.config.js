const { IgnorePlugin } = require("webpack");

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
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
    // https://github.com/paulmillr/chokidar/issues/828#issuecomment-854474603
    plugins: [
      ...config.plugins,
      ...(process.platform !== "darwin"
        ? [new IgnorePlugin({ resourceRegExp: /^fsevents$/ })]
        : []),
    ],
  }),
};

module.exports = nextConfig;
