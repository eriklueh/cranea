/**
 * Tarjeta para compartir como PNG, dibujada en el cliente con canvas: hoja cuadriculada
 * con margen rojo y una ficha con borde de tinta, como la app. Sirve para el día completo
 * o para un solo juego (una fila).
 */

export type ShareRowState = "won" | "lost" | "pending";

export interface ShareCardRow {
  label: string;
  state: ShareRowState;
  /** "2/3 · 1:11", "pendiente"… */
  detail: string;
}

export interface ShareCard {
  /** "Craneá #1" */
  title: string;
  /** "31/10 · 4 de 5" */
  subtitle?: string;
  rows: ShareCardRow[];
  /** Línea chica debajo de la ficha ("Racha Craneá: 3 días"). */
  note?: string;
  /** "cranea.vercel.app" */
  footer: string;
}

/** Siempre en claro: se lee igual en cualquier chat. Mismos colores que globals.css. */
const C = {
  paper: "#f6f8fb",
  grid: "#dbe5f1",
  ink: "#1c2b4b",
  pencil: "#6f7a8f",
  margin: "#d2453d",
  ok: "#23774f",
  card: "#ffffff",
  border: "#c5d2e3",
};

const W = 1080;
const CELL = 36;
const CARD_X = 132;
const CARD_W = W - CARD_X - 84;
const PAD = 52;
const ROW_H = 108;
const HEAD_H = 206;

function fontFamily(variable: string, fallback: string) {
  const v = typeof document !== "undefined" ? getComputedStyle(document.documentElement).getPropertyValue(variable).trim() : "";
  return v || fallback;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function fitText(ctx: CanvasRenderingContext2D, text: string, max: number) {
  if (ctx.measureText(text).width <= max) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > max) t = t.slice(0, -1);
  return `${t}…`;
}

function drawIcon(ctx: CanvasRenderingContext2D, state: ShareRowState, cx: number, cy: number) {
  const r = 30;
  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  if (state === "won") {
    ctx.fillStyle = C.ok;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.card;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(cx - 13, cy + 1);
    ctx.lineTo(cx - 3, cy + 11);
    ctx.lineTo(cx + 14, cy - 10);
    ctx.stroke();
  } else if (state === "lost") {
    ctx.fillStyle = C.margin;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = C.card;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(cx - 10, cy - 10);
    ctx.lineTo(cx + 10, cy + 10);
    ctx.moveTo(cx + 10, cy - 10);
    ctx.lineTo(cx - 10, cy + 10);
    ctx.stroke();
  } else {
    ctx.strokeStyle = C.pencil;
    ctx.lineWidth = 4;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

export async function renderShareCard(card: ShareCard): Promise<Blob> {
  const display = fontFamily("--font-bricolage", "system-ui, sans-serif");
  const body = fontFamily("--font-atkinson", "system-ui, sans-serif");
  // Sin esperar, el canvas puede dibujar con la fuente de reserva.
  await Promise.all([
    document.fonts?.load(`800 64px ${display}`),
    document.fonts?.load(`700 36px ${body}`),
    document.fonts?.load(`400 36px ${body}`),
  ]).catch(() => undefined);

  const cardH = HEAD_H + card.rows.length * ROW_H + PAD;
  const cardY = 108;
  const H = Math.ceil((cardY + cardH + (card.note ? 200 : 150)) / CELL) * CELL;

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Sin canvas");

  // Hoja cuadriculada con margen.
  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = C.grid;
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = CELL; x < W; x += CELL) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
  }
  for (let y = CELL; y < H; y += CELL) {
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
  }
  ctx.stroke();
  ctx.strokeStyle = C.margin;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(84, 0);
  ctx.lineTo(84, H);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Ficha con sombra de tinta.
  roundRect(ctx, CARD_X, cardY + 10, CARD_W, cardH, 28);
  ctx.fillStyle = C.ink;
  ctx.fill();
  roundRect(ctx, CARD_X, cardY, CARD_W, cardH, 28);
  ctx.fillStyle = C.card;
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 5;
  ctx.stroke();

  const left = CARD_X + PAD;
  const right = CARD_X + CARD_W - PAD;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = C.ink;
  ctx.font = `800 76px ${display}`;
  ctx.fillText(fitText(ctx, card.title, right - left), left, cardY + PAD + 66);
  if (card.subtitle) {
    ctx.fillStyle = C.pencil;
    ctx.font = `700 36px ${body}`;
    ctx.fillText(fitText(ctx, card.subtitle, right - left), left, cardY + PAD + 116);
  }

  card.rows.forEach((row, i) => {
    const top = cardY + HEAD_H + i * ROW_H;
    ctx.save();
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(left, top);
    ctx.lineTo(right, top);
    ctx.stroke();
    ctx.restore();

    const mid = top + ROW_H / 2;
    drawIcon(ctx, row.state, left + 30, mid);
    ctx.textBaseline = "middle";
    ctx.fillStyle = row.state === "pending" ? C.pencil : C.ink;
    ctx.font = `800 46px ${display}`;
    const labelX = left + 84;
    ctx.fillText(row.label, labelX, mid + 2);
    const labelW = ctx.measureText(row.label).width;
    ctx.font = `${row.state === "pending" ? 400 : 700} 36px ${body}`;
    ctx.fillStyle = row.state === "lost" ? C.margin : row.state === "pending" ? C.pencil : C.ink;
    ctx.textAlign = "right";
    ctx.fillText(fitText(ctx, row.detail, right - labelX - labelW - 32), right, mid + 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  });

  let y = cardY + cardH + 10 + 76;
  ctx.textAlign = "center";
  const cx = CARD_X + CARD_W / 2;
  if (card.note) {
    ctx.fillStyle = C.ink;
    ctx.font = `700 38px ${body}`;
    ctx.fillText(card.note, cx, y);
    y += 60;
  }
  ctx.fillStyle = C.pencil;
  ctx.font = `700 34px ${body}`;
  ctx.fillText(card.footer, cx, y);

  return await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo crear la imagen"))), "image/png"),
  );
}
