import { useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { EnTetePage } from "@/components/EnTetePage";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Liste } from "@/components/ui/Champ";
import { SqueletteTexte } from "@/components/ui/Squelette";
import { supervisionQuery } from "@/features/courrier/api";

/**
 * Le mapping complet de la DSR — où est bloqué chaque courrier, et depuis quand.
 *
 * L'exigence est explicite : « le profil DSR doit conserver l'accès au mapping
 * complet — date, heure, responsable exact où est bloqué le courrier — pour
 * assurer sa mission de suivi des délais ».
 *
 * La matière existait déjà : la fiche de vie donne la date, l'heure, l'acteur et
 * la marge entre deux étapes. **Ce qui manquait est transversal** — le registre
 * affiche l'étape et le délai, mais ni le détenteur courant ni depuis quand, si
 * bien que « où est bloqué le courrier » se lisait courrier par courrier.
 *
 * D'où cet écran, qui répond à une seule question — **qu'est-ce qui n'avance
 * pas** — et classe par immobilisation décroissante. Le tri n'est pas un
 * réglage : il est le propos. Une liste triée par numéro aurait remis en tête ce
 * qui vient d'arriver.
 *
 * Le seuil écarte ce qui vient d'arriver : un courrier immobilisé depuis deux
 * heures n'est pas bloqué, il est en cours de lecture.
 */
const SEUILS = [
  { valeur: "0", libelle: "Tout ce qui est en cours" },
  { valeur: "3", libelle: "Immobilisé depuis 3 jours" },
  { valeur: "7", libelle: "Immobilisé depuis 7 jours" },
  { valeur: "15", libelle: "Immobilisé depuis 15 jours" },
];

const GRILLE =
  "grid grid-cols-[minmax(200px,1.7fr)_minmax(150px,1.1fr)_minmax(140px,1fr)_110px_100px] items-center gap-2.5 px-[26px]";

const TONS_RESUME: Record<string, TonEtiquette> = {
  neutre: "neutre",
  succes: "succes",
  alerte: "alerte",
};

export function SupervisionDelais() {
  const [seuil, setSeuil] = useState("0");
  const { data, isPending } = useQuery(supervisionQuery(undefined, Number(seuil)));

  return (
    <>
      <EnTetePage
        titre="Supervision des délais"
        compte={data?.total}
        sousTitre="Où est bloqué chaque courrier, et depuis quand"
        mention={data ? `Arrêté le ${formaterDate(data.arreteLe)}` : undefined}
        actions={
          <div className="w-[240px]">
            <Liste
              libelle="Seuil d'immobilisation"
              options={SEUILS}
              value={seuil}
              onChange={(e) => setSeuil(e.target.value)}
            />
          </div>
        }
      />

      <div className="flex flex-none flex-wrap gap-2.5 border-b border-bordure px-[26px] py-3">
        {(data?.resume ?? []).map((ligne) => (
          <div
            key={ligne.libelle}
            className="flex min-w-[160px] flex-col gap-1.5 border border-bordure bg-fond px-3.5 py-2.5"
          >
            <span className="text-[10px] leading-none font-bold tracking-[.5px] text-encre-tenue uppercase">
              {ligne.libelle}
            </span>
            <span className="flex items-baseline gap-2">
              <span className="text-base leading-none font-extrabold text-encre tabular-nums">
                {ligne.valeur}
              </span>
              {ligne.ton === "alerte" && <Etiquette ton="alerte">À traiter</Etiquette>}
            </span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        <div className="min-w-[900px]">
          <div
            className={`${GRILLE} sticky top-0 z-2 border-b border-bordure bg-surface-tete py-2.5`}
          >
            {["Courrier", "Détenteur", "Depuis", "Immobilisé", "Délai"].map((titre) => (
              <span
                key={titre}
                className="text-[9.5px] leading-none font-bold tracking-[.7px] text-encre-tenue uppercase"
              >
                {titre}
              </span>
            ))}
          </div>

          {isPending && (
            <div className="px-[26px] py-4">
              <SqueletteTexte lignes={8} />
            </div>
          )}

          {!isPending && (data?.lignes.length ?? 0) === 0 && (
            <p className="px-[26px] py-8 text-[12.5px] font-medium text-encre-tenue">
              Aucun courrier ne dépasse ce seuil d'immobilisation.
            </p>
          )}

          {(data?.lignes ?? []).map((ligne) => (
            <Link
              key={ligne.courrierId}
              to={`/courriers/${ligne.courrierId}`}
              className={`${GRILLE} border-b border-separateur py-3 transition-colors duration-150 hover:bg-[#fbfbfc]`}
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="text-[11px] leading-none font-semibold text-encre-faible tabular-nums">
                  {ligne.numero}
                </span>
                <span className="truncate text-xs leading-none font-semibold text-encre">
                  {ligne.objet}
                </span>
                <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
                  {ligne.correspondant}
                </span>
              </span>

              {/* Le responsable exact quand il existe. Quand personne n'est
                  nommé, la structure et le motif disent pourquoi : c'est
                  précisément le blocage qu'aucune fiche de vie ne signale. */}
              <span className="flex min-w-0 flex-col gap-1">
                <span className="truncate text-[11.5px] leading-none font-semibold text-encre-douce">
                  {ligne.detenteur ?? ligne.structure ?? "Bureau d'ordre central"}
                </span>
                <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
                  {ligne.motif}
                </span>
              </span>

              <span className="text-[11.5px] leading-none font-medium text-encre-faible">
                {formaterDate(ligne.depuis)}
              </span>

              <span
                className={`text-[12.5px] leading-none font-bold tabular-nums ${
                  ligne.joursImmobilise > 15 ? "text-danger" : "text-encre"
                }`}
              >
                {ligne.joursImmobilise} j
              </span>

              <span className="justify-self-start">
                {ligne.joursDepassement > 0 ? (
                  <Etiquette ton={TONS_RESUME.alerte}>+{ligne.joursDepassement} j</Etiquette>
                ) : (
                  <Etiquette ton={TONS_RESUME.succes}>Tenu</Etiquette>
                )}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

/** Date et heure : l'exigence demande les deux, et deux courriers du même jour ne se distinguent que par l'heure. */
function formaterDate(iso: string): string {
  const date = new Date(iso);
  return `${date.toLocaleDateString("fr-FR")} à ${date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
