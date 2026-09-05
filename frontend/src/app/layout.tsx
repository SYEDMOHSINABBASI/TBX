import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TBX Truth Engine - Financial Intelligence System',
  description: 'Financial intelligence system that verifies whether answers remain trustworthy when questions can reasonably be interpreted in different ways.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-slate-100 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
