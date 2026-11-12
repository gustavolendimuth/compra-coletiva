/**
 * Hosts aceitos pelo otimizador /_next/image.
 * Só o bucket S3 configurado e o /uploads da API; qualquer outro host responde 400.
 */

function toUrl(raw, nodeEnv) {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return new URL(trimmed);
  }
  const isLocal = /localhost|127\.0\.0\.1|0\.0\.0\.0/.test(trimmed);
  const protocol = isLocal || nodeEnv !== 'production' ? 'http' : 'https';
  return new URL(`${protocol}://${trimmed}`);
}

function buildImageRemotePatterns(env = process.env) {
  const patterns = [];

  if (env.AWS_S3_BUCKET) {
    const region = env.AWS_S3_REGION || 'us-east-1';
    patterns.push({
      protocol: 'https',
      hostname: `${env.AWS_S3_BUCKET}.s3.${region}.amazonaws.com`,
      pathname: '/**',
    });
  }

  const apiUrl = toUrl(env.NEXT_PUBLIC_API_URL || 'localhost:3000', env.NODE_ENV);
  if (apiUrl) {
    patterns.push({
      protocol: apiUrl.protocol.replace(':', ''),
      hostname: apiUrl.hostname,
      ...(apiUrl.port ? { port: apiUrl.port } : {}),
      pathname: '/uploads/**',
    });
  }

  if (env.NODE_ENV !== 'production') {
    patterns.push({ protocol: 'http', hostname: 'localhost' });
  }

  return patterns;
}

module.exports = { buildImageRemotePatterns };
