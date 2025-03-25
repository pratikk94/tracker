'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { Providers } from './providers';
import RouteChangeLoader from './components/RouteChangeLoader';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          <RouteChangeLoader />
          {children}
        </Providers>
      </body>
    </html>
  );
}