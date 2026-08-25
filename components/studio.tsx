"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Download,
  Image as ImageIcon,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { initialConfig, TimerConfig } from "@/lib/types";
import { templates } from "@/lib/templates";
import { drawFrame, formatTime } from "@/lib/rendering/draw-frame";
import { exportVideo } from "@/lib/rendering/export-video";

const fonts = [
  "Inter",
  "DM Sans",
  "IBM Plex Mono",
  "Space Mono",
  "Playfair Display",
  "system-ui",
];
const DRAFT_KEY = "study-timer-studio:draft:v1";

export function Studio() {
  const [view, setView] = useState<"landing" | "editor">("landing");
  const [config, setConfig] = useState(initialConfig);
  const [draftReady, setDraftReady] = useState(false);
  const [saveState, setSaveState] = useState<"saved" | "saving" | "session">("saved");
  useEffect(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) setConfig({ ...initialConfig, ...JSON.parse(draft) });
    } catch { setSaveState("session"); }
    setDraftReady(true);
  }, []);
  useEffect(() => {
    if (!draftReady) return;
    setSaveState("saving");
    const timer = window.setTimeout(() => {
      try {
        const imageTooLarge = (config.backgroundImage?.length ?? 0) > 1_500_000;
        const draft = imageTooLarge
          ? { ...config, backgroundImage: undefined, backgroundType: "solid" as const }
          : config;
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
        setSaveState(imageTooLarge ? "session" : "saved");
      } catch { setSaveState("session"); }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [config, draftReady]);
  const patch = (next: Partial<TimerConfig>) =>
    setConfig((c) => ({ ...c, ...next }));
  if (view === "landing")
    return (
      <Landing
        onCreate={() => setView("editor")}
        onTemplate={() => {
          setView("editor");
          setTimeout(
            () => document.getElementById("templates")?.scrollIntoView(),
            50,
          );
        }}
      />
    );
  return (
    <Editor config={config} patch={patch} saveState={saveState} onHome={() => setView("landing")} />
  );
}

function Landing({
  onCreate,
  onTemplate,
}: {
  onCreate: () => void;
  onTemplate: () => void;
}) {
  return (
    <main className="landing">
      <nav className="landing-nav">
        <button className="wordmark" onClick={onCreate}>
          <Logo /> Study Timer Studio
        </button>
        <button className="text-button" onClick={onCreate}>
          Open studio <ArrowRight size={15} />
        </button>
      </nav>
      <section className="hero">
        <div className="eyebrow">
          <Sparkles size={13} /> A quiet tool for focused creators
        </div>
        <h1>
          Create beautiful countdown timers for your <em>study videos.</em>
        </h1>
        <p>
          Create a timer, customize the design, and export it as a video for
          your own content.
        </p>
        <div className="hero-actions">
          <button className="primary large" onClick={onCreate}>
            Create a timer <ArrowRight size={16} />
          </button>
          <button className="secondary large" onClick={onTemplate}>
            Explore templates
          </button>
        </div>
      </section>
      <button
        className="product-shot"
        onClick={onCreate}
        aria-label="Open timer editor"
      >
        <div className="mock-side">
          <span />
          <span />
          <span />
          <span />
        </div>
        <div className="mock-canvas">
          <small>FOCUS SESSION</small>
          <strong>50:00</strong>
          <i>
            <b />
          </i>
        </div>
      </button>
      <section className="steps">
        <p>From idea to overlay, without the editing clutter.</p>
        <div>
          {["Set your time", "Make it yours", "Export & edit"].map((x, i) => (
            <article key={x}>
              <span>0{i + 1}</span>
              <h3>{x}</h3>
              <p>
                {
                  [
                    "Choose a preset or enter an exact duration.",
                    "Refine type, color, spacing, and background.",
                    "Download a video ready for your editor.",
                  ][i]
                }
              </p>
            </article>
          ))}
        </div>
      </section>
      <footer>
        <span>
          <Logo /> Study Timer Studio
        </span>
        <p>Made for the hours that matter.</p>
      </footer>
    </main>
  );
}

function Editor({
  config,
  patch,
  saveState,
  onHome,
}: {
  config: TimerConfig;
  patch: (x: Partial<TimerConfig>) => void;
  saveState: "saved" | "saving" | "session";
  onHome: () => void;
}) {
  const [tab, setTab] = useState<"design" | "templates">("design");
  const [exportOpen, setExportOpen] = useState(false);
  return (
    <main className="app-shell">
      <header className="topbar">
        <button className="wordmark" onClick={onHome}>
          <Logo /> <span>Study Timer Studio</span>
        </button>
        <div className="save-state">
          <Check size={13} /> {saveState === "saved" ? "Saved locally" : saveState === "saving" ? "Saving…" : "Saved this session"}
        </div>
        <button className="primary" onClick={() => setExportOpen(true)}>
          Export video <ArrowRight size={14} />
        </button>
      </header>
      <div className="workspace">
        <aside className="sidebar">
          <div className="tabs">
            <button
              className={tab === "design" ? "active" : ""}
              onClick={() => setTab("design")}
            >
              Design
            </button>
            <button
              className={tab === "templates" ? "active" : ""}
              onClick={() => setTab("templates")}
            >
              Templates
            </button>
          </div>
          {tab === "design" ? (
            <Controls config={config} patch={patch} />
          ) : (
            <TemplateList config={config} patch={patch} />
          )}
        </aside>
        <Preview config={config} />
      </div>
      {exportOpen && (
        <ExportPanel
          config={config}
          patch={patch}
          onClose={() => setExportOpen(false)}
        />
      )}
    </main>
  );
}

function Controls({
  config,
  patch,
}: {
  config: TimerConfig;
  patch: (x: Partial<TimerConfig>) => void;
}) {
  const file = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () =>
      patch({
        backgroundImage: String(reader.result),
        backgroundType: "image",
      });
    reader.readAsDataURL(f);
  };
  return (
    <div className="controls">
      <Section title="Timer">
        <div className="preset-row">
          {[25, 50, 90].map((m) => (
            <button
              key={m}
              className={config.duration === m * 60 ? "selected" : ""}
              onClick={() => patch({ duration: m * 60 })}
            >
              {m} min
            </button>
          ))}
        </div>
        <label>
          Custom duration
          <div className="duration-inputs">
            <TimeInput
              label="Hr"
              value={Math.floor(config.duration / 3600)}
              set={(v) =>
                patch({ duration: v * 3600 + (config.duration % 3600) })
              }
            />
            <TimeInput
              label="Min"
              value={Math.floor((config.duration % 3600) / 60)}
              set={(v) =>
                patch({
                  duration:
                    Math.floor(config.duration / 3600) * 3600 +
                    v * 60 +
                    (config.duration % 60),
                })
              }
            />
            <TimeInput
              label="Sec"
              value={config.duration % 60}
              set={(v) =>
                patch({ duration: Math.floor(config.duration / 60) * 60 + v })
              }
            />
          </div>
        </label>
      </Section>
      <Section title="Typography">
        <Field label="Font">
          <select
            value={config.font}
            onChange={(e) => patch({ font: e.target.value })}
          >
            {fonts.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </select>
          <ChevronDown size={14} />
        </Field>
        <div className="split">
          <Field label="Size">
            <input
              type="number"
              min="24"
              max="240"
              value={config.fontSize}
              onChange={(e) => patch({ fontSize: +e.target.value })}
            />
            <span>px</span>
          </Field>
          <Field label="Weight">
            <select
              value={config.fontWeight}
              onChange={(e) => patch({ fontWeight: +e.target.value })}
            >
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
            </select>
            <ChevronDown size={14} />
          </Field>
        </div>
        <Range
          label="Letter spacing"
          value={config.letterSpacing}
          min={-8}
          max={16}
          onChange={(v) => patch({ letterSpacing: v })}
          unit="px"
        />
        <div className="split">
          <Segment
            label="Alignment"
            values={[
              ["L", "left"],
              ["C", "center"],
              ["R", "right"],
            ]}
            current={config.align}
            onPick={(v) => patch({ align: v as CanvasTextAlign })}
          />
          <Segment
            label="Position"
            values={[
              ["Top", "top"],
              ["Mid", "center"],
              ["Low", "bottom"],
            ]}
            current={config.position}
            onPick={(v) => patch({ position: v as TimerConfig["position"] })}
          />
        </div>
        <ColorField
          label="Timer color"
          value={config.color}
          onChange={(v) => patch({ color: v })}
        />
      </Section>
      <Section title="Background">
        <div className="preset-row four">
          {(["solid", "gradient", "image", "transparent"] as const).map((x) => (
            <button
              key={x}
              className={config.backgroundType === x ? "selected" : ""}
              onClick={() => patch({ backgroundType: x })}
            >
              {x}
            </button>
          ))}
        </div>
        {config.backgroundType === "solid" && (
          <ColorField
            label="Background color"
            value={config.backgroundColor}
            onChange={(v) => patch({ backgroundColor: v })}
          />
        )}
        {config.backgroundType === "gradient" && (
          <div className="split">
            <ColorField
              label="From"
              value={config.gradientStart}
              onChange={(v) => patch({ gradientStart: v })}
            />
            <ColorField
              label="To"
              value={config.gradientEnd}
              onChange={(v) => patch({ gradientEnd: v })}
            />
          </div>
        )}
        {config.backgroundType === "image" && (
          <label className="upload">
            <Upload size={15} />{" "}
            {config.backgroundImage ? "Replace image" : "Upload an image"}
            <input type="file" accept="image/*" onChange={file} />
          </label>
        )}
        {config.backgroundType === "transparent" && (
          <p className="hint">
            Transparency is preserved where the browser’s WebM codec supports an
            alpha channel.
          </p>
        )}
      </Section>
      <Section title="Elements">
        <Toggle
          label="Session label"
          on={config.showLabel}
          set={(v) => patch({ showLabel: v })}
        />
        {config.showLabel && (
          <input
            className="inline-input"
            value={config.label}
            onChange={(e) => patch({ label: e.target.value })}
            aria-label="Session label text"
          />
        )}
        <Toggle
          label="Progress bar"
          on={config.showProgress}
          set={(v) => patch({ showProgress: v })}
        />
        <Toggle
          label="Session number"
          on={config.showSession}
          set={(v) => patch({ showSession: v })}
        />
        <Toggle
          label="Small subtitle"
          on={config.showSubtitle}
          set={(v) => patch({ showSubtitle: v })}
        />
        {config.showSubtitle && (
          <input
            className="inline-input"
            value={config.subtitle}
            onChange={(e) => patch({ subtitle: e.target.value })}
            aria-label="Subtitle text"
          />
        )}
      </Section>
    </div>
  );
}

function Preview({ config }: { config: TimerConfig }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const image = useRef<HTMLImageElement | undefined>(undefined);
  const [remaining, setRemaining] = useState(config.duration);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    setRemaining(config.duration);
    setPlaying(false);
  }, [config.duration]);
  useEffect(() => {
    if (!config.backgroundImage) {
      image.current = undefined;
      return;
    }
    const i = new Image();
    i.src = config.backgroundImage;
    i.onload = () => {
      image.current = i;
      setRemaining((r) => r - 0.00001);
    };
  }, [config.backgroundImage]);
  useEffect(() => {
    let id: number;
    let last = performance.now();
    const tick = (now: number) => {
      const delta = (now - last) / 1000;
      last = now;
      if (playing)
        setRemaining((r) => {
          if (r <= delta) {
            setPlaying(false);
            return 0;
          }
          return r - delta;
        });
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [playing]);
  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (ctx) drawFrame(ctx, config, remaining, image.current);
  }, [config, remaining]);
  const ratio =
    config.resolution === "1080x1920"
      ? "portrait"
      : config.resolution === "1080x1080"
        ? "square"
        : "landscape";
  return (
    <section className="preview-area">
      <div className="preview-head">
        <div>
          <span>Live preview</span>
          <small>
            {config.resolution.replace("x", " × ")} · Canvas preview
          </small>
        </div>
        <div className="preview-actions">
          <button
            onClick={() => setRemaining(config.duration)}
            aria-label="Restart preview"
          >
            <RotateCcw size={15} />
          </button>
          <button
            className="play"
            onClick={() => setPlaying((x) => !x)}
            aria-label={playing ? "Pause preview" : "Play preview"}
          >
            {playing ? (
              <Pause size={15} fill="currentColor" />
            ) : (
              <Play size={15} fill="currentColor" />
            )}
          </button>
        </div>
      </div>
      <div className="canvas-stage">
        <div className={`canvas-wrap ${ratio}`}>
          <canvas
            ref={canvas}
            width="1920"
            height={
              ratio === "portrait" ? 3413 : ratio === "square" ? 1920 : 1080
            }
          />
        </div>
      </div>
      <div className="preview-foot">
        <span>{formatTime(remaining)}</span>
        <span>Preview scales to fit · exports at full resolution</span>
      </div>
    </section>
  );
}

