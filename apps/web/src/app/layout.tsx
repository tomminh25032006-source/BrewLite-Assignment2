import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BrewLite | Đặt Cà Phê Không Dùng Tiền Mặt',
  description: 'BrewLite giúp khách hàng đặt và thanh toán đồ uống không dùng tiền mặt chỉ trong vài chạm, giảm thời gian xếp hàng và nhận đơn nhanh tại quầy.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    title: 'BrewLite',
    statusBarStyle: 'default',
  },
};

// Mobile-first / PWA
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#92400E',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased selection:bg-amber-200 selection:text-amber-900">
        {children}
      </body>
    </html>
  );
}
