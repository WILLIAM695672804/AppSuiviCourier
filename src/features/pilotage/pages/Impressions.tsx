import { Chantier } from "@/components/Chantier";

export function Impressions() {
  return (
    <Chantier
      titre="Impressions"
      ecrans={[
        "B-02 Registre imprimable",
        "E-01 Journal des impressions"
      ]}
      maquette="Courriers depart.dc.html"
    />
  );
}