function TemplateList({
  config,
  patch,
}: {
  config: TimerConfig;
  patch: (x: Partial<TimerConfig>) => void;
}) {
  return (
    <div className="template-list" id="templates">
      <div className="panel-intro">
        <span>CURATED STYLES</span>
        <p>Start somewhere considered. Every detail remains editable.</p>
      </div>
      {templates.map((t, i) => (
        <button
          key={t.name}
          onClick={() =>
            patch({ ...initialConfig, duration: config.duration, ...t.patch })
          }
        >
          <div
            style={{
              background:
                t.patch.backgroundType === "gradient"
                  ? `linear-gradient(135deg,${t.patch.gradientStart},${t.patch.gradientEnd})`
                  : t.patch.backgroundColor || initialConfig.backgroundColor,
              color: t.patch.color || initialConfig.color,
              fontFamily: t.patch.font || initialConfig.font,
            }}
          >
            <b>25:00</b>
            <i />
          </div>
          <span>
            <strong>{t.name}</strong>
            <small>{t.note}</small>
          </span>
          {i === 0 && <em>Current</em>}
        </button>
      ))}
    </div>
  );
}

function ExportPanel({
  config,
  patch,
  onClose,
}: {
  config: TimerConfig;
  patch: (x: Partial<TimerConfig>) => void;
  onClose: () => void;
}) {
  const [progress, setProgress] = useState(0),
    [blob, setBlob] = useState<Blob>(),
    [error, setError] = useState("");
  const [working, setWorking] = useState(false);
  const [fastSupported, setFastSupported] = useState<boolean | null>(null);
  const [downloadUrl, setDownloadUrl] = useState("");
  const controller = useRef<AbortController | undefined>(undefined);
  useEffect(() => setFastSupported("VideoEncoder" in window && "VideoFrame" in window), []);
  useEffect(() => {
    if (!blob) { setDownloadUrl(""); return; }
    const url = URL.createObjectURL(blob);
    setDownloadUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  const start = async () => {
    setError("");
    setBlob(undefined);
    setWorking(true);
    setProgress(0);
    controller.current = new AbortController();
    try {
      setBlob(await exportVideo(config, setProgress, controller.current.signal));
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") setError("Export cancelled. Your design is unchanged.");
      else setError("Something went wrong while generating the video. Try Efficient quality, a shorter duration, or lower resolution.");
    } finally {
      setWorking(false);
      controller.current = undefined;
    }
  };
  const cancel = () => controller.current?.abort();
  const filename = `study-timer-${Math.ceil(config.duration / 60)}min.webm`;
  const isLongExport = config.duration >= 45 * 60 || (config.duration >= 20 * 60 && config.exportQuality === "smooth");
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && !working && onClose()}
    >
      <aside className="export-panel">
        <div className="export-title">
          <div>
            <span>Export video</span>
            <small>Generated locally in your browser</small>
          </div>
          <button
            onClick={onClose}
            disabled={working}
            aria-label="Close export panel"
          >
            <X size={18} />
          </button>
        </div>
        <div className="export-body">
          <Section title="Format">
            <Field label="Resolution">
              <select
                value={config.resolution}
                onChange={(e) =>
                  patch({
                    resolution: e.target.value as TimerConfig["resolution"],
                  })
                }
              >
                <option value="1920x1080">Landscape · 1920 × 1080</option>
                <option value="1080x1920">Portrait · 1080 × 1920</option>
                <option value="1080x1080">Square · 1080 × 1080</option>
              </select>
              <ChevronDown size={14} />
            </Field>
            <Segment
              label="Motion quality"
              values={[
                ["Efficient", "efficient"],
                ["Balanced", "balanced"],
                ["Smooth", "smooth"],
              ]}
              current={config.exportQuality}
              onPick={(v) => patch({ exportQuality: v as TimerConfig["exportQuality"] })}
            />
            <p className="hint">Efficient updates motion once per second. Balanced uses 3 samples per second; Smooth uses 8.</p>
          </Section>
          <Section title="Summary">
            <div className="summary">
              <span>
                Duration <b>{formatTime(config.duration)}</b>
              </span>
              <span>
                Background <b>{config.backgroundType}</b>
              </span>
              <span>
                Format <b>WebM video</b>
              </span>
              <span>
                Quality <b>{config.exportQuality}</b>
              </span>
              <span>
                Filename <b>{filename}</b>
              </span>
            </div>
          </Section>
          {config.backgroundType === "transparent" && <p className="export-warning">Transparency uses experimental VP9 alpha support. Test a short export in your editor before rendering a long timer.</p>}
          {fastSupported === false && <p className="export-warning">Fast encoding is unavailable in this browser, so export will run in real time. Chrome or Edge is recommended for long timers.</p>}
          {isLongExport && <p className="export-warning">Long exports are assembled in browser memory. Close unused tabs and choose Efficient quality if this export becomes unstable.</p>}
          {working && (
            <div className="render-status">
              <span>
                <b>Encoding video…</b>
                <i>{Math.round(progress)}%</i>
              </span>
              <div>
                <i style={{ width: `${progress}%` }} />
              </div>
              <p>Keep this tab open while the browser encodes your frames.</p>
              <button className="cancel-export" onClick={cancel}>Cancel export</button>
            </div>
          )}
          {error && <p className="error">{error}</p>}
          {blob && (
            <div className="success">
              <Check size={16} />
              <span>
                <b>Your video is ready.</b>
                <small>{(blob.size / 1024 / 1024).toFixed(1)} MB · WebM</small>
              </span>
            </div>
          )}
          <p className="compat-note">
            MP4 encoding is not consistently available in browsers yet. WebM
            works in modern editors including CapCut, Premiere Pro, and DaVinci
            Resolve.
          </p>
        </div>
        <div className="export-footer">
          {blob ? (
            <a
              className="primary wide"
              href={downloadUrl}
              download={filename}
            >
              <Download size={16} /> Download video
            </a>
          ) : (
            <button className="primary wide" onClick={start} disabled={working}>
              {working ? "Encoding…" : "Generate video"}
              <ArrowRight size={15} />
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="control-section">
      <h2>{title}</h2>
      {children}
    </section>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <div>{children}</div>
    </label>
  );
}
function TimeInput({
  label,
  value,
  set,
}: {
  label: string;
  value: number;
  set: (v: number) => void;
}) {
  return (
    <label>
      <input
        type="number"
        min="0"
        max={label === "Hr" ? 12 : 59}
        value={value}
        onChange={(e) => set(Math.max(0, +e.target.value))}
      />
      <span>{label}</span>
    </label>
  );
}
function Range({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="range">
      <span>
        {label}
        <i>
          {value}
          {unit}
        </i>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
      />
    </label>
  );
}
function Segment({
  label,
  values,
  current,
  onPick,
}: {
  label: string;
  values: string[][];
  current: string;
  onPick: (v: string) => void;
}) {
  return (
    <div className="segment-field">
      <span>{label}</span>
      <div>
        {values.map(([l, v]) => (
          <button
            key={v}
            className={current === v ? "selected" : ""}
            onClick={() => onPick(v)}
          >
            {l}
          </button>
        ))}
      </div>
    </div>
  );
}
function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="color-field">
      <span>{label}</span>
      <div>
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          value={value.toUpperCase()}
          onChange={(e) =>
            /^#[0-9a-f]{6}$/i.test(e.target.value) && onChange(e.target.value)
          }
        />
      </div>
    </label>
  );
}
function Toggle({
  label,
  on,
  set,
}: {
  label: string;
  on: boolean;
  set: (v: boolean) => void;
}) {
  return (
    <label className="toggle-row">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={on}
        onChange={(e) => set(e.target.checked)}
      />
      <i />
    </label>
  );
}
function Logo() {
  return (
    <span className="logo">
      <i />
      <i />
      <i />
    </span>
  );
}
