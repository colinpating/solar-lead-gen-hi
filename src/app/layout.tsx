import './globals.css';
import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/consent';

export const metadata: Metadata = {
  title: `${APP_NAME} | Hawaii Residential Solar`,
  description: 'Get a no-obligation solar estimate for your Hawaii home.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
