import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Homonyme — Back-office",
    template: "%s | Homonyme",
  },
  description:
    "Back-office Beauty & Co — démo front-end, données fictives, aucun backend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={`${poppins.className} bg-gray-50`}>
        <SidebarProvider>{children}</SidebarProvider>
      </body>
    </html>
  );
}
