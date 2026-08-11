import { RegistreCourriers } from "@/features/courrier/pages/RegistreCourriers";

/** Vue derivee du registre : meme tableau, filtre d'entree different. */
export function Affectations() {
  return <RegistreCourriers titre="Courriers à affecter" vueInitiale="tous" />;
}
