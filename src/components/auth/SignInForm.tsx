"use client";
import Checkbox from "@/components/form/input/Checkbox";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { EyeCloseIcon, EyeIcon } from "@/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

export default function SignInForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Démo front-end : aucune authentification réelle. « Se connecter » ouvre
  // directement le tableau de bord.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/");
  };

  return (
    <div className="flex w-full flex-1 flex-col lg:w-1/2">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
        <Link href="/signin" className="mb-8 flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
            B&amp;C
          </span>
          <span className="text-lg font-bold text-gray-900">
            Beauty<span className="text-brand-500">AndCo</span>
          </span>
        </Link>

        <div className="mb-6">
          <h1 className="mb-2 text-title-sm font-semibold text-gray-800">Connexion</h1>
          <p className="text-sm text-gray-500">
            Saisissez votre adresse e-mail et votre mot de passe pour accéder au
            back-office.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <Label htmlFor="email">
                Adresse e-mail <span className="text-error-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                name="email"
                placeholder="sokhna.ndour@beautyandco.sn"
                defaultValue="sokhna.ndour@beautyandco.sn"
              />
            </div>

            <div>
              <Label htmlFor="password">
                Mot de passe <span className="text-error-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Votre mot de passe"
                  defaultValue="demo"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={
                    showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
                  }
                  className="absolute right-4 top-1/2 z-30 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeIcon className="fill-gray-500" />
                  ) : (
                    <EyeCloseIcon className="fill-gray-500" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Checkbox
                checked={rememberMe}
                onChange={setRememberMe}
                label="Rester connectée"
              />
              <Link
                href="/forgot-password"
                className="text-sm text-brand-600 hover:text-brand-700"
              >
                Mot de passe oublié&nbsp;?
              </Link>
            </div>

            <Button className="w-full" size="sm">
              Se connecter
            </Button>
          </div>
        </form>

        <p className="mt-6 text-theme-xs text-gray-400">
          Démonstration front-end — données fictives, aucune authentification
          réelle. « Se connecter » ouvre le tableau de bord.
        </p>
      </div>
    </div>
  );
}
