/** @type {import('next').NextConfig} */
const nextConfig = {
  // lib/ai/*.ts read prompts/*.md at runtime via fs.readFileSync, which the
  // production file-tracer can miss (it only follows static imports/requires).
  // Force those markdown files into every API route's deployment bundle so
  // extraction/red-flag/draft calls don't 500 in production.
  experimental: {
    outputFileTracingIncludes: {
      "/api/**": ["./prompts/**/*"],
    },
  },
};

export default nextConfig;
