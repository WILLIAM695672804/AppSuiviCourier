import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/ui/Avatar";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Encart } from "@/components/ui/Encart";
import { Etiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import { Pastilles } from "@/components/ui/Pastilles";
import { historiqueChampsQuery, PAS_JOURNAL } from "@/features/tracabilite/api";

/**
 * I-03 — historique des champs.
 *
 * **L'écran qui montre ce que le journal des événements ne peut pas voir.**
 *
 * Les deux tables sont alimentées par des chemins indépendants : `evenement`
 * par le code applicatif, `champ_historique` par un déclencheur PostgreSQL. Une
 * modification faite en SQL direct — correction en base, script de reprise,
 * intervention d'un prestataire — laisse une ligne ici et **aucune** là-bas.
 *
 * D'où le drapeau « hors application », qui est la raison d'être de l'onglet :
 * une valeur qui a changé sans qu'aucun événement ne l'explique est ce qu'un
 * auditeur cherche en premier. Un écran qui se serait contenté de lister les
 * changements par ordre chronologique aurait noyé ces lignes-là parmi les
 * autres, et l'onglet n'aurait rien apporté au journal des événements.
 *
 * Le nom des colonnes n'est pas traduit. Un dictionnaire de plusieurs centaines
 * d'entrées aurait été inventé pour l'essentiel, et l'auditeur qui recoupe avec
 * la base veut `date_echeance`, pas « Échéance ».
 */
const ENTETE = "text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase";

const GRILLE =
  "grid grid-cols-[122px_minmax(0,1fr)_minmax(0,1.5fr)_150px_110px] items-center gap-3";

export function OngletHistorique() {
  const [table, setTable] = useState("Toutes");
  const [isolees, setIsolees] = useState(false);
  const [limite, setLimite] = useState(PAS_JOURNAL);

  const { data } = useQuery(historiqueChampsQuery(table, isolees, limite));
  const modifications = data?.modifications ?? [];

  // Le sélecteur ne propose que les tables qui ont quelque chose à montrer,
  // plus celle qui est déjà choisie. Lister les douze tables tracées dont dix
  // sont vides ferait chercher longtemps avant de comprendre qu'il n'y a rien.
  const options = [
    "Toutes",
    ...(data?.tables ?? [])
      .filter((t) => t.modifications > 0 || t.cle === table)
      .map((t) => t.libelle),
  ];

  const libelleVersCle = new Map((data?.tables ?? []).map((t) => [t.libelle, t.cle]));

  return (
    <div className="flex flex-col gap-3.5">
      <Carte>
        <Encart ton="accent" icone="aide">
          Ce journal n'est pas alimenté par l'application, mais par la base elle-même : toute
          modification y figure, <strong>y compris celles faites hors de l'application</strong> —
          correction en base, script de reprise, intervention d'un prestataire. Une ligne signalée «
          hors application » est une valeur qui a changé sans qu'aucune action de l'application ne
          l'explique.
        </Encart>
      </Carte>

      {(data?.horsApplication ?? 0) > 0 && (
        <Carte>
          <div className="flex flex-wrap items-center gap-3.5">
            <span className="grid size-[34px] flex-none place-items-center bg-danger-voile text-danger">
              <Icone nom="bouclier" taille={16} epaisseur={1.7} />
            </span>
            <div className="flex min-w-[220px] flex-1 flex-col gap-1">
              <span className="text-[12.5px] leading-none font-bold text-encre">
                {data?.horsApplication} modification
                {(data?.horsApplication ?? 0) > 1 ? "s" : ""} sans événement correspondant
              </span>
              <span className="text-[11.5px] leading-[1.4] font-medium text-encre-faible">
                Parmi les lignes affichées. Ce sont celles qu'aucune action de l'application
                n'explique.
              </span>
            </div>
            <Bouton variante="principal" onClick={() => setIsolees(true)}>
              Ne voir que celles-là
            </Bouton>
          </div>
        </Carte>
      )}

      <Carte>
        <div className="flex flex-wrap items-center gap-3.5">
          <Pastilles
            actif={table === "Toutes" ? "Toutes" : (libelleDe(data?.tables, table) ?? "Toutes")}
            options={options}
            onChange={(choix) =>
              setTable(choix === "Toutes" ? "Toutes" : (libelleVersCle.get(choix) ?? "Toutes"))
            }
            libelle="Filtrer par objet"
          />
          <Bouton variante={isolees ? "principal" : "doux"} onClick={() => setIsolees(!isolees)}>
            {isolees ? "Voir toutes les modifications" : "Hors application seulement"}
          </Bouton>
        </div>

        <div className="mt-3.5 overflow-x-auto">
          <div className="min-w-[900px]">
            <div className={`${GRILLE} border-y border-bordure bg-surface-tete py-2.5`}>
              {["Horodatage", "Objet", "Champ et valeurs", "Auteur", "Origine"].map((t) => (
                <span key={t} className={ENTETE}>
                  {t}
                </span>
              ))}
            </div>

            {modifications.map((ligne) => (
              <div
                key={ligne.id}
                className={`${GRILLE} border-b border-separateur py-3 ${
                  ligne.horsApplication ? "bg-danger-voile/40" : ""
                }`}
              >
                <span className="flex flex-col gap-1">
                  <span className="text-xs leading-none font-semibold text-encre tabular-nums">
                    {ligne.heure}
                  </span>
                  <span className="text-[10.5px] leading-none font-medium text-encre-tenue tabular-nums">
                    {ligne.date}
                  </span>
                </span>

                <span className="flex min-w-0 flex-col gap-1">
                  <span className="truncate text-[12px] leading-none font-semibold text-encre">
                    {ligne.tableLibelle}
                  </span>
                  <span className="truncate font-mono text-[10.5px] leading-none text-encre-tenue">
                    {ligne.table} #{ligne.ligneId}
                  </span>
                </span>

                <span className="flex min-w-0 flex-col gap-1.5">
                  <span className="truncate font-mono text-[11px] leading-none font-semibold text-encre-moyenne">
                    {ligne.colonne}
                  </span>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="truncate text-[11.5px] leading-none font-medium text-encre-tenue line-through">
                      {ligne.avant}
                    </span>
                    <Icone nom="chevronDroite" taille={12} epaisseur={1.7} />
                    <span className="truncate text-[11.5px] leading-none font-semibold text-encre">
                      {ligne.apres}
                    </span>
                  </span>
                </span>

                <span className="flex min-w-0 items-center gap-2">
                  <Avatar initiales={ligne.initiales} taille="petit" />
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="truncate text-[11.5px] leading-none font-semibold text-encre">
                      {ligne.auteur}
                    </span>
                    <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
                      {ligne.poste}
                    </span>
                  </span>
                </span>

                <span className="justify-self-start">
                  <Etiquette ton={ligne.horsApplication ? "danger" : "neutre"}>
                    {ligne.horsApplication ? "Hors application" : "Application"}
                  </Etiquette>
                </span>
              </div>
            ))}

            {modifications.length === 0 && (
              <p className="py-6 text-center text-[12px] leading-[1.5] font-medium text-encre-tenue">
                Aucune modification enregistrée pour ce filtre. Les tables tracées le sont par
                déclencheur : une liste vide signifie que rien n'a changé, pas que rien n'est suivi.
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-3.5">
              <Bouton
                onClick={() => setLimite((actuelle) => actuelle + PAS_JOURNAL)}
                disabled={modifications.length < limite}
              >
                Charger {PAS_JOURNAL} modifications de plus
              </Bouton>
              <span className="text-[11px] leading-[1.5] font-medium text-encre-tenue">
                Cet historique est alimenté par la base et ne peut être modifié depuis l'application
                — pas même par un administrateur.
              </span>
            </div>
          </div>
        </div>
      </Carte>
    </div>
  );
}

/** Le libellé d'affichage d'une clé de table, ou `null` si elle est inconnue. */
function libelleDe(
  tables: { cle: string; libelle: string }[] | undefined,
  cle: string,
): string | null {
  return tables?.find((t) => t.cle === cle)?.libelle ?? null;
}
