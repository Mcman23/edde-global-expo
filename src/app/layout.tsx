import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'EDDE Global Expo | Your Future Has No Borders',
  description: 'Interactive international education expo journey by EDDE Global. Explore top study destinations, match your profile, and unlock exclusive benefits.',
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#53226C',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} font-sans antialiased`}>
      <body className="bg-[#faf7fb] text-edde-dark min-h-screen flex flex-col selection:bg-edde-yellow selection:text-edde-dark">
        {children}
      </body>
    </html>
  );
}
