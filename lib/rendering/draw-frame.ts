import { TimerConfig } from "../types";

export function formatTime(seconds: number) {
  const safe = Math.max(0, Math.ceil(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return h
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export async function drawFrame(
  ctx: CanvasRenderingContext2D,
  config: TimerConfig,
  remaining: number,
  image?: HTMLImageElement,
) {
  const { width: w, height: h } = ctx.canvas;
  ctx.clearRect(0, 0, w, h);
  if (config.backgroundType === "solid") {
    ctx.fillStyle = config.backgroundColor;
    ctx.fillRect(0, 0, w, h);
  }
  if (config.backgroundType === "gradient") {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, config.gradientStart);
    g.addColorStop(1, config.gradientEnd);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
  if (config.backgroundType === "image" && image) {
    const scale = Math.max(w / image.width, h / image.height);
    const dw = image.width * scale,
      dh = image.height * scale;
    ctx.drawImage(image, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }
  const scale = w / 1920;
  const y =
    config.position === "top"
      ? h * 0.25
      : config.position === "bottom"
        ? h * 0.72
        : h * 0.48;
  ctx.textAlign = config.align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = config.color;
  const x =
    config.align === "left"
      ? w * 0.1
      : config.align === "right"
        ? w * 0.9
        : w / 2;
  ctx.font = `${config.fontWeight} ${config.fontSize * scale}px "${config.font}", sans-serif`;
  fillTextWithSpacing(ctx, formatTime(remaining), x, y, config.letterSpacing * scale);
  ctx.textAlign = "center";
  if (config.showLabel) {
    ctx.font = `500 ${18 * scale}px Inter, sans-serif`;
    ctx.fillText(
      config.label.toUpperCase(),
      w / 2,
      y + config.fontSize * scale * 0.72,
    );
  }
  if (config.showSubtitle) {
    ctx.globalAlpha = 0.7;
    ctx.font = `400 ${16 * scale}px Inter, sans-serif`;
    ctx.fillText(config.subtitle, w / 2, y + config.fontSize * scale * 1.05);
    ctx.globalAlpha = 1;
  }
  if (config.showSession) {
    ctx.textAlign = "left";
    ctx.font = `500 ${14 * scale}px Inter, sans-serif`;
    ctx.fillText(`SESSION ${config.session}`, w * 0.055, h * 0.08);
  }
  if (config.showProgress) {
    const px = w * 0.12,
      py = h * 0.86,
      pw = w * 0.76;
    ctx.globalAlpha = 0.22;
    ctx.fillRect(px, py, pw, Math.max(2, 3 * scale));
    ctx.globalAlpha = 1;
    ctx.fillRect(
      px,
      py,
      pw * (1 - remaining / Math.max(1, config.duration)),
      Math.max(2, 3 * scale),
    );
  }
}

function fillTextWithSpacing(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
) {
  if (!spacing) {
    ctx.fillText(text, x, y);
    return;
  }
  const widths = [...text].map(character => ctx.measureText(character).width);
  const total = widths.reduce((sum, width) => sum + width, 0) + spacing * (text.length - 1);
  let cursor = ctx.textAlign === "center" ? x - total / 2 : ctx.textAlign === "right" ? x - total : x;
  const previousAlign = ctx.textAlign;
  ctx.textAlign = "left";
  [...text].forEach((character, index) => {
    ctx.fillText(character, cursor, y);
    cursor += widths[index] + spacing;
  });
  ctx.textAlign = previousAlign;
}
