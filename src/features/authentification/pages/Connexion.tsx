import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { useLocation, useNavigate } from "react-router";
import { ChampFlottant } from "@/components/ui/ChampFlottant";
import { Encart } from "@/components/ui/Encart";
import { Icone } from "@/components/ui/Icone";
import { Interrupteur } from "@/components/ui/Interrupteur";
import { useConnexion } from "@/features/authentification/api";
import {
  schemaConnexion,
  type SaisieConnexion,
} from "@/features/authentification/schemaConnexion";
import { COMPTES_DEMO } from "@/lib/demo/comptes";
import { useSessionOptionnelle } from "@/lib/contexteSession";

const MODE_DEMO = import.meta.env.VITE_MODE_DEMO === "true";

/**
 * Ecran de connexion.
 *
 * Deux absences volontaires par rapport au modele fourni : pas de connexion
 * par un service tiers — une administration n'authentifie pas ses agents
 * ailleurs que chez elle — et pas de lien d'inscription, puisque les comptes
 * sont ouverts par l'administrateur et jamais demandes par l'agent.
 */
export function Connexion() {
  const naviguer = useNavigate();
  const emplacement = useLocation();
  const { utilisateur } = useSessionOptionnelle();
  const connexion = useConnexion();

  const destination =
    (emplacement.state as { depuis?: string } | null)?.depuis ?? "/";

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<SaisieConnexion>({
    resolver: standardSchemaResolver(schemaConnexion),
    defaultValues: { identifiant: "", motDePasse: "", seSouvenir: false },
  });

  // Une session deja ouverte n'a rien a faire ici.
  useEffect(() => {
    if (utilisateur) naviguer(destination, { replace: true });
  }, [utilisateur, destination, naviguer]);

  async function soumettre(saisie: SaisieConnexion) {
    await connexion.mutateAsync({
      identifiant: saisie.identifiant,
      motDePasse: saisie.motDePasse,
    });
    naviguer(destination, { replace: true });
  }

  function remplir(identifiant: string, motDePasse: string) {
    setValue("identifiant", identifiant);
    setValue("motDePasse", motDePasse);
  }

  return (
    /*
     * Ecran plein, et non une carte posee sur un fond : l'illustration touche
     * les quatre bords de sa colonne, le formulaire occupe le reste. C'est le
     * premier ecran que voit un agent le matin — il n'a pas a chercher ou
     * regarder.
     */
    <div className="grid min-h-screen bg-surface lg:grid-cols-[minmax(360px,38%)_minmax(0,1fr)]">
      <PanneauIllustration />

      <div className="flex items-center justify-center overflow-y-auto px-6 py-14 sm:px-12">
        <div className="w-full max-w-[380px]">
          <h1 className="text-center text-[26px] leading-tight font-extrabold tracking-[-.5px] text-encre">
            Bienvenue
          </h1>
          <p className="mt-2.5 text-center text-[13px] leading-[1.5] font-medium text-encre-faible">
            Application de suivi du courrier
            <br />
            Direction du suivi et de la relance
          </p>

          <form
            onSubmit={handleSubmit(soumettre)}
            className="mt-7 flex flex-col gap-3"
          >
            <ChampFlottant
              libelle="Identifiant"
              autoComplete="username"
              autoFocus
              erreur={errors.identifiant?.message}
              {...register("identifiant")}
            />

            <ChampFlottant
              libelle="Mot de passe"
              motDePasse
              autoComplete="current-password"
              erreur={errors.motDePasse?.message}
              {...register("motDePasse")}
            />

            {connexion.isError && (
              <Encart ton="danger" icone="aide">
                {connexion.error instanceof Error
                  ? connexion.error.message
                  : "La connexion a échoué."}
              </Encart>
            )}

            <button
              type="button"
              className="self-start text-[12.5px] leading-none font-bold text-accent hover:text-accent-fonce"
            >
              Mot de passe oublié ?
            </button>

            <div className="mt-1 flex items-center justify-between gap-3">
              <span className="text-[13px] leading-none font-medium text-encre-douce">
                Rester connecté sur ce poste
              </span>
              <Controller
                control={control}
                name="seSouvenir"
                render={({ field }) => (
                  <Interrupteur
                    actif={field.value}
                    onChange={field.onChange}
                    libelle=""
                  />
                )}
              />
            </div>

            <button
              type="submit"
              disabled={connexion.isPending}
              className="mt-2 w-full rounded-none bg-linear-[180deg,#3b78f0,#2059d8] py-3.5 text-[13.5px] leading-none font-bold text-white shadow-[0_1px_2px_rgba(32,89,216,.4)] transition-[filter] duration-150 hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {connexion.isPending ? "Connexion…" : "Se connecter"}
            </button>
          </form>

          {MODE_DEMO && <ComptesDeDemonstration onChoisir={remplir} />}
        </div>
      </div>
    </div>
  );
}

