import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router";
import { EnTetePage } from "@/components/EnTetePage";
import { Bouton } from "@/components/ui/Bouton";
import { ficheQuery } from "@/features/courrier/api";
import { formaterDate, formaterDateHeure } from "@/lib/format";

/**
 * B-03 — fiche de cotation imprimable.
 *
 * La feuille qui accompagne le pli papier. Elle porte l'instruction du cotant
 * et un cadre de decharge : c'est elle que signe le service destinataire, et
 * elle seule fait foi quand le systeme est indisponible.
 *
 * En consequence, aucune information n'y est masquee derriere une interaction :
 * tout ce qui compte doit etre lisible sur le papier.
 */
export function FicheCotationImprimable() {
  const { id } = useParams();
  const { data, isPending } = useQuery(ficheQuery(Number(id)));

  if (isPending || !data) {
    return <p className="px-[26px] py-10 text-[13px] text-encre-tenue">Chargement de la fiche…</p>;
  }

  const cotation = data.cotations[0];

  return (
    <>
      <div className="print:hidden">
        <EnTetePage
          titre="Fiche de cotation"
          miettes={[
            { libelle: "Registre des arrivées", chemin: "/courriers" },
            { libelle: data.numero, chemin: `/courriers/${data.id}` },
            { libelle: "Fiche de cotation" },
          ]}
          actions={
            <div className="flex items-center gap-2">
              <Bouton icone="exporter">Télécharger en PDF</Bouton>
              <Bouton variante="principal" icone="imprimante" onClick={() => window.print()}>
                Imprimer
              </Bouton>
            </div>
          }
        />
      </div>

      <div className="flex-1 overflow-y-auto bg-fond px-[26px] py-6 print:overflow-visible print:bg-white print:p-0">
        <article className="mx-auto max-w-[760px] rounded-none border border-bordure bg-surface p-10 shadow-[0_1px_2px_rgba(16,24,40,.04)] print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
          <header className="text-center">
            <p className="text-[11px] leading-none font-bold tracking-[.5px] text-encre-moyenne uppercase">
              République de Côte d'Ivoire
            </p>
            <p className="mt-1.5 text-[11px] leading-none font-medium text-encre-faible">
              Direction des services rattachés — Bureau d'ordre central
            </p>
          </header>

          <div className="mt-7 border-y-2 border-encre py-3 text-center">
            <h2 className="text-sm leading-none font-extrabold tracking-[1px] text-encre uppercase">
              Fiche de cotation
            </h2>
            <p className="mt-2 text-[13px] leading-none font-bold text-encre tabular-nums">
              N° {data.numero}
            </p>
          </div>

          <dl className="mt-6 flex flex-col gap-4">
            <Ligne libelle="Objet">{data.objet}</Ligne>
            <Ligne libelle="Expéditeur">{data.correspondant}</Ligne>
            <Ligne libelle="Reçu le">{formaterDateHeure(data.dateReception)}</Ligne>
          </dl>

          <h3 className="mt-8 border-b border-bordure-forte pb-2 text-[11px] leading-none font-bold tracking-[.5px] text-encre uppercase">
            Cotation
          </h3>

          <dl className="mt-4 flex flex-col gap-4">
            <Ligne libelle="Structure destinataire">
              {cotation?.structures.map((s) => (
                <span key={s.structureId} className="block">
                  {s.libelle}
                  {s.chefDeFile && cotation.structures.length > 1 && (
                    <strong className="font-bold"> — chef de file</strong>
                  )}
                </span>
              )) ?? "Non cotée"}
            </Ligne>
            <Ligne libelle="Mention">{cotation?.mention ?? "—"}</Ligne>
            <Ligne libelle="Échéance">{formaterDate(cotation?.delaiFixe ?? data.echeance)}</Ligne>
            <Ligne libelle="Instruction du cotant">{cotation?.annotation ?? "—"}</Ligne>
            <Ligne libelle="Pièces jointes au pli">
              {data.nombrePages} page{data.nombrePages > 1 ? "s" : ""}
              {data.nombreAnnexes > 0 && ` · ${data.nombreAnnexes} annexe(s)`}
            </Ligne>
          </dl>

          <div className="mt-12 grid grid-cols-2 gap-10">
            <div>
              <p className="text-[10.5px] leading-none font-semibold text-encre-faible">Le cotant</p>
              <p className="mt-1.5 text-[11px] leading-none font-medium text-encre-tenue">
                {cotation?.decidePar.nomComplet ?? "—"}
              </p>
              <div className="mt-12 border-t border-encre-tenue" />
            </div>
            <div>
              <p className="text-[10.5px] leading-none font-semibold text-encre-faible">
                Décharge du récepteur
              </p>
              <p className="mt-1.5 text-[11px] leading-none font-medium text-encre-tenue">
                Nom, qualité, date et heure
              </p>
              <div className="mt-12 border-t border-encre-tenue" />
            </div>
          </div>

          <footer className="mt-10 flex items-center justify-between border-t border-separateur pt-3">
            <span className="text-[10px] leading-none font-medium text-encre-tenue tabular-nums">
              {data.numero}
            </span>
            <span className="text-[10px] leading-none font-medium text-encre-tenue">Page 1/1</span>
          </footer>
        </article>
      </div>
    </>
  );
}

function Ligne({ libelle, children }: { libelle: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[160px_minmax(0,1fr)] gap-4">
      <dt className="text-[10.5px] leading-[1.5] font-bold tracking-[.4px] text-encre-faible uppercase">
        {libelle}
      </dt>
      <dd className="text-xs leading-[1.6] font-semibold text-encre">{children}</dd>
    </div>
  );
}
