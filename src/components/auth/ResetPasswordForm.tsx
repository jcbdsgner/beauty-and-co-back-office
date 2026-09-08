"use client";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { ChevronLeftIcon } from "@/icons";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

export default function ResetPasswordForm() {
  const router = useRouter();

  // Démo front-end : le mot de passe n'est pas réellement modifié.
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/signin");
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

        <Link
          href="/signin"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 transition-colors hover:text-gray-700"
        >
          <ChevronLeftIcon />
          Retour à la connexion
        </Link>

        <div className="mb-6">
          <h1 className="mb-2 text-title-sm font-semibold text-gray-800">
            Nouveau mot de passe
          </h1>
          <p className="text-sm text-gray-500">
            Choisissez un mot de passe que vous n&apos;utilisez nulle part
            ailleurs.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-5">
            <div>
              <Label htmlFor="password">
                Nouveau mot de passe <span className="text-error-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                name="password"
                placeholder="Au moins 12 caractères"
              />
            </div>
            <div>
              <Label htmlFor="confirm">
                Confirmer le mot de passe <span className="text-error-500">*</span>
              </Label>
              <Input
                id="confirm"
                type="password"
                name="confirm"
                placeholder="Répétez le mot de passe"
              />
            </div>
            <Button className="w-full" size="sm">
              Enregistrer le mot de passe
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
