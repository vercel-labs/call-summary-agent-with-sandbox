import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';

export const metadata: Metadata = {
  title: 'Sales Call Summary Agent',
  description: 'AI-powered sales call summary agent using Vercel Sandbox',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} style={{ height: '100vh', overflow: 'hidden' }}>
      <head>
        <style>{`*, *::before, *::after { box-sizing: border-box; }`}</style>
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          height: '100%',
          overflow: 'hidden',
          backgroundColor: '#000',
          fontFamily: 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: '#ededed',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        {children}
      </body>
    </html>
  );
}
