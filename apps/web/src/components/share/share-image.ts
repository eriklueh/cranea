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
  /** "cranea.app" */
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
  const { display, body } = await loadFonts();

  const cardH = HEAD_H + card.rows.length * ROW_H + PAD;
  const cardY = 108;
  const H = Math.ceil((cardY + cardH + (card.note ? 200 : 150)) / CELL) * CELL;

  const { canvas, ctx } = sheet(H);
  paintCard(ctx, cardY, cardH);

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

  return toPng(canvas);
}

async function loadFonts() {
  const display = fontFamily("--font-bricolage", "system-ui, sans-serif");
  const body = fontFamily("--font-atkinson", "system-ui, sans-serif");
  // Sin esperar, el canvas puede dibujar con la fuente de reserva.
  await Promise.all([
    document.fonts?.load(`800 64px ${display}`),
    document.fonts?.load(`700 36px ${body}`),
    document.fonts?.load(`400 36px ${body}`),
  ]).catch(() => undefined);
  return { display, body };
}

/** Hoja cuadriculada con el margen rojo. */
function sheet(H: number) {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Sin canvas");
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
  return { canvas, ctx };
}

/** Ficha blanca con borde y sombra de tinta. */
function paintCard(ctx: CanvasRenderingContext2D, y: number, h: number) {
  roundRect(ctx, CARD_X, y + 10, CARD_W, h, 28);
  ctx.fillStyle = C.ink;
  ctx.fill();
  roundRect(ctx, CARD_X, y, CARD_W, h, 28);
  ctx.fillStyle = C.card;
  ctx.fill();
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 5;
  ctx.stroke();
}

function toPng(canvas: HTMLCanvasElement) {
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("No se pudo crear la imagen"))), "image/png"),
  );
}

/* ───────────── Un solo resultado (después de un diario o un nivel) ───────────── */

/** Marca de un intento: fallado, el que salió o sin usar. */
export type AttemptMark = "miss" | "win" | "empty";

/** Algo que se vea de la partida sin revelar la solución. */
export type ResultVisual =
  /** Palabra: los colores de cada intento, sin letras (como Wordle). 2 = en su lugar, 1 = está, 0 = no está. */
  | { kind: "colors"; rows: (0 | 1 | 2)[][] }
  /** Silueta del tablero: solo la cuadrícula y, si hay, las islas (sin números ni puentes). `blocks`: línea gruesa cada tantas. */
  | { kind: "board"; width: number; height: number; dots?: { r: number; c: number }[]; blocks?: number };

export interface ResultCard {
  /** "Palabra" */
  game: string;
  /** "Diario #12", "Nivel 2-3" */
  label: string;
  won: boolean;
  /** "3/6", "Sin errores", "No salió" */
  headline: string;
  /** "3 intentos · 1:23" */
  detail: string;
  visual?: ResultVisual;
  marks?: AttemptMark[];
  /** "cranea.app" */
  footer: string;
}

const PRESENT = "#e3b505";
const ABSENT = "#c5d2e3";
const OK_BG = "#e4f3e9";

function drawMarks(ctx: CanvasRenderingContext2D, marks: AttemptMark[], cx: number, top: number, size: number) {
  const gap = Math.round(size * 0.22);
  const total = marks.length * size + (marks.length - 1) * gap;
  marks.forEach((m, i) => {
    const x = cx - total / 2 + i * (size + gap);
    roundRect(ctx, x, top, size, size, size * 0.18);
    if (m === "empty") {
      ctx.save();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 4;
      ctx.setLineDash([10, 8]);
      ctx.stroke();
      ctx.restore();
      return;
    }
    ctx.fillStyle = m === "win" ? C.ok : C.margin;
    ctx.fill();
    ctx.save();
    ctx.strokeStyle = C.card;
    ctx.lineWidth = size * 0.1;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    const mx = x + size / 2;
    const my = top + size / 2;
    const k = size * 0.2;
    ctx.beginPath();
    if (m === "win") {
      ctx.moveTo(mx - k, my + k * 0.05);
      ctx.lineTo(mx - k * 0.25, my + k * 0.8);
      ctx.lineTo(mx + k * 1.05, my - k * 0.7);
    } else {
      ctx.moveTo(mx - k * 0.8, my - k * 0.8);
      ctx.lineTo(mx + k * 0.8, my + k * 0.8);
      ctx.moveTo(mx + k * 0.8, my - k * 0.8);
      ctx.lineTo(mx - k * 0.8, my + k * 0.8);
    }
    ctx.stroke();
    ctx.restore();
  });
}

