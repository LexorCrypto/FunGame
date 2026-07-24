import './globals.css';

export const metadata = {
  title: 'PISSUARIUS — аркада в стиле 80-х',
  description: 'Pissuarius arcade landing page.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
