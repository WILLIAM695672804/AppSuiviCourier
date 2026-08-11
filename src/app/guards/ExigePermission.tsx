import { Outlet } from "react-router";
import { useSession } from "@/lib/contexteSession";
import type { Permission } from "@/types/habilitation";

/**
 * Garde de route. Une seule des permissions listees suffit.
 *
 * Ce garde soigne l'experience, il ne protege pas la donnee :
 * le serveur revalide chaque appel. Un utilisateur qui forcerait l'URL
 * verrait une page vide, jamais un courrier hors de son perimetre.
 */
export function ExigePermission({ permissions }: { permissions: Permission[] }) {
  const session = useSession();
  const autorise = permissions.some((code) => session.permissions.includes(code));

  if (!autorise) {
    return (
      <div className="grid flex-1 place-items-center p-8">
        <div className="max-w-md rounded-none border border-[color:var(--color-bordure-carte)] bg-surface p-6 text-center">
          <p className="text-[13px] font-bold text-encre">Accès non autorisé</p>
          <p className="mt-2.5 text-[12.5px] leading-relaxed font-medium text-encre-faible">
            Votre poste ({session.posteLibelle}) ne porte pas la permission requise pour cet écran.
            Rapprochez-vous de l'administrateur fonctionnel si vous pensez qu'il s'agit d'une erreur.
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
