import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { Icone } from "@/components/ui/Icone";
import {
  mesNotificationsQuery,
  useMarquerLue,
  useToutMarquerLu,
  type Notification,
} from "@/features/notifications/api";

/**
 * La cloche, et ce qu'elle ouvre.
 *
 * Elle etait un bouton mort surmonte d'une pastille rouge permanente — le genre
 * d'ornement qui apprend a un utilisateur a ne plus regarder. La pastille ne
 * s'affiche desormais que s'il y a quelque chose a lire, et elle porte le
 * nombre.
 *
 * **Ouvrir une notification ne la fait pas disparaitre.** Elle passe en lue et
 * reste dans la liste : une notification qui s'efface a la lecture est une
 * information qu'on ne peut plus retrouver, et c'est precisement celles qui
 * comptent qu'on relit.
 *
 * Le panneau ne se rafraichit pas tout seul en continu. Une interrogation
 * toutes les quelques secondes, multipliee par le nombre d'agents connectes,
 * coute plus a l'institution que le confort qu'elle apporte ; la liste se
 * recharge a l'ouverture du panneau, ce qui est le moment ou quelqu'un la
 * regarde.
 */
export function ClocheNotifications() {
  const [ouvert, setOuvert] = useState(false);
  const zone = useRef<HTMLDivElement>(null);
  const naviguer = useNavigate();

  const { data, refetch } = useQuery(mesNotificationsQuery());
  const marquerLue = useMarquerLue();
  const toutMarquerLu = useToutMarquerLu();

  const nonLues = data?.nonLues ?? 0;
  const notifications = data?.notifications ?? [];

  useEffect(() => {
    if (!ouvert) return;
    void refetch();

    function auClic(evenement: MouseEvent) {
      if (!zone.current?.contains(evenement.target as Node)) setOuvert(false);
    }
    document.addEventListener("mousedown", auClic);
    return () => document.removeEventListener("mousedown", auClic);
  }, [ouvert, refetch]);

  function ouvrir(notification: Notification) {
    if (!notification.lue) marquerLue.mutate(notification.id);
    if (notification.lien) {
      setOuvert(false);
      void naviguer(notification.lien);
    }
  }

  return (
    <div className="relative" ref={zone}>
      <button
        type="button"
        aria-label={nonLues > 0 ? `Notifications — ${nonLues} non lues` : "Notifications"}
        onClick={() => setOuvert((o) => !o)}
        className="relative text-encre-tenue hover:text-encre-faible"
      >
        <Icone nom="cloche" taille={17} />
        {/* La pastille ne ment plus : sans notification non lue, pas de point. */}
        {nonLues > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[15px] rounded-none border-[1.5px] border-white bg-danger-vif px-[3px] py-px text-[9px] leading-none font-bold text-white tabular-nums">
            {nonLues > 99 ? "99+" : nonLues}
          </span>
        )}
      </button>

      {ouvert && (
        <div className="absolute top-[calc(100%+11px)] right-0 z-40 flex max-h-[420px] w-[340px] flex-col border border-bordure-forte bg-white shadow-[0_8px_24px_rgba(15,23,42,.12)]">
          <div className="flex flex-none items-center justify-between gap-2 border-b border-bordure px-3 py-2.5">
            <span className="text-[11.5px] leading-none font-bold text-encre">Notifications</span>
            {nonLues > 0 && (
              <button
                type="button"
                onClick={() => toutMarquerLu.mutate()}
                className="text-[10.5px] leading-none font-semibold text-accent hover:underline"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-3 py-6 text-center text-[11.5px] leading-[1.5] font-medium text-encre-tenue">
                Rien à lire pour le moment.
              </p>
            ) : (
              <ul className="flex flex-col">
                {notifications.map((notification) => (
                  <li key={notification.id} className="border-b border-bordure last:border-b-0">
                    <button
                      type="button"
                      onClick={() => ouvrir(notification)}
                      className={`flex w-full flex-col gap-1 px-3 py-2.5 text-left hover:bg-surface-douce ${
                        notification.lue ? "" : "bg-accent-voile/40"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {/* L'alerte porte une marque, l'information n'en porte
                            pas : deux niveaux et pas cinq, sans quoi tout
                            finit « urgent ». */}
                        {notification.importance === "alerte" && (
                          <span className="size-[6px] flex-none bg-danger-vif" />
                        )}
                        <span
                          className={`min-w-0 flex-1 truncate text-[11.5px] leading-none ${
                            notification.lue
                              ? "font-semibold text-encre-faible"
                              : "font-bold text-encre"
                          }`}
                        >
                          {notification.libelle}
                        </span>
                        <span className="flex-none text-[10px] leading-none font-medium text-encre-tenue tabular-nums">
                          {notification.creeLe}
                        </span>
                      </span>
                      {notification.detail && (
                        <span className="line-clamp-2 text-[11px] leading-[1.45] font-medium text-encre-tenue">
                          {notification.detail}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
