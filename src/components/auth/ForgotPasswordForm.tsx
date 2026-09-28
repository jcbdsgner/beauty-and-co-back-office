"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";
import React, { useState } from "react";

export default function ForgotPasswordForm() {
  // Démo front-end : aucun e-mail n'est réellement envoyé.
  const [sent, setSent] = useState(false);

  return (
    <div className="flex w-full flex-1 flex-col lg:w-1/2">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
        <Link href="/signin" className="mb-8 flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
            B&amp;C
          </span>
          <span className="text-lg font-bold text-base-content">
            Beauty<span className="text-brand-500">AndCo</span>
          </span>
        </Link>

        <Link
          href="/signin"
          className="mb-4 inline-flex items-center gap-1 text-sm text-base-content/60 transition-colors hover:text-base-content/80"
        >
          <ChevronLeftIcon />
          Retour à la connexion
        </Link>

        {sent ? (
          <div>
            <h1 className="mb-2 text-title-sm font-semibold text-base-content">
              Vérifiez votre boîte mail
            </h1>
            <p className="text-sm text-base-content/60">
              Si un compte est associé à cette adresse, un lien de
              réinitialisation vient d&apos;être envoyé. Le lien expire dans une
              heure.
            </p>
            <Link
              href="/signin"
              className="mt-6 inline-block text-sm text-brand-600 hover:text-secondary"
            >
              Revenir à la connexion
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="mb-2 text-title-sm font-semibold text-base-content">
                Mot de passe oublié&nbsp;?
              </h1>
              <p className="text-sm text-base-content/60">
                Saisissez votre adresse e-mail : nous vous enverrons un lien pour
                choisir un nouveau mot de passe.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
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
                  />
                </div>
                <Button className="w-full" size="sm">
                  Envoyer le lien
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
