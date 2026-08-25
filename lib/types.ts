export type BackgroundType = "solid" | "gradient" | "image" | "transparent";
export type Position = "top" | "center" | "bottom";
export type ExportQuality = "efficient" | "balanced" | "smooth";

export interface TimerConfig {
  duration: number;
  font: string;
  fontSize: number;
  fontWeight: number;
  letterSpacing: number;
  color: string;
  align: CanvasTextAlign;
  position: Position;
  backgroundType: BackgroundType;
  backgroundColor: string;
  gradientStart: string;
  gradientEnd: string;
  backgroundImage?: string;
  showLabel: boolean;
  label: string;
  showSubtitle: boolean;
  subtitle: string;
  showProgress: boolean;
  showSession: boolean;
  session: number;
  resolution: "1920x1080" | "1080x1920" | "1080x1080";
  fps: 30 | 60;
  exportQuality: ExportQuality;
}

export const initialConfig: TimerConfig = {
  duration: 50 * 60,
  font: "Inter",
  fontSize: 112,
  fontWeight: 500,
  letterSpacing: -3,
  color: "#25241f",
  align: "center",
  position: "center",
  backgroundType: "solid",
  backgroundColor: "#f2efe8",
  gradientStart: "#ece6db",
  gradientEnd: "#d8e0d5",
  showLabel: true,
  label: "FOCUS SESSION",
  showSubtitle: false,
  subtitle: "Stay with the work",
  showProgress: true,
  showSession: false,
  session: 1,
  resolution: "1920x1080",
  fps: 30,
  exportQuality: "balanced",
};
