"use client";  // Make sure the root layout is also a client component

import { SessionProvider } from 'next-auth/react';
import './globals.css';  // Import global styles if you have any

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
