"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/atoms/button";
import { FieldLabel } from "@/components/ui/atoms/field-label";
import { TextInput } from "@/components/ui/atoms/text-input";

/**
 * Écran de connexion — copie de l'écran de verrouillage de point-de-vente
 * (`components/shell/lock-screen.tsx`, 2026-09-28) : photo plein écran, logo en
 * haut à gauche, carte blanche à droite. Écarts : pas de choix de ville
 * (Dakar / Abidjan), pas de fond de caisse (pas de caisse ici), et « Mot de
 * passe oublié ? » mène au vrai parcours `/forgot-password` au lieu d'un toast.
 * Démo : n'importe quelle adresse e-mail et mot de passe suffisent.
 */
export default function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="relative flex h-screen w-screen items-center justify-end overflow-hidden bg-base-200">
      <Image
        src="/images/connexion/lock-screen-spa.jpg"
        alt=""
        fill
        sizes="100vw"
        priority
        className="object-cover"
      />

      <div className="absolute left-10 top-10 h-16 w-16 shrink-0 overflow-hidden rounded-box shadow-lg">
        <Image
          src="/images/logo/beautyandco-mark.jpg"
          alt="Beauty and Co"
          width={1200}
          height={1197}
          priority
          className="h-full w-full object-contain"
        />
      </div>

      <div className="relative z-10 mr-[clamp(2.5rem,17%,20rem)] flex w-full max-w-[540px] flex-col gap-8 rounded-box bg-base-100 px-10 py-11 shadow-2xl">
        <div>
          <p className="text-base text-base-content/70">
            Bienvenue chez <span className="font-semibold text-primary">Beauty and Co</span>
          </p>
          <h1 className="mt-1 font-heading text-4xl font-semibold text-base-content">Connexion</h1>
        </div>

        <form
          className="flex flex-col gap-5 pt-4"
          onSubmit={(e) => {
            e.preventDefault();
            router.replace("/");
          }}
        >
          <div>
            <FieldLabel variant="plain" htmlFor="signin-email" className="mb-2">
              Adresse e-mail
            </FieldLabel>
            <TextInput
              id="signin-email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="vous@beautyandco.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <FieldLabel variant="plain" htmlFor="signin-password" className="mb-2">
              Mot de passe
            </FieldLabel>
            <div className="relative">
              <TextInput
                id="signin-password"
                type={revealed ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-11"
              />
              <button
                type="button"
                onClick={() => setRevealed((r) => !r)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 transition hover:text-base-content/70"
                aria-label={revealed ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <div className="mt-2 flex justify-end">
              <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          <div className="mt-2 flex justify-end">
            <Button
              type="submit"
              variant="brand"
              size="xl"
              className="shadow-[0px_4px_19px_rgba(136,102,102,0.35)]"
              disabled={!email || !password}
            >
              Se connecter
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
