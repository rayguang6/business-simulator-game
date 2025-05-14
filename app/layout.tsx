// app/layout.js
import './globals.css';

export const metadata = {
  title: 'Business Tycoon Simulator',
  description: 'Build your business empire and become a tycoon!',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-['Poppins',sans-serif] antialiased h-screen">
        {children}
      </body>
    </html>
  );
}