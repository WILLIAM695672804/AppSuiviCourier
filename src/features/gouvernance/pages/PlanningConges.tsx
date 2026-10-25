import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { Avatar } from "@/components/ui/Avatar";
import { BandeauCompteurs } from "@/components/ui/BandeauCompteurs";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Encart } from "@/components/ui/Encart";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { PiedGraphe } from "@/components/ui/PiedGraphe";
import { SelecteurPeriode } from "@/components/ui/SelecteurPeriode";
import {
  ModaleArbitrerPeriode,
  ModaleOuvrirDroit,
  ModalePlanifierPeriode,
} from "@/features/gouvernance/components/ModalesConges";
import {
  planningCongesQuery,
  type EtatConge,
} from "@/features/gouvernance/api";
import { formaterDate } from "@/lib/format";
import { periodeCourante, type Periode } from "@/lib/periode";

/**
 * Planning annuel des congés — §3.3.
 *
 * « Confectionner les projets de planning des congés annuels des Directeurs de
 * services et membres du Cabinet du DG, en liaison avec la DRH. »
 *
 * L'écran ne s'arrête pas aux directeurs : chaque chef de structure y planifie
 * les congés des agents de son sous-arbre. Le serveur borne au périmètre — la
 * page envoie, il refuse ce qui n'est pas à lui. Ce que la DSR et le Directeur
 * général voient, en retour, se lit par tête de structure.
 *
 * À ne pas confondre avec le registre de disponibilité, qui enregistre des
 * absences déjà décidées, une par une. Ici on arbitre des souhaits avant
 * qu'ils ne le deviennent — et la seule information que cet écran apporte, que
 * l'autre ne donne pas, est le **chevauchement** : deux responsables d'une
 * même structure absents en même temps.
 *
 * D'où la frise plutôt qu'un tableau. Douze mois côte à côte laissent voir
 * d'un regard ce qu'une liste de dates oblige à reconstituer mentalement.
 *
 * Un solde intact au mois d'août n'est pas une vertu : c'est un responsable
 * qui n'a rien planifié, et qui posera ses trente jours en décembre.
 */
const MOIS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

const TONS_ETAT: Record<EtatConge, TonEtiquette> = {
  Souhaité: "neutre",
  Arbitré: "alerte",
  Validé: "succes",
  Reporté: "danger",
};

const TEINTES_ETAT: Record<EtatConge, string> = {
  Souhaité: "bg-encre-tenue",
  Arbitré: "bg-alerte-vif",
  Validé: "bg-succes-vif",
  Reporté: "bg-danger-vif",
};

/** Position et largeur d'une période sur la frise, en pourcentage de l'année. */
function segment(du: string, au: string, annee: number) {
  const debutAnnee = new Date(`${annee}-01-01`).getTime();
  const finAnnee = new Date(`${annee}-12-31`).getTime();
  const duree = finAnnee - debutAnnee;

  const depart = Math.max(0, (new Date(du).getTime() - debutAnnee) / duree);
  const arrivee = Math.min(1, (new Date(au).getTime() - debutAnnee) / duree);

  return {
    gauche: `${depart * 100}%`,
    largeur: `${Math.max(0.8, (arrivee - depart) * 100)}%`,
  };
}

