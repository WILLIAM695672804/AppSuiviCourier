import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { Carte } from "@/components/ui/Carte";
import { Liste } from "@/components/ui/Champ";
import { Encart } from "@/components/ui/Encart";
import { EtatChargement } from "@/components/ui/EtatChargement";
import { Feu } from "@/components/ui/Feu";
import { Icone } from "@/components/ui/Icone";
import {
  adresseExport,
  rapportQuery,
  type ChoixRapport,
  type Granularite,
} from "@/features/pilotage/apiRapports";

/**
 * D-03 — rapports périodiques.
 *
 * L'écran ne ressemble pas à un tableau de bord, et c'est voulu : c'est un
 * **document**. Il porte son périmètre, sa période, sa comparaison, la date
 * d'édition et le nom de qui l'édite — parce qu'un rapport se transmet, et
 * qu'un tableau de chiffres sans en-tête ne se relit pas trois mois plus tard.
 *
 * Trois choses que le serveur commande et que l'écran se contente d'afficher :
 *
 * 1. **La période est close.** Demander le trimestre en cours renvoie le
 *    précédent, et le bandeau le dit. Sans ce message, l'agent croirait à un
 *    bogue d'affichage.
 * 2. **Le périmètre suit la portée.** `peutVoirInstitution` décide si le
 *    sélecteur propose autre chose que sa structure : proposer « institution »
 *    pour rendre une seule structure aurait été un mensonge d'affichage.
 * 3. **« Non mesuré » n'est pas zéro** (ADR 011). La section courrier est
 *    servie vide avec sa raison plutôt qu'omise — un rapport à quatre sections
 *    chez l'un et cinq chez l'autre se lit comme une panne.
 *
 * L'export est un lien, pas un bouton qui fabrique un fichier : le CSV vient du
 * serveur, qui trace la sortie de données au journal des accès (§3.12).
 */
const GRANULARITES: { valeur: Granularite; libelle: string }[] = [
  { valeur: "mois", libelle: "Mensuel" },
  { valeur: "trimestre", libelle: "Trimestriel" },
  { valeur: "semestre", libelle: "Semestriel" },
  { valeur: "annee", libelle: "Annuel" },
];

/** Les rangs proposés pour chaque granularité — le serveur borne, l'écran guide. */
const RANGS: Record<Granularite, { valeur: string; libelle: string }[]> = {
  mois: [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ].map((libelle, index) => ({ valeur: String(index + 1), libelle })),
  trimestre: [1, 2, 3, 4].map((n) => ({
    valeur: String(n),
    libelle: `${n === 1 ? "1er" : `${n}e`} trimestre`,
  })),
  semestre: [1, 2].map((n) => ({
    valeur: String(n),
    libelle: `${n === 1 ? "1er" : "2e"} semestre`,
  })),
  annee: [{ valeur: "1", libelle: "Exercice entier" }],
};

const ANNEES = [2026, 2025, 2024].map((n) => ({ valeur: String(n), libelle: `Année ${n}` }));

