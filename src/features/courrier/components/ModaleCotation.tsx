import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bouton } from "@/components/ui/Bouton";
import { MarqueCase } from "@/components/ui/CaseACocher";
import { CaseLibellee } from "@/components/ui/CaseLibellee";
import { Etiqueteur, Liste } from "@/components/ui/Champ";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import { Modale } from "@/components/ui/Modale";
import { SelecteurSegments } from "@/components/ui/SelecteurSegments";
import { useCoter } from "@/features/courrier/api";
import { usePermission } from "@/lib/contexteSession";
import { structuresQuery } from "@/lib/referentiel";
import { PERMISSIONS } from "@/types/habilitation";
import type { CourrierDetail } from "@/types/courrier";

/**
 * A-04 — cotation d'un courrier.
 *
 * Deux regles de l'institution sont portees ici, et nulle part ailleurs :
 *
 * 1. L'ordre des structures compte. La premiere cochee est le chef de file :
 *    c'est elle qui coordonne et centralise la reponse, et c'est a elle que
 *    les relances s'adressent. L'interface le montre au lieu de le supposer.
 *
 * 2. Celui qui decide n'est pas toujours celui qui saisit. Le DG cote sur le
 *    papier, l'agent de session enregistre. Quand l'agent agit par delegation,
 *    il doit designer l'autorite : les deux noms sont conserves.
 */
const MODES = [
  { valeur: "CASCADE", libelle: "Cascade" },
  { valeur: "PARALLELE", libelle: "Parallèle" },
] as const;

const EXPLICATION_MODE = {
  CASCADE:
    "Les structures traitent l'une après l'autre, dans l'ordre choisi. Le courrier n'avance qu'une fois l'étape précédente rendue.",
  PARALLELE:
    "Toutes les structures reçoivent le courrier en même temps. Le chef de file centralise les contributions.",
} as const;

const DELAIS = [
  { valeur: "3", libelle: "3 j" },
  { valeur: "5", libelle: "5 j" },
  { valeur: "10", libelle: "10 j" },
] as const;