function drawVisual(ctx: CanvasRenderingContext2D, v: ResultVisual, won: boolean, cx: number, top: number, maxW: number, maxH: number) {
  if (v.kind === "colors") {
    const cols = Math.max(1, ...v.rows.map((r) => r.length));
    const n = Math.max(1, v.rows.length);
    const s = Math.floor(Math.min(84, maxW / (cols + (cols - 1) * 0.14), maxH / (n + (n - 1) * 0.14)));
    const gap = Math.round(s * 0.14);
    const w = cols * s + (cols - 1) * gap;
    const h = n * s + (n - 1) * gap;
    const y0 = top + (maxH - h) / 2;
    v.rows.forEach((row, r) =>
      row.forEach((x, c) => {
        roundRect(ctx, cx - w / 2 + c * (s + gap), y0 + r * (s + gap), s, s, s * 0.14);
        ctx.fillStyle = x === 2 ? C.ok : x === 1 ? PRESENT : ABSENT;
        ctx.fill();
      }),
    );
    return;
  }
  const { width: cw, height: ch } = v;
  const s = Math.min(64, maxW / cw, maxH / ch);
  const w = cw * s;
  const h = ch * s;
  const x0 = cx - w / 2;
  const y0 = top + (maxH - h) / 2;
  roundRect(ctx, x0, y0, w, h, 12);
  ctx.fillStyle = won ? OK_BG : C.card;
  ctx.fill();
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = C.ink;
  for (let i = 1; i < Math.max(cw, ch); i++) {
    for (const vertical of [true, false]) {
      if (vertical ? i >= cw : i >= ch) continue;
      const thick = Boolean(v.blocks && i % v.blocks === 0);
      ctx.globalAlpha = thick ? 0.5 : 0.16;
      ctx.lineWidth = thick ? 4 : 2;
      ctx.beginPath();
      if (vertical) {
        ctx.moveTo(x0 + i * s, y0);
        ctx.lineTo(x0 + i * s, y0 + h);
      } else {
        ctx.moveTo(x0, y0 + i * s);
        ctx.lineTo(x0 + w, y0 + i * s);
      }
      ctx.stroke();
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
  for (const d of v.dots ?? []) {
    ctx.beginPath();
    ctx.arc(x0 + (d.c + 0.5) * s, y0 + (d.r + 0.5) * s, s * 0.36, 0, Math.PI * 2);
    ctx.fillStyle = C.card;
    ctx.fill();
    ctx.strokeStyle = won ? C.ok : C.ink;
    ctx.lineWidth = Math.max(3, s * 0.08);
    ctx.stroke();
  }
  roundRect(ctx, x0, y0, w, h, 12);
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 4;
  ctx.stroke();
}

/** PNG cuadrado (1080 × 1080) con el resultado de una partida. Nunca muestra la solución. */
export async function renderResultCard(card: ResultCard): Promise<Blob> {
  const { display, body } = await loadFonts();
  const { canvas, ctx } = sheet(W);
  const cardY = 96;
  const cardH = 840;
  paintCard(ctx, cardY, cardH);

  const left = CARD_X + PAD;
  const right = CARD_X + CARD_W - PAD;
  const cx = CARD_X + CARD_W / 2;
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = C.ink;
  ctx.font = `800 76px ${display}`;
  ctx.fillText(fitText(ctx, card.game, right - left - 90), left, cardY + PAD + 66);
  ctx.fillStyle = C.pencil;
  ctx.font = `700 36px ${body}`;
  ctx.fillText(fitText(ctx, card.label, right - left - 90), left, cardY + PAD + 116);
  drawIcon(ctx, card.won ? "won" : "lost", right - 30, cardY + PAD + 46);

  // Lo visual va entre el encabezado y el resultado.
  const top = cardY + 236;
  const bottom = cardY + cardH - 190;
  const marksH = card.marks?.length ? (card.visual ? 72 : 150) : 0;
  const gap = card.visual && marksH ? 28 : 0;
  if (card.visual) drawVisual(ctx, card.visual, card.won, cx, top, right - left, bottom - top - marksH - gap);
  if (card.marks?.length) drawMarks(ctx, card.marks, cx, card.visual ? bottom - marksH : top + (bottom - top - marksH) / 2, marksH);

  ctx.save();
  ctx.strokeStyle = C.border;
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 8]);
  ctx.beginPath();
  ctx.moveTo(left, bottom + 36);
  ctx.lineTo(right, bottom + 36);
  ctx.stroke();
  ctx.restore();

  ctx.textAlign = "center";
  ctx.fillStyle = card.won ? C.ok : C.margin;
  ctx.font = `800 64px ${display}`;
  ctx.fillText(fitText(ctx, card.headline, right - left), cx, bottom + 112);
  ctx.fillStyle = C.ink;
  ctx.font = `700 36px ${body}`;
  ctx.fillText(fitText(ctx, card.detail, right - left), cx, bottom + 162);

  ctx.fillStyle = C.pencil;
  ctx.font = `700 34px ${body}`;
  ctx.fillText(card.footer, cx, cardY + cardH + 10 + 64);
  return toPng(canvas);
}
