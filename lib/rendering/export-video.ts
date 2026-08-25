import { ArrayBufferTarget, Muxer } from "webm-muxer";
import { ExportQuality, TimerConfig } from "../types";
import { drawFrame } from "./draw-frame";

type ProgressCallback = (value: number) => void;

export async function exportVideo(config: TimerConfig, onProgress: ProgressCallback, signal?: AbortSignal): Promise<Blob> {
  throwIfAborted(signal);
  if ("VideoEncoder" in window && "VideoFrame" in window) {
    return exportWithWebCodecs(config, onProgress, signal);
  }
  return exportWithMediaRecorder(config, onProgress, signal);
}

async function exportWithWebCodecs(config: TimerConfig, onProgress: ProgressCallback, signal?: AbortSignal): Promise<Blob> {
  const [width, height] = config.resolution.split("x").map(Number);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Canvas is unavailable.");
  await document.fonts.ready;
  const image = await loadBackgroundImage(config);
  const codec = "vp09.00.10.08";
  const encoderConfig: VideoEncoderConfig = {
    codec, width, height, framerate: config.fps,
    // UI graphics need substantially more headroom than camera footage at the
    // same apparent complexity: ringing around glyph edges is very noticeable.
    bitrate: qualityBitrate(config.exportQuality, width * height),
    bitrateMode: "variable", latencyMode: "quality",
    alpha: config.backgroundType === "transparent" ? "keep" : "discard",
  };
  const support = await VideoEncoder.isConfigSupported(encoderConfig);
  if (!support.supported) return exportWithMediaRecorder(config, onProgress, signal);

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: { codec: "V_VP9", width, height, frameRate: config.fps },
    firstTimestampBehavior: "offset",
  });
  let encodingError: Error | undefined;
  const encoder = new VideoEncoder({
    output: (chunk, metadata) => muxer.addVideoChunk(chunk, metadata),
    error: error => { encodingError = error; },
  });
  encoder.configure(support.config ?? encoderConfig);

  // Only the once-per-second timer display changes. Explicit timestamps let
  // the codec hold each frame while encoding far faster than real time.
  const samplesPerSecond = qualitySamples(config.exportQuality);
  try {
    const frameCount = Math.max(1, Math.ceil(config.duration * samplesPerSecond));
    const frameDuration = 1_000_000 / samplesPerSecond;
    for (let index = 0; index < frameCount; index++) {
      throwIfAborted(signal);
      if (encodingError) throw encodingError;
      await drawFrame(ctx, config, config.duration - index / samplesPerSecond, image);
      const frame = new VideoFrame(canvas, { timestamp: index * frameDuration, duration: frameDuration });
      // VP9 rate control needs a few frames to settle. Independent early frames
      // prevent its startup GOP from smearing high-contrast timer glyphs.
      const keyFrame = index < samplesPerSecond * 8 || index % (samplesPerSecond * 5) === 0;
      encoder.encode(frame, { keyFrame });
      frame.close();
      if (encoder.encodeQueueSize > 12) await encoder.flush();
      onProgress(Math.round(((index + 1) / frameCount) * 98));
      if (index % 8 === 0) await nextTask();
    }
    await encoder.flush();
    if (encodingError) throw encodingError;
    encoder.close();
    muxer.finalize();
    onProgress(100);
    return new Blob([target.buffer], { type: "video/webm" });
  } catch (error) {
    if (encoder.state !== "closed") encoder.close();
    throw error;
  }
}

async function exportWithMediaRecorder(config: TimerConfig, onProgress: ProgressCallback, signal?: AbortSignal): Promise<Blob> {
  if (!window.MediaRecorder) throw new Error("Video export is not supported in this browser.");
  const [width, height] = config.resolution.split("x").map(Number);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { alpha: true });
  if (!ctx) throw new Error("Canvas is unavailable.");
  const image = await loadBackgroundImage(config);
  const mimeType = ["video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm"].find(MediaRecorder.isTypeSupported) || "";
  const stream = canvas.captureStream(config.fps);
  const recorder = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 8_000_000 } : undefined);
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data); };
  const done = new Promise<Blob>((resolve, reject) => {
    recorder.onerror = () => reject(new Error("The browser recorder stopped unexpectedly."));
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType || "video/webm" }));
  });
  recorder.start(500);
  const started = performance.now();
  await new Promise<void>((resolve, reject) => {
    const tick = async () => {
      if (signal?.aborted) {
        recorder.stop();
        stream.getTracks().forEach(track => track.stop());
        reject(abortError());
        return;
      }
      const elapsed = (performance.now() - started) / 1000;
      await drawFrame(ctx, config, Math.max(0, config.duration - elapsed), image);
      onProgress(Math.min(99, elapsed / config.duration * 100));
      if (elapsed >= config.duration) resolve(); else requestAnimationFrame(tick);
    };
    tick();
  });
  recorder.requestData();
  await new Promise(resolve => setTimeout(resolve, 250));
  recorder.stop();
  const blob = await done;
  stream.getTracks().forEach(track => track.stop());
  onProgress(100);
  return blob;
}

async function loadBackgroundImage(config: TimerConfig) {
  if (config.backgroundType !== "image" || !config.backgroundImage) return undefined;
  const image = new Image();
  image.src = config.backgroundImage;
  await image.decode();
  return image;
}

const nextTask = () => new Promise<void>(resolve => setTimeout(resolve, 0));

function qualitySamples(quality: ExportQuality) {
  return quality === "efficient" ? 1 : quality === "balanced" ? 3 : 8;
}

function qualityBitrate(quality: ExportQuality, pixels: number) {
  const base = pixels > 2_100_000 ? 8_000_000 : 5_000_000;
  return quality === "efficient" ? base * 0.7 : quality === "smooth" ? base * 1.25 : base;
}

function abortError() {
  return new DOMException("Export cancelled", "AbortError");
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw abortError();
}