export function Rapports() {
  const [choix, setChoix] = useState<ChoixRapport>({
    periode: "mois",
    // Vides au premier chargement : le serveur rend alors la dernière période
    // close, qui est le rapport qu'on vient chercher neuf fois sur dix.
    annee: "",
    rang: "",
    structure: "",
    perimetre: "institution",
  });

  const { data, isPending } = useQuery(rapportQuery(choix));

  const modifier = (champ: keyof ChoixRapport, valeur: string) =>
    setChoix((precedent) => ({ ...precedent, [champ]: valeur }) as ChoixRapport);

  return (
    <>
      <EnTetePage
        titre="Rapports périodiques"
        sousTitre={data ? `${data.perimetreLibelle} — ${data.periode.libelle}` : undefined}
        actions={
          // Un lien et non un bouton : c'est le serveur qui sert le fichier et
          // le nomme, et c'est lui qui inscrit la sortie au journal des accès.
          // Le même choix que pour le contenu d'une pièce jointe.
          <a
            href={adresseExport(choix)}
            className="inline-flex items-center gap-[7px] rounded-none border border-bordure-forte px-3 py-2 text-xs leading-none font-semibold text-encre-douce transition-colors duration-150 hover:bg-surface-douce"
          >
            <Icone nom="exporter" taille={14} epaisseur={1.6} />
            Exporter en CSV
          </a>
        }
      />

      <div className="flex flex-none flex-wrap items-end gap-3 border-b border-bordure px-[26px] py-3">
        <Liste
          libelle="Périodicité"
          options={GRANULARITES.map((g) => ({ valeur: g.valeur, libelle: g.libelle }))}
          value={choix.periode}
          onChange={(e) =>
            setChoix((p) => ({ ...p, periode: e.target.value as Granularite, rang: "" }))
          }
          className="w-44"
        />
        <Liste
          libelle="Année"
          invite="Dernière close"
          options={ANNEES}
          value={choix.annee}
          onChange={(e) => modifier("annee", e.target.value)}
          className="w-40"
        />
        <Liste
          libelle="Période"
          invite="Dernière close"
          options={RANGS[choix.periode]}
          value={choix.rang}
          onChange={(e) => modifier("rang", e.target.value)}
          className="w-48"
        />
        {data?.peutVoirInstitution && (
          <Liste
            libelle="Périmètre"
            options={[
              { valeur: "institution", libelle: "Ensemble de l'institution" },
              { valeur: "structure", libelle: "Une structure" },
            ]}
            value={choix.perimetre}
            onChange={(e) => modifier("perimetre", e.target.value)}
            className="w-56"
          />
        )}
        {data && choix.perimetre === "structure" && (
          <Liste
            libelle="Structure"
            invite="La mienne"
            options={data.structuresAccessibles.map((s) => ({
              valeur: s.sigle,
              libelle: `${s.sigle} — ${s.libelle}`,
            }))}
            value={choix.structure}
            onChange={(e) => modifier("structure", e.target.value)}
            className="w-64"
          />
        )}
      </div>

      <div className="flex-1 overflow-y-auto bg-fond px-[26px] pt-5 pb-[30px]">
        {isPending && !data && <EtatChargement />}

        {data && (
          <div className="flex flex-col gap-4">
            {data.periodeRamenee && (
              <Encart ton="alerte" icone="horloge">
                La période demandée n'est pas terminée : un rapport ne se clôt qu'une fois la
                période écoulée. Voici {data.periode.libelle.toLowerCase()}, la dernière close.
              </Encart>
            )}

            <Carte titre="En-tête du rapport">
              <dl className="mt-3.5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { terme: "Périmètre", definition: data.perimetreLibelle },
                  {
                    terme: "Période couverte",
                    definition: `${data.periode.libelle} (du ${data.periode.debut} au ${data.periode.fin})`,
                  },
                  { terme: "Comparée à", definition: data.comparaison },
                  { terme: "Édité", definition: `le ${data.editeLe} par ${data.editePar}` },
                ].map((ligne) => (
                  <div key={ligne.terme}>
                    <dt className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase">
                      {ligne.terme}
                    </dt>
                    <dd className="mt-1.5 text-[12.5px] leading-[1.4] font-medium text-encre">
                      {ligne.definition}
                    </dd>
                  </div>
                ))}
              </dl>
            </Carte>

            {data.sections.map((section) => (
              <Carte key={section.titre} titre={section.titre}>
                <div className="mt-3.5 overflow-x-auto">
                  <div className="min-w-[620px]">
                    <div className="grid grid-cols-[minmax(220px,1.4fr)_140px_120px_minmax(200px,1fr)] items-center gap-2.5 border-y border-bordure bg-surface-tete py-2.5">
                      {["Indicateur", "Valeur", "Évolution", "Précision"].map((titre) => (
                        <span
                          key={titre}
                          className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
                        >
                          {titre}
                        </span>
                      ))}
                    </div>

                    {section.lignes.map((ligne) => (
                      <div
                        key={ligne.libelle}
                        className="grid grid-cols-[minmax(220px,1.4fr)_140px_120px_minmax(200px,1fr)] items-center gap-2.5 border-b border-bordure py-2.5"
                      >
                        <span className="text-[12.5px] leading-[1.35] font-medium text-encre">
                          {ligne.libelle}
                        </span>
                        <span className="flex items-center gap-2">
                          <Feu niveau={ligne.feu} muet />
                          <span className="text-[12.5px] leading-none font-semibold text-encre">
                            {ligne.valeur}
                          </span>
                        </span>
                        {/* Un tiret plutôt qu'une case vide : l'absence de
                            comparaison est une information, pas un oubli de
                            rendu. */}
                        <span className="text-[12px] leading-none font-medium text-encre-tenue">
                          {ligne.variation ?? "—"}
                        </span>
                        <span className="text-[11.5px] leading-[1.4] text-encre-tenue">
                          {ligne.note}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </Carte>
            ))}

            {data.nonMesure.length > 0 && (
              <Encart ton="accent" icone="aide">
                Ce rapport ne mesure pas encore :{" "}
                {data.nonMesure.map((mesure) => `${mesure.libelle} — ${mesure.raison}`).join(" ")}
              </Encart>
            )}
          </div>
        )}
      </div>
    </>
  );
}