export function PlanningConges() {
  const [periode, setPeriode] = useState<Periode>(() =>
    periodeCourante("annee"),
  );
  const { data } = useQuery(planningCongesQuery(periode.annee));

  // Trois modales, trois cibles. La cible est retenue plutot que la ligne
  // entiere : le planning se rafraichit apres chaque envoi, et un objet garde
  // en etat aurait affiche des chiffres perimes derriere la modale suivante.
  const [ouvrirDroit, setOuvrirDroit] = useState(false);
  const [droitPlanifie, setDroitPlanifie] = useState<{
    id: number;
    agent: string;
  } | null>(null);
  const [periodeArbitree, setPeriodeArbitree] = useState<{
    id: number;
    libelle: string;
  } | null>(null);

  return (
    <>
      <EnTetePage
        titre="Planning des congés"
        sousTitre="Agents de votre périmètre — projet établi avec la DRH"
        actions={
          <>
            <SelecteurPeriode
              periode={periode}
              onChange={setPeriode}
              bornerAuPresent={false}
            />
            <Bouton icone="personneAjout" onClick={() => setOuvrirDroit(true)}>
              Ouvrir un droit
            </Bouton>
            <Bouton variante="principal" icone="exporter">
              Transmettre à la DRH
            </Bouton>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <div className="flex flex-col gap-3.5">
          <BandeauCompteurs compteurs={data?.compteurs ?? []} />

          {(data?.conflits.length ?? 0) > 0 && (
            <Encart ton="danger" icone="personnes">
              {data?.conflits.length} chevauchement
              {(data?.conflits.length ?? 0) > 1 ? "s" : ""} détecté
              {(data?.conflits.length ?? 0) > 1 ? "s" : ""} :{" "}
              {data?.conflits
                .map((c) => `${c.responsables.join(" et ")} — ${c.structure}`)
                .join(" ; ")}
              . Une structure privée de toute sa ligne hiérarchique n'a plus
              personne pour valider, coter ni signer.
            </Encart>
          )}

          <Carte titre={`Frise de l'exercice ${data?.annee ?? periode.annee}`}>
            {/* Échelle des mois, alignée sur les frises en dessous. */}
            <div className="mt-4 flex gap-3">
              <span className="w-[180px] flex-none md:w-[220px]" />
              <span className="grid min-w-0 flex-1 grid-cols-12">
                {MOIS.map((mois, index) => (
                  <span
                    key={`${mois}-${index}`}
                    className="text-center text-[10px] leading-none font-bold text-encre-tenue"
                  >
                    {mois}
                  </span>
                ))}
              </span>
            </div>

            <ul className="mt-2.5 flex flex-col">
              {(data?.lignes ?? []).map((ligne, index) => (
                <li
                  key={ligne.id}
                  className={`flex items-center gap-3 py-2.5 ${
                    index > 0 ? "border-t border-separateur" : ""
                  }`}
                >
                  <span className="flex w-[180px] flex-none items-center gap-2 md:w-[220px]">
                    <Avatar initiales={ligne.initiales} taille="petit" />
                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="truncate text-[11.5px] leading-none font-semibold text-encre">
                        {ligne.responsable}
                      </span>
                      <span className="truncate text-[10px] leading-none font-medium text-encre-tenue">
                        {ligne.structure} · {ligne.solde} j à poser
                      </span>
                    </span>
                  </span>

                  <span className="relative h-6 min-w-0 flex-1 rounded-none bg-surface-douce">
                    {/* Repères mensuels, discrets. */}
                    {MOIS.map((_, mois) => (
                      <span
                        key={mois}
                        aria-hidden="true"
                        className="absolute inset-y-0 w-px bg-bordure"
                        style={{ left: `${(mois / 12) * 100}%` }}
                      />
                    ))}

                    {ligne.periodes.map((p) => {
                      const { gauche, largeur } = segment(
                        p.du,
                        p.au,
                        data?.annee ?? periode.annee,
                      );
                      return (
                        <span
                          key={p.id}
                          title={`${formaterDate(p.du)} → ${formaterDate(p.au)} · ${p.jours} j · ${p.etat}`}
                          className={`absolute inset-y-1 rounded-none ${TEINTES_ETAT[p.etat]}`}
                          style={{ left: gauche, width: largeur }}
                        />
                      );
                    })}
                  </span>
                </li>
              ))}
            </ul>

            {/* Meme pied que les graphiques : la frise est un trace comme un
                autre, sa legende se lit au meme endroit et de la meme facon. */}
            <div className="mt-4 border-t border-separateur pt-3.5">
              <PiedGraphe
                series={(
                  ["Souhaité", "Arbitré", "Validé", "Reporté"] as EtatConge[]
                ).map((etat) => ({
                  libelle: etat,
                  classe: TEINTES_ETAT[etat],
                }))}
                mention={`Année ${data?.annee ?? periode.annee}`}
              />
            </div>
          </Carte>

          <Carte titre="Détail par agent">
            <ul className="mt-3.5 flex flex-col">
              {(data?.lignes ?? []).map((ligne, index) => (
                <li
                  key={ligne.id}
                  className={`flex flex-col gap-2.5 py-3 md:flex-row md:items-start md:gap-4 ${
                    index > 0 ? "border-t border-separateur" : ""
                  }`}
                >
                  <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <span className="text-[12.5px] leading-none font-semibold text-encre">
                      {ligne.responsable}
                    </span>
                    <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                      {ligne.poste}
                    </span>
                  </span>

                  <span className="flex w-full flex-col gap-1.5 md:w-[130px]">
                    <span className="text-[11px] leading-none font-medium text-encre-tenue tabular-nums">
                      {ligne.planifies} planifiés · {ligne.solde} restants
                    </span>
                    <span className="text-[10px] leading-none font-medium text-encre-tenue">
                      sur {ligne.droits} jours de droits
                    </span>
                  </span>

                  <span className="flex flex-wrap items-center gap-1.5 md:w-[300px]">
                    {ligne.periodes.length === 0 ? (
                      <Etiquette ton="alerte">Aucune période posée</Etiquette>
                    ) : (
                      ligne.periodes.map((p) => (
                        // La pastille est le bouton d'arbitrage : un second
                        // bouton par periode aurait fait quatre commandes par
                        // ligne pour un ecran qui en compte deja trois.
                        <button
                          key={p.id}
                          type="button"
                          title={`Arbitrer la période du ${formaterDate(p.du)} au ${formaterDate(p.au)}`}
                          onClick={() =>
                            setPeriodeArbitree({
                              id: p.id,
                              libelle: `${ligne.responsable} · ${formaterDate(p.du)} → ${formaterDate(p.au)} · ${p.jours} j`,
                            })
                          }
                          className="flex items-center gap-1.5 rounded-none border border-bordure px-2 py-1.5 transition-colors duration-150 hover:border-bordure-forte hover:bg-surface-douce"
                        >
                          <span className="text-[10.5px] leading-none font-semibold text-encre tabular-nums">
                            {formaterDate(p.du)} → {formaterDate(p.au)}
                          </span>
                          <Etiquette ton={TONS_ETAT[p.etat]}>
                            {p.etat}
                          </Etiquette>
                        </button>
                      ))
                    )}
                  </span>

                  <span className="flex-none">
                    <Bouton
                      icone="calendrier"
                      onClick={() =>
                        setDroitPlanifie({
                          id: ligne.id,
                          agent: ligne.responsable,
                        })
                      }
                    >
                      Planifier
                    </Bouton>
                  </span>
                </li>
              ))}
            </ul>

            <p className="mt-3.5 border-t border-separateur pt-3.5 text-[11px] leading-[1.5] font-medium text-encre-tenue">
              Un solde intact en milieu d'année n'est pas une vertu : c'est un
              responsable qui n'a rien planifié, et qui posera ses trente jours
              au dernier trimestre.
            </p>
          </Carte>
        </div>
      </div>

      <ModaleOuvrirDroit
        ouverte={ouvrirDroit}
        onFermer={() => setOuvrirDroit(false)}
        annee={periode.annee}
      />
      <ModalePlanifierPeriode
        ouverte={droitPlanifie !== null}
        onFermer={() => setDroitPlanifie(null)}
        droitId={droitPlanifie?.id ?? null}
        agent={droitPlanifie?.agent ?? ""}
      />
      <ModaleArbitrerPeriode
        ouverte={periodeArbitree !== null}
        onFermer={() => setPeriodeArbitree(null)}
        periodeId={periodeArbitree?.id ?? null}
        periode={periodeArbitree?.libelle ?? ""}
      />
    </>
  );
}
