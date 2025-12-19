import type { NextConfig } from 'next';
import { withWorkflow } from 'workflow/next';

const nextConfig: NextConfig = {
  experimental: {
  },
};

export default withWorkflow(nextConfig);

