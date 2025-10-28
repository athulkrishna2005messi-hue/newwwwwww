import { ReactNode } from 'react';

import AuthGate from '@/components/auth-gate';
import Footer from '@/components/footer';
import Navigation from '@/components/navigation';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navigation variant="app" />
      <main className="flex-1 px-6 py-10">
        <div className="mx-auto w-full max-w-5xl space-y-8">
          <AuthGate>{children}</AuthGate>
        </div>
      </main>
      <Footer />
    </div>
  );
}
