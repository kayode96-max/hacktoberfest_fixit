import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'FixIt AI | Interactive Technical Troubleshooting Assistant',
  description:
    'Mobile-first AI assistant for diagnosing electrical, solar, electronic, and household equipment step-by-step using open-weight models.',
  keywords: ['troubleshooting', 'electrical repair', 'solar diagnosis', 'multimeter', 'open-weight AI', 'FixIt'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#090d16',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="app-container">
          <Navbar />
          <main style={{ flex: 1, padding: '16px' }}>{children}</main>
          <BottomNav />
        </div>
      </body>
    </html>
  );
}
