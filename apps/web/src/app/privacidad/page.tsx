import type { Metadata } from "next";
import { LEGAL, LegalPage } from "@/components/legal-page";

export const metadata: Metadata = { title: "Política de privacidad", description: "Qué datos usa Craneá, para qué y cómo pedir que se borren." };

export default function Privacy() {
  const mail = <a href={`mailto:${LEGAL.email}`} className="underline underline-offset-4">{LEGAL.email}</a>;
  return (
    <LegalPage title="Política de privacidad">
      <p>
        Craneá (la web cranea.app y la app para Android e iOS) es un servicio de juegos de lógica a cargo de {LEGAL.owner},
        con domicilio en {LEGAL.country}. Esta política explica qué datos usamos, para qué y qué podés hacer con ellos.
        Ante cualquier duda, escribinos a {mail}.
      </p>

      <h2>Jugar sin cuenta</h2>
      <p>
        Podés jugar sin registrarte. En ese caso tu progreso (resultados, rachas, logros y ajustes) se guarda solo en tu
        dispositivo y no nos llega.
      </p>

      <h2>Qué datos usamos si creás una cuenta</h2>
      <ul>
        <li><strong>Datos de la cuenta:</strong> nombre, apellido (opcional) y email, o los que comparta Google o Apple si entrás con ellos.</li>
        <li><strong>Progreso de juego:</strong> resultados de niveles y desafíos diarios, intentos, tiempos, rachas y logros, para sincronizarlos entre tus dispositivos.</li>
        <li><strong>Ranking:</strong> si aparecés en el ranking, se muestra tu nombre con la inicial del apellido (por ejemplo, «Erik E.») y tus resultados. Podés ocultarte cuando quieras.</li>
        <li><strong>Suscripción:</strong> si tenés Craneá Plus, el estado y el vencimiento de la suscripción. El pago lo procesan Google Play o App Store; nunca vemos los datos de tu tarjeta.</li>
        <li><strong>Recordatorios:</strong> si activás el recordatorio del diario, la suscripción de notificaciones de tu navegador o dispositivo, tu zona horaria y la hora elegida.</li>
      </ul>

      <h2>Anuncios en la app</h2>
      <p>
        La app gratuita puede mostrar anuncios con recompensa solo cuando vos lo pedís (para una pista o un intento extra). Los
        sirve Google AdMob, que puede usar el identificador de publicidad del dispositivo, la dirección IP y datos técnicos para
        mostrar el anuncio, medirlo y prevenir fraude. Pedimos anuncios no personalizados. Con Craneá Plus no hay anuncios. La web
        no muestra anuncios.
      </p>

      <h2>Con quién compartimos datos</h2>
      <p>Solo con proveedores que necesitamos para que Craneá funcione, que los tratan por cuenta nuestra:</p>
      <ul>
        <li>Clerk (inicio de sesión y cuentas).</li>
        <li>Convex (base de datos del progreso, el ranking y las suscripciones).</li>
        <li>Vercel (alojamiento de la web).</li>
        <li>RevenueCat, Google Play y App Store (compras y suscripciones).</li>
        <li>Google AdMob (anuncios con recompensa en la app).</li>
        <li>Los servicios de notificaciones del navegador o del sistema (para el recordatorio).</li>
      </ul>
      <p>
        Algunos de estos proveedores procesan datos fuera de {LEGAL.country}, con resguardos adecuados. No vendemos tus datos ni los
        usamos para publicidad propia.
      </p>

      <h2>Cuánto tiempo los guardamos</h2>
      <p>
        Mientras tengas la cuenta. Si la borrás, eliminamos tus datos en un plazo razonable, salvo lo que tengamos que conservar por
        obligación legal (por ejemplo, registros de compras que llevan las tiendas).
      </p>

      <h2>Tus derechos</h2>
      <p>
        Podés pedir acceso, rectificación o eliminación de tus datos, u oponerte a su uso, escribiendo a {mail}. Podés borrar tu
        cuenta desde la app (Cuenta → Borrar cuenta) o pidiéndolo por email. En {LEGAL.country} rige la Ley 25.326 de Protección de
        los Datos Personales; la Agencia de Acceso a la Información Pública es el órgano de control y recibe denuncias por
        incumplimientos.
      </p>

      <h2>Menores</h2>
      <p>Craneá no está dirigido a menores de 13 años y no recolectamos a sabiendas datos de ellos.</p>

      <h2>Cambios</h2>
      <p>Si cambiamos esta política, actualizamos la fecha de arriba y, si el cambio es importante, te avisamos en la app.</p>
    </LegalPage>
  );
}
