import './globals.css';

export const metadata = {
  title: 'Afterglow — 마음을 밤하늘에',
  description: '전하고 싶은 말을 불꽃에 담아 밤하늘에 피워 보세요.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#090b21',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Noto+Sans+KR:wght@400;500;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
