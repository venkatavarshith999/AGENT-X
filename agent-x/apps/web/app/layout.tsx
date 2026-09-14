import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Navbar } from '@/components/navbar';

export const metadata = {
  title: 'Agent X Enterprise — Autonomous State-Driven Resolution Platform',
  description: 'Multi-role enterprise resolution platform built on enforced state machine logic, policy engines, and realtime field worker dispatch.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bgPrimary text-textPrimary antialiased selection:bg-accentBlue selection:text-white">
        <ThemeProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-borderToken bg-bgPanel/50 py-6 text-center text-xs text-textSecondary">
              <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center space-y-2 sm:space-y-0">
                <p>© 2026 Agent X Enterprise Inc. State machine version 1.0.4. All rights reserved.</p>
                <div className="flex space-x-4">
                  <a href="/about" className="hover:text-textPrimary">Architecture</a>
                  <a href="/features" className="hover:text-textPrimary">Features</a>
                  <a href="/pricing" className="hover:text-textPrimary">Pricing</a>
                </div>
              </div>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
