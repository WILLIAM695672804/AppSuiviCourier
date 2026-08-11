import { useState, type ReactNode } from "react";
import { Outlet } from "react-router";
import { BarreLateraleAdmin } from "@/app/layout/BarreLateraleAdmin";
import { ChampRecherche } from "@/components/ui/ChampRecherche";
import { BoutonGlossaire, Glossaire } from "@/components/ui/Glossaire";
import { MenuProfil } from "@/components/ui/MenuProfil";
import { BoutonTiroir, TiroirNavigation } from "@/components/ui/TiroirNavigation";
import { useTiroir } from "@/lib/contexteTiroir";
import { useSession } from "@/lib/contexteSession";

/**
 * Disposition de l'administration.
 *
 * Elle ne partage rien avec celle de l'espace de travail, et c'est voulu :
 * cartes flottantes sur fond papier, gouttiere autour du contenu, navigation
 * reduite. `zone-administration` redefinit les jetons de couleur pour toute
 * la branche — voir `index.css`.
 */
export function DispositionAdmin({ children }: { children?: ReactNode }) {
  return (
    <TiroirNavigation
      barre={<BarreLateraleAdmin />}
      className="zone-administration h-screen gap-3.5 overflow-hidden p-3.5 md:min-h-[600px]"
    >
      <main className="flex min-w-0 flex-1 flex-col gap-4 overflow-y-auto">
        <BarreOutils />
        {children ?? <Outlet />}
      </main>
    </TiroirNavigation>
  );
}

/**
 * Separe du corps de la disposition parce qu'il consomme le contexte du
 * tiroir : un composant ne lit pas le contexte qu'il fournit lui-meme.
 */
function BarreOutils() {
  const session = useSession();
  const tiroir = useTiroir();
  const [recherche, setRecherche] = useState("");
  const [glossaireOuvert, setGlossaireOuvert] = useState(false);

  return (
    <div className="flex flex-none flex-wrap items-center gap-3.5">
      {tiroir && <BoutonTiroir onClick={tiroir.ouvrir} />}

      <ChampRecherche
        valeur={recherche}
        onChange={setRecherche}
        placeholder="Rechercher un utilisateur, une structure…"
        className="min-w-0 flex-1 border-transparent bg-surface px-4 py-3 md:w-[330px] md:flex-none"
      />

      <div className="hidden flex-1 md:block" />

      {/*
        Le glossaire est ici aussi : l'auditeur travaille dans cette charte, et
        c'est lui que le §3.12 designe comme son premier lecteur.
      */}
      <BoutonGlossaire onClick={() => setGlossaireOuvert(true)} />
      <Glossaire ouverte={glossaireOuvert} onFermer={() => setGlossaireOuvert(false)} />

      {session.delegationDe && (
        <span className="rounded-none bg-alerte-voile px-3 py-2.5 text-[11px] leading-none font-bold text-alerte">
          Par délégation de {session.delegationDe.nomComplet}
        </span>
      )}

      <MenuProfil />
    </div>
  );
}
