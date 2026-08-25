# Study Timer Studio

A quiet, browser-based design tool for creating customizable countdown timer videos for Study With Me videos, YouTube, Shorts, TikTok, Reels, and other creative projects.

**Customize → Preview → Export → Download**

Study Timer Studio runs locally in the browser. It does not require an account, database, backend, or file upload service.

## Features

- Preset and custom countdown durations
- Live canvas preview with play, pause, and restart controls
- Curated fonts, weights, sizes, alignment, positioning, and letter spacing
- Solid, gradient, uploaded-image, and transparent backgrounds
- Optional session label, subtitle, session number, and progress bar
- A small collection of editable design templates
- Landscape, portrait, and square video resolutions
- Efficient, Balanced, and Smooth motion-quality modes
- Fast client-side WebCodecs export where supported
- WebM download with real-time browser fallback
- Automatic local draft saving
- Responsive desktop, laptop, and tablet interface

## Getting Started

### Requirements

- Node.js 18.18 or newer
- npm
- Chrome or Edge recommended for fast video encoding

### Installation

```bash
git clone https://github.com/zennmarieee/study-timer-studio.git
cd study-timer-studio
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Commands

```bash
npm run dev    # Start the development server
npm run build  # Create and verify a production build
npm run start  # Serve the production build
```

## Video Export

Video generation happens entirely on the user's device.

- Browsers with WebCodecs support encode the timer faster than real time.
- Unsupported browsers use a MediaRecorder compatibility fallback, which runs in real time.
- Exported files use WebM because consistent client-side MP4 encoding is not yet available across browsers.
- Transparent VP9 export is experimental and should be tested in the destination video editor before rendering a long timer.
- Long exports are assembled in browser memory, so Efficient quality is recommended for lengthy timers.

The preview and exporter share the same canvas renderer to keep the downloaded composition consistent with the editor.

## Project Structure

```text
app/
  globals.css             Application styling
  layout.tsx              Root layout and fonts
  page.tsx                Application entry point
components/
  studio.tsx              Landing page and timer editor interface
lib/
  rendering/
    draw-frame.ts         Shared canvas composition renderer
    export-video.ts       WebCodecs and MediaRecorder exporters
  templates.ts            Curated timer templates
  types.ts                Serializable editor configuration
```

## Technology

- Next.js
- React
- TypeScript
- Tailwind CSS
- Canvas API
- WebCodecs
- MediaRecorder

## Privacy

Timer settings and uploaded images remain in the browser. Study Timer Studio does not upload creator assets to a server. Small designs are saved locally for convenience; large uploaded images remain available only for the current session.

## Current Scope

Study Timer Studio is intentionally a focused creative utility rather than a productivity suite or full video editor. Features such as accounts, cloud storage, task management, social tools, and subscriptions are outside the MVP scope.

## License

No license has been selected yet. All rights are reserved unless a license is added to the repository.
