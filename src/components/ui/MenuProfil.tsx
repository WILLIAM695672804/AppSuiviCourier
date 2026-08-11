import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { Avatar } from "@/components/ui/Avatar";
import { Icone } from "@/components/ui/Icone";
import { useDeconnexion } from "@/features/authentification/api";
import { ModaleDelegation } from "@/features/habilitation/components/ModaleDelegation";
import { usePermission, useSession } from "@/lib/contexteSession";
import { PERMISSIONS } from "@/types/habilitation";

const PORTEE = {
  poste: "Ses dossiers",
  structure: "Sa structure",
  structure_et_descendants: "Sa structure et ses filles",
  institution: "Toute l'institution",
} as const;

/**
 * Bloc de profil et menu de deconnexion.
 *
 * Il affiche le perimetre en toutes lettres : c'est la reponse a la question
 * « pourquoi ne vois-je pas ce courrier ? », et la poser a l'administrateur
 * coute une demi-journee a tout le monde.
 *
 * `compact` sert l'espace de travail, ou la barre d'ecran est deja chargee :
 * seul l'avatar s'y affiche.
 */
export function MenuProfil({ compact = false }: { compact?: boolean }) {
  const session = useSession();
  const naviguer = useNavigate();
  const deconnexion = useDeconnexion();
  const [ouvert, setOuvert] = useState(false);
  const [delegationOuverte, setDelegationOuverte] = useState(false);
  const boite = useRef<HTMLDivElement>(null);

  /*
   * Deleguer se propose a qui affecte des taches (§3.4).
   *
   * C'est ici et non dans les habilitations : il s'agit de sa propre absence,
   * pas de l'administration des droits d'autrui. L'ecran des habilitations
   * garde la vue d'ensemble, pour l'administrateur.
   */
  const peutDeleguer = usePermission(PERMISSIONS.AFF, PERMISSIONS.VAL);

  useEffect(() => {
    if (!ouvert) return;

    function auClic(evenement: MouseEvent) {
      if (!boite.current?.contains(evenement.target as Node)) setOuvert(false);
    }
    function aLaTouche(evenement: KeyboardEvent) {
      if (evenement.key === "Escape") setOuvert(false);
    }

    document.addEventListener("mousedown", auClic);
    document.addEventListener("keydown", aLaTouche);
    return () => {
      document.removeEventListener("mousedown", auClic);
      document.removeEventListener("keydown", aLaTouche);
    };
  }, [ouvert]);

  async function seDeconnecter() {
    await deconnexion.mutateAsync();
    naviguer("/connexion", { replace: true });
  }

  return (
    <div ref={boite} className="relative">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={ouvert}
        aria-label={`${session.nomComplet} — ouvrir le menu`}
        className={
          compact
            ? "block rounded-none"
            : "flex items-center gap-[11px] rounded-none bg-surface py-2 pr-3 pl-[9px] transition-colors duration-150 hover:bg-surface-douce"
        }
      >
        <Avatar initiales={session.initiales} titre={session.nomComplet} taille="petit" />
        {!compact && (
          <>
            <span className="flex flex-col gap-[3px] text-left">
              <span className="text-xs leading-none font-bold text-encre">{session.nomComplet}</span>
              <span className="text-[10.5px] leading-none font-medium text-encre-tenue">
                {session.posteLibelle}
              </span>
            </span>
            <Icone nom="chevronBas" taille={13} epaisseur={1.6} className="text-encre-tenue" />
          </>
        )}
      </button>

      {ouvert && (
        <div
          role="menu"
          className="absolute top-[calc(100%+8px)] right-0 z-50 w-[260px] overflow-hidden rounded-none border border-bordure bg-surface shadow-[0_12px_32px_rgba(16,24,40,.16)]"
        >
          <div className="border-b border-separateur px-4 py-3.5">
            <p className="text-[12.5px] leading-none font-bold text-encre">{session.nomComplet}</p>
            <p className="mt-1.5 text-[11px] leading-[1.4] font-medium text-encre-faible">
              {session.posteLibelle}
              <br />
              {session.structureLibelle}
            </p>
          </div>

          <dl className="flex flex-col gap-2 border-b border-separateur px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-[11px] leading-none font-medium text-encre-tenue">Périmètre</dt>
              <dd className="text-[11px] leading-none font-semibold text-encre-douce">
                {PORTEE[session.perimetre.portee]}
              </dd>
            </div>
            {session.sessionCourrier && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[11px] leading-none font-medium text-encre-tenue">Session</dt>
                <dd className="truncate text-[11px] leading-none font-semibold text-encre-douce">
                  {session.sessionCourrier.libelle}
                </dd>
              </div>
            )}
            {session.delegationDe && (
              <div className="flex items-center justify-between gap-3">
                <dt className="text-[11px] leading-none font-medium text-encre-tenue">Délégation</dt>
                <dd className="truncate text-[11px] leading-none font-semibold text-alerte">
                  {session.delegationDe.nomComplet}
                </dd>
              </div>
            )}
          </dl>

          {peutDeleguer && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOuvert(false);
                setDelegationOuverte(true);
              }}
              className="flex w-full items-center gap-2.5 border-b border-separateur px-4 py-3 text-left text-[12.5px] leading-none font-semibold text-encre-douce transition-colors duration-150 hover:bg-surface-douce"
            >
              <Icone nom="personnes" taille={13} epaisseur={1.8} />
              Déléguer mes attributions
            </button>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={seDeconnecter}
            disabled={deconnexion.isPending}
            className="flex w-full items-center gap-2.5 px-4 py-3 text-left text-[12.5px] leading-none font-semibold text-danger transition-colors duration-150 hover:bg-danger-voile disabled:opacity-60"
          >
            <Icone nom="croix" taille={13} epaisseur={1.8} />
            {deconnexion.isPending ? "Déconnexion…" : "Se déconnecter"}
          </button>
        </div>
      )}

      <ModaleDelegation
        ouverte={delegationOuverte}
        onFermer={() => setDelegationOuverte(false)}
      />
    </div>
  );
}
