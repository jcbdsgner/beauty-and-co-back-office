import type { NextConfig } from "next";

// Options @svgr/webpack partagées webpack + turbopack.
// `removeViewBox: false` : sans ça, svgo supprime le `viewBox` des icônes qui
// portent déjà width/height (toutes les nôtres), et toute icône rendue à une
// taille < 24px (`className="h-4 w-4"`…) se retrouve rognée au lieu d'être mise
// à l'échelle.
const svgrOptions = {
  svgoConfig: {
    plugins: [
      {
        name: "preset-default",
        params: { overrides: { removeViewBox: false } },
      },
    ],
  },
};

const nextConfig: NextConfig = {
  // Les seuls SVG servis via <Image> sont nos propres assets statiques (logo de
  // marque, illustrations d'erreur). `next/image` les refuse sans cette option ;
  // la CSP neutralise tout script/objet au cas où.
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: [{ loader: "@svgr/webpack", options: svgrOptions }],
    });
    return config;
  },

  turbopack: {
    rules: {
      "*.svg": {
        loaders: [{ loader: "@svgr/webpack", options: svgrOptions }],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
