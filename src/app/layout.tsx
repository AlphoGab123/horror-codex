import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Horror Codex',
  description: 'A minimal horror playground',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
