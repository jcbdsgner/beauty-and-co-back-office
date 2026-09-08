"use client";

import { useState } from "react";
import PageHeader from "@/components/back-office/PageHeader";
import {
  salonClosures,
  salonConfigs,
  type SalonClosure,
  type SalonConfig,
} from "@/lib/mock/beautyandco";
import SalonsList from "./salons/SalonsList";
import SalonDetail from "./salons/SalonDetail";
import SalonForm from "./salons/SalonForm";

// Écran « Salons » — le domicile de tout ce qui décrit un salon en tant que lieu.
//
// 1. Où en est la propriétaire ? En configuration, pas dans l'urgence : elle
//    ouvre cet écran pour préparer des congés, corriger un horaire, ajouter une
//    adresse. Geste rare mais qui doit être sans ambiguïté — une erreur ici se
//    répercute sur le planning et la réservation.
// 2. Ce qui doit sauter aux yeux : la liste des salons avec leur état du jour
//    (ouvert / fermé / inactif) et leur capacité ; sur une fiche, les heures
//    d'ouverture et les fermetures à venir.
// 3. Quand ça se passe mal : on refuse de désactiver le dernier salon actif ;
//    une heure de fermeture avant l'ouverture est signalée ; une fermeture
//    programmée rappelle de vérifier les rendez-vous concernés.
//
// Cet écran n'est PAS filtré par le sélecteur de salon global : on voit toujours
// tous les salons.

type View = { kind: "list" } | { kind: "detail"; id: string } | { kind: "new" };

export default function Salons() {
  const [configs, setConfigs] = useState<SalonConfig[]>(salonConfigs);
  const [closures, setClosures] = useState<SalonClosure[]>(salonClosures);
  const [view, setView] = useState<View>({ kind: "list" });

  const activeCount = configs.filter((c) => c.active).length;

  const updateConfig = (next: SalonConfig) =>
    setConfigs((list) => list.map((c) => (c.id === next.id ? next : c)));

  const addConfig = (next: SalonConfig) => {
    setConfigs((list) => [...list, next]);
    setView({ kind: "detail", id: next.id });
  };

  const addClosure = (c: SalonClosure) => setClosures((list) => [...list, c]);
  const removeClosure = (id: string) =>
    setClosures((list) => list.filter((c) => c.id !== id));

  if (view.kind === "new") {
    return <SalonForm onCreate={addConfig} onCancel={() => setView({ kind: "list" })} />;
  }

  const selected =
    view.kind === "detail" ? configs.find((c) => c.id === view.id) ?? null : null;

  if (view.kind === "detail" && selected) {
    return (
      <SalonDetail
        config={selected}
        closures={closures}
        isLastActive={activeCount <= 1 && selected.active}
        onChange={updateConfig}
        onAddClosure={addClosure}
        onRemoveClosure={removeClosure}
        onBack={() => setView({ kind: "list" })}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Salons"
        description="Coordonnées, capacité par type de poste, heures d'ouverture et fermetures exceptionnelles de chaque salon."
      />
      <SalonsList
        configs={configs}
        closures={closures}
        onOpen={(id) => setView({ kind: "detail", id })}
        onAdd={() => setView({ kind: "new" })}
      />
    </div>
  );
}
