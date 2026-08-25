import { RegistreCourriers } from "@/features/courrier/pages/RegistreCourriers";

/**
 * Vue derivee du registre : meme tableau, filtre d'entree different.
 *
 * `sens` est **indispensable** : sans lui l'ecran retombait sur la valeur par
 * defaut du registre et affichait les arrivees sous le titre « Courriers
 * internes ». Le defaut d'un parametre facultatif ne se voit pas a la lecture.
 */
export function CourriersInternes() {
  return <RegistreCourriers titre="Courriers internes" sens="INTERNE" vueInitiale="tous" />;
}
