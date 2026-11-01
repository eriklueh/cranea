import type { Metadata } from "next";
import Link from "next/link";
import { LEGAL, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Términos y condiciones", description: "Las reglas para usar Craneá y Craneá Plus." };

export default function Terms() {
  return (
    <LegalPage title="Términos y condiciones">
      <p>
        Estos términos rigen el uso de Craneá (la web cranea.app y la app para Android e iOS), a cargo de {LEGAL.owner}. Al usar
        Craneá los aceptás. También aplica nuestra <Link href="/privacidad" className="underline underline-offset-4">política de privacidad</Link>.
      </p>

      <h2>El servicio</h2>
      <p>
        Craneá ofrece juegos de lógica. Los desafíos diarios, los tutoriales, el ranking, las estadísticas y los logros son gratis.
        Podemos agregar, cambiar o quitar juegos y funciones con el tiempo.
      </p>

      <h2>Tu cuenta</h2>
      <p>
        Para sincronizar el progreso y aparecer en el ranking necesitás una cuenta. Sos responsable de lo que se haga con ella. Tenés
        que tener al menos 13 años.
      </p>

      <h2>Craneá Plus</h2>
      <ul>
        <li>Plus es una suscripción mensual o anual que desbloquea todos los niveles, el archivo de diarios, pistas sin límite y la app sin anuncios.</li>
        <li>Se compra en Google Play o App Store. El precio final, en tu moneda, lo ves en la tienda antes de confirmar.</li>
        <li>Se renueva sola al final de cada período, salvo que la canceles al menos 24 horas antes desde la tienda. Si cancelás, seguís con Plus hasta que termine el período pagado.</li>
        <li>Los reembolsos los gestiona la tienda según sus políticas.</li>
        <li>Plus queda asociado a tu cuenta de Craneá y se activa también en la web con la misma cuenta.</li>
      </ul>

      <h2>Juego limpio</h2>
      <p>
        El ranking es para jugar en serio. Si detectamos trampas (por ejemplo, manipular resultados o automatizar partidas), podemos
        quitar resultados del ranking o suspender la cuenta.
      </p>

      <h2>Contenido</h2>
      <p>
        Los juegos, tableros, textos, diseño y marca de Craneá son de su titular. Podés compartir tus resultados, pero no copiar ni
        redistribuir el contenido.
      </p>

      <h2>Responsabilidad</h2>
      <p>
        Craneá se ofrece tal como está. Hacemos lo posible para que funcione bien, pero no garantizamos que esté siempre disponible ni
        libre de errores. En la medida que lo permita la ley, no respondemos por daños indirectos derivados de su uso. Nada de esto
        limita tus derechos como consumidor según la Ley 24.240.
      </p>

      <h2>Cambios y ley aplicable</h2>
      <p>
        Si cambiamos estos términos, actualizamos la fecha de arriba. Rigen las leyes de la República Argentina.
        Para consultas o reclamos, escribinos a <a href={`mailto:${LEGAL.email}`} className="underline underline-offset-4">{LEGAL.email}</a>.
      </p>
    </LegalPage>
  );
}
