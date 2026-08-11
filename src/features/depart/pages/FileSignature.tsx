import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { Avatar } from "@/components/ui/Avatar";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { MarqueCase } from "@/components/ui/CaseACocher";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import { SelecteurSegments } from "@/components/ui/SelecteurSegments";
import { fileSignatureQuery, useSigner } from "@/features/depart/api";
import { ChaineVisas } from "@/features/depart/components/ChaineVisas";

/**
 * B-04 — file de signature.
 *
 * Le signataire traite un lot, pas un courrier : c'est ainsi que travaille un
 * directeur general qui signe vingt parapheurs en fin de journee. La liste
 * montre donc l'essentiel — objet, destinataire, redacteur, visas — et le
 * detail reste a un clic.
 *
 * Le panneau de droite enonce ce que la signature declenche. Une signature
 * n'est pas un enregistrement : elle attribue le numero, ouvre le bordereau
 * et peut cloturer le courrier arrive lie. Cela doit etre lu avant, pas
 * decouvert apres.
 */
const MODES = [
  { valeur: "ELECTRONIQUE", libelle: "Électronique" },
  { valeur: "MANUSCRITE", libelle: "Manuscrite" },
] as const;

const EFFETS = [
  "Attribution du numéro de départ définitif",
  "Inscription au bordereau de remise au coursier",
  "Notification du rédacteur et de sa structure",
  "Clôture du courrier arrivé lié, le cas échéant",
];

export function FileSignature() {
  const naviguer = useNavigate();
  const { data } = useQuery(fileSignatureQuery());
  const signer = useSigner();

  const [choisis, setChoisis] = useState<Set<number>>(new Set());
  const [mode, setMode] = useState<(typeof MODES)[number]["valeur"]>("ELECTRONIQUE");

  const lignes = data?.lignes ?? [];

  function basculer(id: number) {
    setChoisis((precedents) => {
      const suivants = new Set(precedents);
      if (suivants.has(id)) suivants.delete(id);
      else suivants.add(id);
      return suivants;
    });
  }

  async function valider() {
    await signer.mutateAsync({ departIds: [...choisis], mode });
    setChoisis(new Set());
  }

  return (
    <>
      <EnTetePage
        titre="File de signature"
        miettes={[
          { libelle: "Courriers départ", chemin: "/courriers/departs" },
          { libelle: "File de signature" },
        ]}
        actions={
          <Bouton
            variante="principal"
            icone="coche"
            onClick={valider}
            disabled={choisis.size === 0 || signer.isPending}
          >
            {signer.isPending ? "Signature…" : `Signer (${choisis.size})`}
          </Bouton>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond px-[26px] pt-5 pb-[30px]">
        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_336px]">
          <Carte
            titre="Courriers à signer"
            aDroite={
              <button
                type="button"
                onClick={() =>
                  setChoisis(choisis.size === lignes.length ? new Set() : new Set(lignes.map((l) => l.id)))
                }
                className="text-[11.5px] leading-none font-bold text-accent hover:text-accent-fonce"
              >
                {choisis.size === lignes.length ? "Tout décocher" : "Tout sélectionner"}
              </button>
            }
          >
            <p className="mt-2 text-[11.5px] leading-none font-medium text-encre-tenue">
              {lignes.length} courriers visés en attente
            </p>

            <div className="mt-3.5 flex flex-col gap-2.5">
              {lignes.map((depart) => (
                <button
                  key={depart.id}
                  type="button"
                  role="checkbox"
                  aria-checked={choisis.has(depart.id)}
                  onClick={() => basculer(depart.id)}
                  className={`flex items-center gap-3 rounded-none border px-3.5 py-3 text-left transition-colors duration-150 ${
                    choisis.has(depart.id)
                      ? "border-accent-trait bg-[#f8faff]"
                      : "border-bordure hover:bg-surface-douce"
                  }`}
                >
                  <MarqueCase cochee={choisis.has(depart.id)} />

                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="truncate text-[12.5px] leading-none font-bold text-encre">
                      {depart.objet}
                    </span>
                    <span className="truncate text-[11px] leading-none font-medium text-encre-faible">
                      {depart.destinataire} · {depart.redacteur} · {depart.structure}
                    </span>
                  </span>

                  <ChaineVisas visas={depart.visas} />

                  {depart.horsDelai ? (
                    <Etiquette ton="danger">Hors délai</Etiquette>
                  ) : depart.priorite !== "NORMALE" ? (
                    <Etiquette ton="alerte">Urgent</Etiquette>
                  ) : (
                    <Etiquette ton="neutre">Normal</Etiquette>
                  )}
                </button>
              ))}

              {lignes.length === 0 && (
                <p className="py-8 text-center text-[12.5px] font-medium text-encre-tenue">
                  Aucun courrier n'attend votre signature.
                </p>
              )}
            </div>
          </Carte>

          <div className="flex min-w-0 flex-col gap-4">
            <Carte titre="Signataire">
              {data && (
                <div className="mt-3.5 flex items-center gap-2.5">
                  <Avatar initiales={data.signataire.initiales} taille="grand" />
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-[12.5px] leading-none font-bold text-encre">
                      {data.signataire.nomComplet}
                    </span>
                    <span className="truncate text-[11px] leading-none font-medium text-encre-faible">
                      {data.signataire.fonction}
                    </span>
                  </span>
                </div>
              )}
            </Carte>

            <Carte titre="Mode de signature">
              <div className="mt-3.5 flex flex-col gap-2.5">
                <SelecteurSegments
                  libelle="Mode de signature"
                  pleineLargeur
                  options={MODES}
                  valeur={mode}
                  onChange={setMode}
                />
                {mode === "ELECTRONIQUE" && data && (
                  <span className="flex items-center gap-2 text-[11px] leading-none font-medium text-encre-tenue">
                    <Icone nom="coche" taille={12} className="text-succes" />
                    Spécimen enregistré · {data.signataire.nomComplet}
                  </span>
                )}
              </div>
            </Carte>

            <Carte titre="Ce que la signature déclenche">
              <ul className="mt-3.5 flex flex-col gap-2.5">
                {EFFETS.map((effet) => (
                  <li key={effet} className="flex items-start gap-2">
                    <Icone
                      nom="chevronDroite"
                      taille={12}
                      className="mt-px flex-none text-encre-tenue"
                    />
                    <span className="text-[11.5px] leading-[1.5] font-medium text-encre-moyenne">
                      {effet}
                    </span>
                  </li>
                ))}
              </ul>
            </Carte>

            {signer.isSuccess && (
              <Carte>
                <Encart ton="succes" icone="coche">
                  Signature enregistrée. Les numéros de départ ont été attribués.
                </Encart>
                <Bouton
                  variante="doux"
                  className="mt-3 w-full justify-center"
                  onClick={() => naviguer("/courriers/departs/bordereau/BD-2026-0074")}
                >
                  Ouvrir le bordereau
                </Bouton>
              </Carte>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
