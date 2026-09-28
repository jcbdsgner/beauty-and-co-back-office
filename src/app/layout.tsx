import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from '@/context/SidebarContext';

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  // Exposée en variable CSS pour `--font-heading` / `--font-sans` (composants
  // repris de point-de-vente), en plus de la classe posée sur <body>.
  variable: "--font-poppins",
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
    <html lang="fr" className={`${poppins.variable} antialiased`}>
      <body className={`${poppins.className} bg-base-200`}>
        <SidebarProvider>{children}</SidebarProvider>
      </body>
    </html>
  );
}
