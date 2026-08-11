import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Encart } from "@/components/ui/Encart";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { Icone } from "@/components/ui/Icone";
import { SqueletteCarte } from "@/components/ui/Squelette";
import { mesDemandesQuery, type EtatDemandeUsager } from "@/features/portail/api";
import { formaterDate } from "@/lib/format";

/**
 * Liste des demandes de l'usager — §3.13, premier point.
 *
 * Des cartes et non un tableau. Un usager consulte deux ou trois demandes,
 * souvent sur téléphone ; la densité d'un tableau ne lui fait rien gagner et
 * lui coûte en lisibilité.
 *
 * Ce qui est mis en avant : **ce qu'on attend de lui**. Une demande bloquée
 * parce qu'il manque une pièce remonte en tête avec un bandeau rouge, parce
 * que c'est la seule chose sur laquelle il peut agir. Le reste — les dossiers
 * à l'étude — n'appelle aucune action de sa part et peut attendre.
 *
 * Aucun jargon : ni « cotation », ni « étape », ni « structure pilote ». On
 * écrit « à l'étude au service juridique », et « réponse attendue avant le
 * 20 août ».
 */
const TONS_ETAT: Record<EtatDemandeUsager, TonEtiquette> = {
  Déposée: "neutre",
  "À l'étude": "accent",
  "Complément attendu": "danger",
  "Décision rendue": "succes",
  Close: "succes",
};

export function MesDemandes() {
  const naviguer = useNavigate();
  const { data, isPending } = useQuery(mesDemandesQuery());

  const demandes = [...(data?.demandes ?? [])].sort(
    (a, b) => Number(b.actionAttendue) - Number(a.actionAttendue),
  );
  const enAttente = demandes.filter((d) => d.actionAttendue);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <h1 className="text-[24px] leading-tight font-extrabold tracking-[-.5px] text-encre">
            Mes demandes
          </h1>
          <p className="text-[13px] leading-[1.5] font-medium text-encre-faible">
            {data?.identite ?? "—"} — vous ne voyez ici que les dossiers que vous avez déposés.
          </p>
        </div>

        <Bouton variante="principal" icone="plus" onClick={() => naviguer("/portail/nouvelle")}>
          Déposer une demande
        </Bouton>
      </div>

      {enAttente.length > 0 && (
        <Encart ton="danger" icone="cloche">
          {enAttente.length === 1
            ? "Une de vos demandes attend une pièce de votre part."
            : `${enAttente.length} de vos demandes attendent une pièce de votre part.`}{" "}
          Tant qu'elle n'est pas fournie, le dossier ne peut pas avancer.
        </Encart>
      )}

      {isPending ? (
        <div className="flex flex-col gap-3.5">
          <SqueletteCarte lignes={2} />
          <SqueletteCarte lignes={2} />
          <SqueletteCarte lignes={2} />
        </div>
      ) : demandes.length === 0 ? (
        <Carte>
          <p className="py-8 text-center text-[13px] font-medium text-encre-tenue">
            Vous n'avez encore déposé aucune demande.
          </p>
        </Carte>
      ) : (
        <ul className="flex flex-col gap-3.5">
          {demandes.map((demande) => (
            <li key={demande.id}>
              <Link
                to={`/portail/demandes/${demande.id}`}
                className={`flex flex-col gap-3 rounded-none border bg-surface px-5 py-4 transition-colors duration-150 hover:border-accent md:flex-row md:items-center md:gap-5 ${
                  demande.actionAttendue ? "border-danger-trait" : "border-bordure"
                }`}
              >
                <span className="flex min-w-0 flex-1 flex-col gap-2">
                  <span className="flex flex-wrap items-center gap-2.5">
                    <Etiquette ton={TONS_ETAT[demande.etat]}>{demande.etat}</Etiquette>
                    <span className="text-[11.5px] leading-none font-semibold text-encre-tenue tabular-nums">
                      {demande.reference}
                    </span>
                  </span>

                  <span className="text-[15px] leading-snug font-bold text-encre">
                    {demande.objet}
                  </span>

                  <span className="text-[12px] leading-[1.5] font-medium text-encre-faible">
                    Déposée le {formaterDate(demande.deposeeLe)} ·{" "}
                    {demande.etat === "Close"
                      ? "dossier clos"
                      : `réponse attendue avant le ${formaterDate(demande.reponseAttendueLe)}`}
                    {demande.serviceInstructeur !== "En cours d'affectation" &&
                      ` · ${demande.serviceInstructeur}`}
                  </span>
                </span>

                <span className="flex flex-none items-center gap-2">
                  {demande.actionAttendue && (
                    <span className="rounded-none bg-danger-voile px-3 py-2 text-[12px] leading-none font-bold text-danger">
                      Action requise
                    </span>
                  )}
                  <Icone nom="chevronDroite" taille={16} className="text-encre-tenue" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
