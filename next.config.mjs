import { withWorkflow } from '@workflow/next'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // @vercel/sandbox uses Node.js-only APIs — keep it external so Next.js
  // doesn't try to bundle it for the edge runtime.
  // 'workflow' must NOT be listed here: the @workflow/next SWC plugin needs
  // to transform "use workflow" / "use step" directives at build time.
  serverExternalPackages: ['@vercel/sandbox'],
}

export default withWorkflow(nextConfig)
