import type { Metadata } from 'next';
import { ReactNode } from 'react';

import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'FeedbackFlow',
  description: 'Collect and act on product feedback with clarity.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="bg-canvas text-ink">
      <body className="min-h-screen font-body antialiased">
        {children}
      </body>
    </html>
  );
}
