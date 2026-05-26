/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextConfig } from "next";

const configuredHosts = ["storage.googleapis.com"] as const;

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: false,
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  webpack(config: any) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  // allowedDevOrigins: ["app.whitepenguin.ng", "localhost:3000"],

  // async redirects() {
  //   return [
  //     {
  //       source: "/",
  //       destination: "/admin/dashboard", // Default root redirect (optional)
  //       permanent: false,
  //     },
  //     {
  //       source: "/admin",
  //       destination: "/admin/dashboard",
  //       permanent: false,
  //     },
  //     {
  //       source: "/staff",
  //       destination: "/staff/dashboard",
  //       permanent: false,
  //     },
  //     {
  //       source: "/parent",
  //       destination: "/parent/dashboard",
  //       permanent: false,
  //     },
  //   ];
  // },
  images: {
    remotePatterns: [...configuredHosts.map((hostname) => ({
        protocol: "https" as const,
        hostname,
      })),
      {
        protocol: "https" as const,
        hostname: "**.storage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
