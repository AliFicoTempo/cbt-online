import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CBT Online Test',
  description: 'Aplikasi Ujian Online Responsif berbasis Google Spreadsheet dengan Tema Neo-Brutalism',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#FFFDF0] text-black antialiased selection:bg-[#FFE600] selection:text-black">
        {children}
      </body>
    </html>
  );
}