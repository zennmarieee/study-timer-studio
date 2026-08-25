import { TimerConfig } from "./types";

export const templates: {
  name: string;
  note: string;
  patch: Partial<TimerConfig>;
}[] = [
  { name: "Minimal", note: "Warm and quiet", patch: {} },
  {
    name: "Dark minimal",
    note: "Soft contrast",
    patch: { backgroundColor: "#1d1e1b", color: "#f2f0e8", fontWeight: 400 },
  },
  {
    name: "Academic",
    note: "Editorial serif",
    patch: {
      font: "Playfair Display",
      backgroundColor: "#ede7d8",
      color: "#28372d",
      showSubtitle: true,
      subtitle: "Deep reading",
    },
  },
  {
    name: "Mono",
    note: "Precise and spare",
    patch: {
      font: "IBM Plex Mono",
      backgroundColor: "#e8e8e3",
      color: "#171816",
      letterSpacing: 2,
    },
  },
  {
    name: "Cozy",
    note: "Muted evening",
    patch: {
      backgroundType: "gradient",
      gradientStart: "#3b302d",
      gradientEnd: "#78665d",
      color: "#fff4e8",
      showSubtitle: true,
      subtitle: "One page at a time",
    },
  },
  {
    name: "Focus",
    note: "Clear and direct",
    patch: {
      font: "DM Sans",
      backgroundColor: "#dfe5dc",
      color: "#1e2d25",
      fontWeight: 600,
      showSession: true,
    },
  },
];
