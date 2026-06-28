import { redirect } from "next/navigation";

export default function RootPage() {
  // Redirigir por defecto al Programa Anual para evitar consumos de datos
  // al cargar el Dashboard pesado accidentalmente.
  redirect("/program");
}
