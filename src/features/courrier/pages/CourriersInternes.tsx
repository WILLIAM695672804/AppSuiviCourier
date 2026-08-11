import { RegistreCourriers } from "@/features/courrier/pages/RegistreCourriers";

/** Vue derivee du registre : meme tableau, filtre d'entree different. */
export function CourriersInternes() {
  return <RegistreCourriers titre="Courriers internes" vueInitiale="tous" />;
}