export function ModaleCotation({
  courrier,
  ouverte,
  onFermer,
}: {
  courrier: CourrierDetail;
  ouverte: boolean;
  onFermer: () => void;
}) {
  const { data: structures = [] } = useQuery(structuresQuery());
  const coter = useCoter(courrier.id);

  // Cote de plein droit, ou pour le compte d'une autorite ?
  const coteEnPropre = usePermission(PERMISSIONS.COT);

  const [mode, setMode] = useState<"CASCADE" | "PARALLELE">("CASCADE");
  const [choisies, setChoisies] = useState<number[]>([]);
  const [delaiJours, setDelaiJours] = useState(5);
  const [instruction, setInstruction] = useState("");
  const [decideParId, setDecideParId] = useState("");
  const [notifier, setNotifier] = useState(true);
  const [bordereau, setBordereau] = useState(true);

  function basculer(id: number) {
    // L'ordre de selection fait foi : on ajoute a la fin, on retire en place.
    setChoisies((precedentes) =>
      precedentes.includes(id) ? precedentes.filter((x) => x !== id) : [...precedentes, id],
    );
  }

  const chefDeFile = structures.find((s) => s.id === choisies[0]);
  const decideurManquant = !coteEnPropre && !decideParId;
  const valide = choisies.length > 0 && !decideurManquant && !coter.isPending;

  async function valider() {
    await coter.mutateAsync({
      mentionTypeId: null,
      annotation: instruction,
      delaiFixe: null,
      decideParId: coteEnPropre ? 0 : Number(decideParId),
      decideLe: new Date().toISOString(),
      structureIds: choisies,
    });
    onFermer();
  }

  return (
    <Modale
      ouverte={ouverte}
      onFermer={onFermer}
      titre="Coter le courrier"
      sousTitre={`${courrier.numero} · ${courrier.objet}`}
      piedGauche={
        choisies.length === 0
          ? "Choisissez au moins une structure."
          : `${choisies.length} structure${choisies.length > 1 ? "s" : ""} · chef de file ${chefDeFile?.sigle ?? "—"} · délai ${delaiJours} jours`
      }
      actions={
        <>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          <Bouton variante="principal" onClick={valider} disabled={!valide}>
            {coter.isPending ? "Cotation…" : "Coter le courrier"}
          </Bouton>
        </>
      }
    >
      <div className="flex flex-col gap-[17px]">
        <Etiqueteur libelle="Mode de cotation" aide={EXPLICATION_MODE[mode]}>
          <SelecteurSegments
            libelle="Mode de cotation"
            pleineLargeur
            options={MODES}
            valeur={mode}
            onChange={setMode}
          />
        </Etiqueteur>

        <div className="flex flex-col gap-[9px]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] leading-none font-semibold text-encre-faible">
              Structures destinataires
            </span>
            <span className="text-[11px] leading-none font-semibold text-encre-tenue">
              {choisies.length} sélectionnée{choisies.length > 1 ? "s" : ""}
            </span>
          </div>

          {structures.map((structure) => {
            const rang = choisies.indexOf(structure.id);
            const cochee = rang >= 0;

            return (
              <button
                key={structure.id}
                type="button"
                role="checkbox"
                aria-checked={cochee}
                aria-label={`Coter à ${structure.libelle}`}
                onClick={() => basculer(structure.id)}
                className={`flex items-center gap-[11px] rounded-none border px-3 py-[11px] text-left transition-colors duration-150 ${
                  cochee
                    ? "border-accent-trait bg-[#f8faff]"
                    : "border-bordure hover:bg-surface-douce"
                }`}
              >
                <MarqueCase cochee={cochee} />
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                  <span className="flex items-center gap-2">
                    <span className="truncate text-[12.5px] leading-none font-semibold text-encre">
                      {structure.libelle}
                    </span>
                    {rang === 0 && <Etiquette ton="accent">Chef de file</Etiquette>}
                  </span>
                  <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                    {[
                      structure.responsable,
                      structure.delaiMoyenJours &&
                        `délai moyen ${structure.delaiMoyenJours.toLocaleString("fr-FR")} j`,
                      `${structure.courriersEnCours} courriers en cours`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                {/* En cascade, le rang est l'ordre de passage : il doit se lire. */}
                {cochee && mode === "CASCADE" && (
                  <span className="grid size-5 flex-none place-items-center rounded-none bg-accent-voile text-[10px] leading-none font-bold text-accent-fonce">
                    {rang + 1}
                  </span>
                )}
              </button>
            );
          })}

          {choisies.length > 1 && (
            <Encart ton="accent" icone="personnes">
              <strong className="font-bold">{chefDeFile?.libelle}</strong> est chef de file : elle
              coordonne et centralise la réponse. Les relances lui seront adressées.
            </Encart>
          )}
        </div>

        <Etiqueteur
          libelle="Délai imparti"
          aide={`Échéance calculée en jours ouvrés : ${delaiJours} jours après la cotation.`}
        >
          <SelecteurSegments
            libelle="Délai imparti"
            options={DELAIS}
            valeur={String(delaiJours)}
            onChange={(v) => setDelaiJours(Number(v))}
          />
        </Etiqueteur>

        <Etiqueteur libelle="Instruction portée sur la cotation">
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={3}
            placeholder="Vérifier la conformité des pièces avant admission au paiement."
            className="min-h-[70px] w-full resize-y rounded-none border border-bordure-forte px-3 py-3 text-xs leading-[1.6] font-medium text-encre-moyenne outline-none transition-colors duration-150 placeholder:text-encre-tenue focus:border-accent"
          />
        </Etiqueteur>

        {!coteEnPropre && (
          <Liste
            libelle="Cotation décidée par"
            invite="Désigner l'autorité…"
            options={structures
              .filter((s) => s.responsable)
              .map((s) => ({ valeur: String(s.id), libelle: `${s.responsable} — ${s.sigle}` }))}
            value={decideParId}
            onChange={(e) => setDecideParId(e.target.value)}
            erreur={decideurManquant ? "La cotation engage une autorité : désignez-la." : undefined}
            aide="Vous saisissez pour le compte de cette autorité. Les deux noms sont conservés."
          />
        )}

        <div className="flex flex-col gap-[9px]">
          <CaseLibellee
            cochee={notifier}
            onChange={setNotifier}
            libelle="Notifier les responsables des structures"
          />
          <CaseLibellee
            cochee={bordereau}
            onChange={setBordereau}
            libelle="Inscrire au bordereau de transmission du papier"
          />
        </div>

        {coter.isError && (
          <Encart ton="danger" icone="aide">
            {coter.error instanceof Error ? coter.error.message : "La cotation a échoué."}
          </Encart>
        )}
      </div>
    </Modale>
  );
}
