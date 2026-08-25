import { useQuery } from "@tanstack/react-query";
import { Carte } from "@/components/ui/Carte";
import { Encart } from "@/components/ui/Encart";
import { Etiquette, type TonEtiquette } from "@/components/ui/Etiquette";
import { etatFileQuery, type EtatEnvoi } from "@/features/notifications/api";

/**
 * L'etat de la file des notifications sortantes — exploitation.
 *
 * Sa place est ici, sous les integrations : la messagerie institutionnelle et la
 * passerelle SMS y sont declarees « non connectees », et cette carte montre ce
 * que cela coute — le nombre exact de messages qui n'ont nulle part ou aller.
 *
 * **`sans_transport` n'est pas un echec, et l'ecran doit le dire.** Un echec se
 * rejoue ; une absence de transport se resout par une decision d'infrastructure
 * (A48 pour le SMS, A51 pour le courriel). Les afficher dans la meme colonne
 * ferait chercher un incident la ou il n'y a qu'un arbitrage en attente.
 *
 * Ce que la carte ne montre pas : le contenu des notifications. Le libelle
 * suffit a reconnaitre une ligne bloquee, et un ecran d'exploitation n'a pas a
 * donner a lire ce qui est adresse a quelqu'un d'autre.
 */
const LIBELLES_CANAL: Record<string, string> = {
  interne: "Notification interne",
  courriel: "Courriel",
  sms: "SMS",
};

const TONS_ETAT: Record<EtatEnvoi, TonEtiquette> = {
  en_attente: "neutre",
  envoye: "succes",
  echoue: "danger",
  sans_transport: "alerte",
};

const LIBELLES_ETAT: Record<EtatEnvoi, string> = {
  en_attente: "En attente",
  envoye: "Envoyé",
  echoue: "Échoué",
  sans_transport: "Sans transport",
};

export function CarteFileNotifications() {
  const { data } = useQuery(etatFileQuery());

  const canaux = data?.canaux ?? [];
  const bloques = data?.bloques ?? [];
  const sansTransport = canaux.reduce((total, c) => total + c.sansTransport, 0);

  return (
    <Carte titre="File des notifications sortantes">
      {sansTransport > 0 && (
        <div className="mt-3">
          <Encart ton="alerte" icone="cloche">
            {sansTransport} notification{sansTransport > 1 ? "s" : ""} n'
            {sansTransport > 1 ? "ont" : "a"} aucun canal de sortie branché. Ce n'est pas une panne
            : c'est le serveur de messagerie et la passerelle SMS qui n'existent pas encore. Les
            destinataires sont prévenus dans l'application, et là seulement.
          </Encart>
        </div>
      )}

      <div className="mt-3.5 flex flex-col gap-2">
        {canaux.length === 0 ? (
          <p className="text-[11.5px] leading-[1.5] font-medium text-encre-tenue">
            Aucun envoi sortant à ce jour. Les notifications internes, elles, ne passent pas par
            cette file — elles sont lues dans l'application.
          </p>
        ) : (
          canaux.map((canal) => (
            <div
              key={canal.canal}
              className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border border-bordure px-3 py-2.5"
            >
              <span className="min-w-[130px] flex-1 text-[12px] leading-none font-bold text-encre">
                {LIBELLES_CANAL[canal.canal] ?? canal.canal}
              </span>
              <Compteur libelle="En attente" valeur={canal.enAttente} />
              <Compteur libelle="Envoyés" valeur={canal.envoyes} />
              <Compteur libelle="Échoués" valeur={canal.echoues} alerte={canal.echoues > 0} />
              <Compteur
                libelle="Sans transport"
                valeur={canal.sansTransport}
                alerte={canal.sansTransport > 0}
              />
            </div>
          ))
        )}
      </div>

      {bloques.length > 0 && (
        <div className="mt-4 border-t border-separateur pt-4">
          <span className="text-[10.5px] leading-none font-semibold tracking-[.5px] text-encre-tenue uppercase">
            Ce qui n'est pas parti
          </span>
          <ul className="mt-2.5 flex flex-col gap-2">
            {bloques.map((envoi) => (
              <li key={envoi.id} className="flex flex-col gap-1 border border-bordure px-3 py-2.5">
                <span className="flex flex-wrap items-center gap-2">
                  <Etiquette ton={TONS_ETAT[envoi.etat]}>{LIBELLES_ETAT[envoi.etat]}</Etiquette>
                  <span className="min-w-0 flex-1 truncate text-[11.5px] leading-none font-bold text-encre">
                    {envoi.libelle}
                  </span>
                  <span className="flex-none text-[10.5px] leading-none font-medium text-encre-tenue tabular-nums">
                    {envoi.tentatives} tentative{envoi.tentatives > 1 ? "s" : ""} · {envoi.creeLe}
                  </span>
                </span>
                {/* La raison telle que le transport l'a rendue. Une erreur
                    réécrite ne se cherche plus dans une documentation. */}
                <span className="text-[11px] leading-[1.45] font-medium text-encre-tenue">
                  {envoi.raison}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Carte>
  );
}

function Compteur({
  libelle,
  valeur,
  alerte = false,
}: {
  libelle: string;
  valeur: number;
  alerte?: boolean;
}) {
  return (
    <span className="flex flex-col gap-1">
      <span className="text-[9.5px] leading-none font-bold tracking-[.6px] text-encre-tenue uppercase">
        {libelle}
      </span>
      <span
        className={`text-[13px] leading-none font-extrabold tabular-nums ${
          alerte ? "text-alerte" : "text-encre"
        }`}
      >
        {valeur}
      </span>
    </span>
  );
}