/**
 * Colonne de gauche.
 *
 * L'image attendue est `public/illustration-connexion.jpg`. Tant qu'elle n'est
 * pas deposee, le degrade institutionnel tient lieu de fond — et il reste
 * visible sous la photo, ce qui garantit le contraste du texte quelle que soit
 * l'image choisie.
 */
function PanneauIllustration() {
  return (
    <div className="relative hidden flex-col justify-between overflow-hidden bg-linear-[160deg,var(--color-accent-nuit)_0%,var(--color-accent)_100%] p-9 lg:flex">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[url('/business-graphics-presentation-illustration.jpg')] bg-cover bg-center"
      />
      {/* Voile monte du bas : il assure le contraste de la citation sans
          eteindre le haut de la photo — et reste discret tant qu'il n'y en a pas. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-encre/70 via-encre/20 to-transparent"
      />

      <div className="relative flex items-center gap-2.5">
        <span className="grid size-[26px] place-items-center rounded-none bg-white/20">
          <span className="size-2.5 rotate-45 rounded-none bg-white" />
        </span>
        <span className="text-base leading-none font-extrabold tracking-[-.2px] text-white">
          Suivi Courrier
        </span>
      </div>

      <div className="relative">
        <p className="text-[26px] leading-[1.25] font-extrabold tracking-[-.5px] text-balance text-white">
          « Un courrier enregistré est un courrier qui ne se perd plus. »
        </p>
        <p className="mt-5 text-[13px] leading-none font-bold text-white">
          Direction générale
        </p>
        <p className="mt-1.5 text-xs leading-none font-medium text-white/70">
          Note de cadrage du 28 juillet 2026
        </p>
      </div>
    </div>
  );
}

/**
 * Comptes de demonstration, affiches uniquement en mode demonstration.
 *
 * Le bloc est explicite sur ce qu'il est : sans cet avertissement, un lecteur
 * pourrait croire l'application livrable en l'etat.
 *
 * Treize entrees a la suite formaient un mur. Elles sont donc groupees par
 * famille et repliees derriere un `<details>` : qui vient travailler ouvre
 * l'application, qui vient explorer deplie la liste. Sur telephone, ce repli
 * est ce qui garde le formulaire visible sans avoir a faire defiler.
 */
const FAMILLES = ["Gouvernance", "Structures", "Chaîne du courrier", "Fonctions support", "Externe"] as const;

function ComptesDeDemonstration({
  onChoisir,
}: {
  onChoisir: (identifiant: string, motDePasse: string) => void;
}) {
  return (
    <details className="group mt-8 border-t border-separateur pt-5">
      <summary className="flex cursor-pointer list-none items-center gap-2 text-[11px] leading-[1.5] font-semibold text-encre-tenue">
        <Icone
          nom="chevronDroite"
          taille={12}
          className="flex-none transition-transform duration-150 group-open:rotate-90"
        />
        Mode démonstration — {COMPTES_DEMO.length} postes à essayer
      </summary>

      <p className="mt-2.5 text-[11px] leading-[1.5] font-medium text-encre-tenue">
        Aucun mot de passe n'est protégé. Choisissez un poste pour voir
        l'application telle qu'il la voit.
      </p>

      <div className="mt-3 flex max-h-[300px] flex-col gap-3 overflow-y-auto pr-1">
        {FAMILLES.map((famille) => {
          const comptes = COMPTES_DEMO.filter((c) => c.famille === famille);
          if (comptes.length === 0) return null;

          return (
            <div key={famille} className="flex flex-col gap-1.5">
              <span className="text-[9.5px] leading-none font-bold tracking-[.5px] text-encre-tenue uppercase">
                {famille}
              </span>

              {comptes.map((compte) => (
                <button
                  key={compte.identifiant}
                  type="button"
                  onClick={() => onChoisir(compte.identifiant, compte.motDePasse)}
                  className="flex items-center gap-2.5 rounded-none border border-bordure px-3 py-2.5 text-left transition-colors duration-150 hover:bg-surface-douce"
                >
                  <span className="w-[74px] flex-none text-[11px] leading-none font-bold text-accent">
                    {compte.identifiant}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate text-[11.5px] leading-none font-semibold text-encre">
                      {compte.utilisateur.posteLibelle}
                    </span>
                    <span className="truncate text-[10.5px] leading-none font-medium text-encre-tenue">
                      {compte.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </details>
  );
}
