import type { Metadata } from 'next';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Plyce - Discover Local Restaurants',
  description: 'Find the best restaurants near you with TikTok reviews, menus, and more.',
  keywords: 'restaurants, food, dining, TikTok reviews, local eats',
  openGraph: {
    title: 'Plyce - Discover Local Restaurants',
    description: 'Find the best restaurants near you with TikTok reviews, menus, and more.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
