import { Bouton } from "@/components/ui/Bouton";
import { Icone } from "@/components/ui/Icone";
import { Spinner } from "@/components/ui/Spinner";

/**
 * Page entière en attente, et son pendant : la page qui n'a pas pu charger.
 *
 * Réservé aux écrans de détail — une fiche, un dossier — dont on ne peut pas
 * dessiner le squelette faute de savoir ce qu'ils contiendront. Pour une liste
 * ou un tableau, le squelette est toujours préférable.
 *
 * Le message est nommé plutôt que générique : « Ouverture du dossier… » situe
 * l'attente, « Chargement… » ne dit rien. Sur un réseau lent — le cas dans
 * une administration — l'agent doit pouvoir vérifier qu'il attend bien ce
 * qu'il a demandé.
 */
export function EtatChargement({ message = "Chargement en cours…" }: { message?: string }) {
  return <PageChargement message={message} />;
}

export function PageChargement({ message = "Chargement en cours…" }: { message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="grid flex-1 place-items-center bg-surface px-6 py-16"
    >
      <div className="flex min-w-[220px] flex-col items-center gap-3 border border-bordure bg-surface px-6 py-5 text-center shadow-[0_10px_30px_rgba(16,24,40,.05)]">
        <span className="grid size-11 place-items-center bg-accent-voile text-accent">
          <Spinner taille={26} libelle={message} />
        </span>
        <p className="text-[12.5px] leading-[1.45] font-semibold text-encre-douce">{message}</p>
      </div>
    </div>
  );
}

export function ChargementComposant({
  message = "Chargement des données…",
  compact = false,
}: {
  message?: string;
  compact?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={`flex items-center justify-center gap-2.5 text-encre-tenue ${
        compact ? "px-3 py-3" : "px-5 py-8"
      }`}
    >
      <Spinner taille={compact ? 16 : 20} className="text-accent" libelle={message} />
      <span className="text-[12px] leading-none font-semibold">{message}</span>
    </div>
  );
}

/**
 * Échec de chargement.
 *
 * Trois choses, dans cet ordre : ce qui s'est passé, ce que l'agent peut
 * faire, et le moyen de le faire. Un message d'erreur sans bouton de reprise
 * oblige à recharger la page entière — et à perdre ce qu'on avait ouvert.
 */
export function EtatErreur({
  message = "Ces données n'ont pas pu être chargées.",
  onReessayer,
}: {
  message?: string;
  onReessayer?: () => void;
}) {
  return (
    <div role="alert" className="grid flex-1 place-items-center px-6 py-16">
      <div className="flex max-w-[420px] flex-col items-center gap-3 text-center">
        <span className="grid size-10 place-items-center rounded-none bg-danger-voile text-danger">
          <Icone nom="croix" taille={18} epaisseur={1.8} />
        </span>

        <p className="text-[13px] leading-[1.5] font-semibold text-encre">{message}</p>
        <p className="text-[11.5px] leading-[1.5] font-medium text-encre-tenue">
          Le serveur n'a pas répondu, ou la connexion s'est interrompue. Rien n'est perdu : la
          demande peut être relancée.
        </p>

        {onReessayer && (
          <div className="mt-1">
            <Bouton icone="tri" onClick={onReessayer}>
              Réessayer
            </Bouton>
          </div>
        )}
      </div>
    </div>
  );
}
