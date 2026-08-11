import { RegistreCourriers } from "@/features/courrier/pages/RegistreCourriers";

/** Vue derivee du registre : meme tableau, filtre d'entree different. */
export function Cotations() {
  return <RegistreCourriers titre="Courriers à coter" vueInitiale="nonCotes" />;
}
