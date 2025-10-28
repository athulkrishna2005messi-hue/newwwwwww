import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { ReactQueryProvider } from '@/components/providers/ReactQueryProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Insights Dashboard',
  description: 'Real-time analytics dashboard for AI feedback analyses.'
};

export default function RootLayout({
  children
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}
