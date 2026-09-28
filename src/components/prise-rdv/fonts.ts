import { Prata } from "next/font/google";
import localFont from "next/font/local";

/** Les trois familles du site b&co, chargées pour le seul parcours de prise de rendez-vous (ADR 0032). */
const cabinetGrotesk = localFont({
  src: "./fonts/CabinetGrotesk-Variable.woff2",
  variable: "--font-cabinet-grotesk",
  weight: "100 900",
});

const prata = Prata({
  variable: "--font-prata",
  weight: "400",
  subsets: ["latin"],
});

const benedict = localFont({
  src: "./fonts/Benedict-Regular.otf",
  variable: "--font-benedict",
});

export const bcoFontVariables = `${cabinetGrotesk.variable} ${prata.variable} ${benedict.variable}`;
