import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { Bouton } from "@/components/ui/Bouton";
import { Carte } from "@/components/ui/Carte";
import { Champ, Liste } from "@/components/ui/Champ";
import { ChampDate } from "@/components/ui/ChampDate";
import { ChampTexteLong } from "@/components/ui/ChampTexteLong";
import { Encart } from "@/components/ui/Encart";
import { useCreerDossier, type TypeDossier } from "@/features/dossier/api";

/**
 * Ouverture d'un dossier à instruire — §3.6, dernier point.
 *
 * « Déclencher, le cas échéant, la création automatique d'un dossier à
 * instruire à partir d'un courrier entrant. »
 *
 * Un écran et non une modale : cinq champs dont un texte long, et surtout une
 * décision qui engage — le dossier ouvert fait courir un délai d'instruction
 * dont l'institution répond. La règle posée dans `Modale.tsx` s'applique :
 * « tout ce qui demande plus de trois champs mérite un écran ».
 *
 * Le courrier d'origine arrive par l'URL, jamais par un import du domaine
 * « courrier » : c'est ce qui garde les deux fonctionnalités indépendantes.
 */
const TYPES: TypeDossier[] = ["Demande", "Réclamation", "Autorisation", "Requête", "Acte"];

/** Délai d'instruction par défaut, en jours ouvrés. */
const DELAI_DEFAUT = 30;

interface Champs {
  type: TypeDossier;
  objet: string;
  demandeur: string;
  echeance: string;
  contexte: string;
}

function dansNJours(jours: number): string {
  const date = new Date();
  date.setDate(date.getDate() + jours);
  return date.toISOString().slice(0, 10);
}

export function NouveauDossier() {
  const naviguer = useNavigate();
  const [parametres] = useSearchParams();
  const courrierId = Number(parametres.get("courrier")) || null;

  const creer = useCreerDossier();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Champs>({
    defaultValues: { type: "Demande", echeance: dansNJours(DELAI_DEFAUT) },
  });

  const envoyer = handleSubmit((valeurs) => {
    creer.mutate(
      {
        courrierId: courrierId ?? 0,
        type: valeurs.type,
        objet: valeurs.objet,
        demandeur: valeurs.demandeur,
        echeance: valeurs.echeance,
      },
      { onSuccess: (resultat) => naviguer(`/dossiers/${resultat.id}`) },
    );
  });

  return (
    <>
      <EnTetePage
        titre="Ouvrir un dossier"
        miettes={[
          { libelle: "Dossiers à instruire", chemin: "/dossiers" },
          { libelle: "Ouverture" },
        ]}
        actions={
          <>
            <Bouton onClick={() => naviguer(-1)}>Annuler</Bouton>
            <Bouton
              variante="principal"
              icone="coche"
              chargement={creer.isPending}
              onClick={envoyer}
            >
              {creer.isPending ? "Ouverture…" : "Ouvrir le dossier"}
            </Bouton>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto bg-fond p-4 md:p-[26px]">
        <form onSubmit={envoyer} className="mx-auto flex max-w-[720px] flex-col gap-3.5">
          {creer.isError && (
            <Encart ton="danger" icone="croix">
              Le dossier n'a pas pu être ouvert.
            </Encart>
          )}

          <Encart ton="accent" icone="horloge">
            L'ouverture fait courir un délai d'instruction dont l'institution répond. Il continue
            de courir même si le demandeur ne fournit pas les pièces attendues.
          </Encart>

          <Carte titre="Le dossier">
            <div className="mt-4 flex flex-col gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Liste
                  libelle="Type de dossier"
                  options={TYPES.map((t) => ({ valeur: t, libelle: t }))}
                  aide="Il détermine la règle d'affectation et le circuit de validation."
                  {...register("type", { required: true })}
                />
                <ChampDate
                  libelle="Échéance d'instruction"
                  aide={`${DELAI_DEFAUT} jours par défaut, à ajuster selon la typologie.`}
                  erreur={errors.echeance?.message}
                  {...register("echeance", { required: "Fixez l'échéance." })}
                />
              </div>

              <Champ
                libelle="Objet"
                placeholder="Autorisation d'occupation temporaire du domaine portuaire"
                erreur={errors.objet?.message}
                {...register("objet", {
                  required: "L'objet est obligatoire.",
                  minLength: { value: 10, message: "Soyez plus explicite." },
                })}
              />

              <Champ
                libelle="Demandeur"
                placeholder="Société Camrail"
                aide="Personne ou entité qui reçoit la notification en fin d'instruction."
                erreur={errors.demandeur?.message}
                {...register("demandeur", { required: "Indiquez le demandeur." })}
              />

              <ChampTexteLong
                libelle="Contexte"
                placeholder="Ce qui est demandé, et sur quel fondement."
                rows={4}
                {...register("contexte")}
              />
            </div>

            {courrierId ? (
              <p className="mt-4 border-t border-separateur pt-3.5 text-[11px] leading-[1.5] font-medium text-encre-tenue">
                Le dossier gardera la référence du courrier d'origine. Le courrier, lui, poursuit
                son propre circuit : ouvrir un dossier ne le clôt pas.
              </p>
            ) : (
              <p className="mt-4 border-t border-separateur pt-3.5 text-[11px] leading-[1.5] font-medium text-encre-tenue">
                Aucun courrier d'origine : le dossier sera enregistré comme un dépôt direct.
              </p>
            )}
          </Carte>
        </form>
      </div>
    </>
  );
}
