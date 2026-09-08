import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const assetDirectory = path.join(root, "docs", "assets", "showcase");
const demoDirectory = path.join(root, "docs", "demo");
const frameDirectory = path.join(demoDirectory, "multilingual-frames");
const segmentDirectory = path.join(demoDirectory, "multilingual-segments");
const audioDirectory = path.join(demoDirectory, "multilingual-audio");
const output = path.join(demoDirectory, "voiceops-10-language-showcase.mp4");
const contactSheet = path.join(demoDirectory, "voiceops-10-language-contact-sheet.jpg");
const fps = 30;

const locales = [
  { code: "tr", name: "TÜRKÇE", phrase: "Yarın saat üç için randevu almak istiyorum." },
  { code: "en", name: "ENGLISH", phrase: "I'd like to book an appointment tomorrow at three." },
  { code: "es", name: "ESPAÑOL", phrase: "Quiero reservar una cita mañana a las tres." },
  { code: "de", name: "DEUTSCH", phrase: "Ich möchte morgen um fünfzehn Uhr einen Termin buchen." },
  { code: "fr", name: "FRANÇAIS", phrase: "Je souhaite prendre rendez-vous demain à quinze heures." },
  { code: "it", name: "ITALIANO", phrase: "Vorrei prenotare un appuntamento domani alle quindici." },
  { code: "pt", name: "PORTUGUÊS", phrase: "Quero marcar um horário amanhã às quinze horas." },
  { code: "nl", name: "NEDERLANDS", phrase: "Ik wil morgen om vijftien uur een afspraak boeken." },
  { code: "pl", name: "POLSKI", phrase: "Chcę umówić się na jutro na piętnastą." },
  { code: "ru", name: "РУССКИЙ", phrase: "Я хочу записаться на завтра на пятнадцать часов." },
];

await Promise.all([
  mkdir(frameDirectory, { recursive: true }),
  mkdir(segmentDirectory, { recursive: true }),
]);

function escapeXml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function wrap(value, width = 34) {
  const words = value.split(/\s+/u);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (line && `${line} ${word}`.length > width) {
      lines.push(line);
      line = word;
    } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines.slice(0, 2);
}

function baseSvg(content) {
  return `<svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1350" fill="#090c0b"/>
  <style>
    .sans{font-family:'Arial',sans-serif}.mono{font-family:'Courier New',monospace}
    .white{fill:#f4f1e9}.muted{fill:#9b9f9a}.orange{fill:#ed7d38}.green{fill:#61c59c}
  </style>${content}</svg>`;
}

async function renderSvg(name, markup) {
  const svgPath = path.join(frameDirectory, `${name}.svg`);
  const pngPath = path.join(frameDirectory, `${name}.png`);
  await writeFile(svgPath, markup);
  execFileSync("rsvg-convert", ["-w", "1080", "-h", "1350", svgPath, "-o", pngPath]);
  return pngPath;
}

const titleFrame = await renderSvg("00-title", baseSvg(`
  <rect x="64" y="76" width="64" height="6" class="orange"/>
  <text x="64" y="138" class="mono orange" font-size="23" font-weight="700" letter-spacing="3">VOICEOPS STUDIO / PRODUCT DEMO</text>
  <text x="64" y="390" class="sans white" font-size="118" font-weight="800" letter-spacing="-5">10 DİLDE</text>
  <text x="64" y="515" class="sans white" font-size="118" font-weight="800" letter-spacing="-5">TEK AKIŞ.</text>
  <text x="64" y="630" class="sans muted" font-size="38">Müşteri konuşur. Nova anlar.</text>
  <text x="64" y="682" class="sans muted" font-size="38">Operasyon kaydı hazır olur.</text>
  <g transform="translate(64 880)">
    <rect width="952" height="260" rx="18" fill="#111714" stroke="#28322d"/>
    <text x="36" y="62" class="mono orange" font-size="20" font-weight="700">VOICE PIPELINE</text>
    <text x="36" y="140" class="sans white" font-size="42" font-weight="700">Dinle → Anla → Yanıtla → Kaydet</text>
    <text x="36" y="204" class="sans green" font-size="25">Türkçe · English · Español · Deutsch · Français</text>
    <text x="36" y="238" class="sans green" font-size="25">Italiano · Português · Nederlands · Polski · Русский</text>
  </g>`));

const localeFrames = [];
for (let index = 0; index < locales.length; index += 1) {
  const locale = locales[index];
  const lines = wrap(locale.phrase);
  const overlay = await renderSvg(`${String(index + 1).padStart(2, "0")}-${locale.code}-overlay`, `<svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
    <style>.sans{font-family:'Arial',sans-serif}.mono{font-family:'Courier New',monospace}</style>
    <rect x="50" y="40" width="980" height="238" rx="18" fill="#090c0b" fill-opacity=".96" stroke="#28322d"/>
    <rect x="78" y="70" width="54" height="5" fill="#ed7d38"/>
    <text x="78" y="118" class="mono" fill="#ed7d38" font-size="20" font-weight="700" letter-spacing="2">${String(index + 1).padStart(2, "0")} / ${escapeXml(locale.name)}</text>
    <text x="78" y="181" class="sans" fill="#f4f1e9" font-size="43" font-weight="700">${escapeXml(lines[0] || "")}</text>
    <text x="78" y="230" class="sans" fill="#f4f1e9" font-size="43" font-weight="700">${escapeXml(lines[1] || "")}</text>
    <rect x="50" y="1276" width="980" height="44" rx="8" fill="#111714"/>
    <text x="78" y="1305" class="mono" fill="#9b9f9a" font-size="17" letter-spacing="1.5">REAL PRODUCT UI · APPOINTMENT REQUEST · STRUCTURED STATE</text>
  </svg>`);
  const screenshot = path.join(assetDirectory, `${locale.code === "tr" ? "tr-01-request" : `${locale.code}-appointment`}.png`);
  const frame = path.join(frameDirectory, `${String(index + 1).padStart(2, "0")}-${locale.code}.png`);
  execFileSync("magick", [
    "-size", "1080x1350", "canvas:#090c0b",
    "(", screenshot, "-resize", "980x930>", ")",
    "-gravity", "south", "-geometry", "+0+74", "-composite",
    overlay, "-composite", frame,
  ]);
  localeFrames.push(frame);
}

const recordOverlay = await renderSvg("11-record-overlay", `<svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
  <style>.sans{font-family:'Arial',sans-serif}.mono{font-family:'Courier New',monospace}</style>
  <rect x="50" y="40" width="980" height="238" rx="18" fill="#090c0b" fill-opacity=".96" stroke="#28322d"/>
  <rect x="78" y="70" width="54" height="5" fill="#ed7d38"/>
  <text x="78" y="118" class="mono" fill="#ed7d38" font-size="20" font-weight="700" letter-spacing="2">STRUCTURED OUTCOME</text>
  <text x="78" y="181" class="sans" fill="#f4f1e9" font-size="48" font-weight="700">Konuşmadan operasyon kaydına.</text>
  <text x="78" y="231" class="sans" fill="#61c59c" font-size="25">İsim · telefon · tarih · saat · onay durumu</text>
  <rect x="50" y="1276" width="980" height="44" rx="8" fill="#111714"/>
  <text x="78" y="1305" class="mono" fill="#9b9f9a" font-size="17" letter-spacing="1.5">CONSENTED RECORD · CRM / CALENDAR READY</text>
</svg>`);
const recordFrame = path.join(frameDirectory, "11-record.png");
execFileSync("magick", [
  "-size", "1080x1350", "canvas:#090c0b",
  "(", path.join(assetDirectory, "tr-03-complete.png"), "-resize", "980x930>", ")",
  "-gravity", "south", "-geometry", "+0+74", "-composite",
  recordOverlay, "-composite", recordFrame,
]);

const outroFrame = await renderSvg("12-outro", baseSvg(`
  <rect x="64" y="76" width="64" height="6" class="orange"/>
  <text x="64" y="138" class="mono orange" font-size="23" font-weight="700" letter-spacing="3">OPERABLE BY DESIGN</text>
  <text x="64" y="390" class="sans white" font-size="86" font-weight="800" letter-spacing="-3">Bir konuşma.</text>
  <text x="64" y="492" class="sans white" font-size="86" font-weight="800" letter-spacing="-3">On dil.</text>
  <text x="64" y="594" class="sans white" font-size="86" font-weight="800" letter-spacing="-3">Hazır operasyon.</text>
  <g transform="translate(64 820)">
    <rect width="952" height="260" rx="18" fill="#111714" stroke="#28322d"/>
    <text x="36" y="70" class="sans green" font-size="30" font-weight="700">VoiceOps Studio</text>
    <text x="36" y="128" class="sans muted" font-size="28">Voice → intent → structured handoff</text>
    <text x="36" y="186" class="sans muted" font-size="28">CRM · Calendar · Twilio · Stripe</text>
  </g>`));

const scenes = [
  { frame: titleFrame, duration: 3 },
  ...localeFrames.map((frame) => ({ frame, duration: 4.2 })),
  { frame: recordFrame, duration: 6 },
  { frame: outroFrame, duration: 4 },
];

for (let index = 0; index < scenes.length; index += 1) {
  const scene = scenes[index];
  const frames = Math.round(scene.duration * fps);
  const fadeOut = Math.max(0, scene.duration - 0.18).toFixed(2);
  execFileSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-framerate", "1", "-loop", "1", "-t", String(scene.duration), "-i", scene.frame,
    "-vf", `scale=2160:2700:flags=lanczos,zoompan=z='1+0.018*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=1080x1350:fps=${fps},fade=t=in:st=0:d=0.15,fade=t=out:st=${fadeOut}:d=0.18,format=yuv420p`,
    "-frames:v", String(frames), "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "19", "-profile:v", "high", "-level", "4.1", "-g", "60",
    path.join(segmentDirectory, `${String(index).padStart(2, "0")}.mp4`),
  ]);
}

const videoManifest = path.join(segmentDirectory, "video-concat.txt");
await writeFile(videoManifest, scenes.map((_, index) => `file '${path.join(segmentDirectory, `${String(index).padStart(2, "0")}.mp4`).replaceAll("'", "'\\''")}'`).join("\n"));
const silentVideo = path.join(demoDirectory, "voiceops-10-language-showcase-silent.mp4");
execFileSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", videoManifest, "-c", "copy", silentVideo]);

const audioInputs = [
  "-f", "lavfi", "-t", "3", "-i", "anullsrc=r=48000:cl=stereo",
  ...locales.flatMap((locale) => ["-i", path.join(audioDirectory, `${locale.code}.mp3`)]),
  "-i", path.join(audioDirectory, "summary.mp3"),
  "-f", "lavfi", "-t", "4", "-i", "anullsrc=r=48000:cl=stereo",
];
const filters = ["[0:a]atrim=0:3,asetpts=PTS-STARTPTS[a0]"];
for (let index = 0; index < locales.length; index += 1) {
  filters.push(`[${index + 1}:a]highpass=f=80,agate=threshold=0.025:ratio=6:attack=5:release=80,loudnorm=I=-16:TP=-1.5:LRA=10,apad,atrim=0:4.2,afade=t=out:st=4:d=0.2,asetpts=PTS-STARTPTS[a${index + 1}]`);
}
filters.push("[11:a]highpass=f=80,agate=threshold=0.025:ratio=6:attack=5:release=80,loudnorm=I=-16:TP=-1.5:LRA=10,apad,atrim=0:6,afade=t=out:st=5.7:d=0.3,asetpts=PTS-STARTPTS[a11]");
filters.push("[12:a]atrim=0:4,asetpts=PTS-STARTPTS[a12]");
filters.push(`${Array.from({ length: 13 }, (_, index) => `[a${index}]`).join("")}concat=n=13:v=0:a=1[outa]`);
const audioTrack = path.join(demoDirectory, "voiceops-10-language-showcase.m4a");
execFileSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", ...audioInputs,
  "-filter_complex", filters.join(";"), "-map", "[outa]", "-c:a", "aac", "-b:a", "192k", audioTrack,
]);

execFileSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-i", silentVideo, "-i", audioTrack,
  "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "copy", "-t", "55", "-movflags", "+faststart", output,
]);

execFileSync("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-i", output,
  "-vf", "select='eq(n,45)+eq(n,180)+eq(n,558)+eq(n,936)+eq(n,1314)+eq(n,1515)',scale=270:338,tile=6x1:padding=6:margin=6:color=white",
  "-frames:v", "1", contactSheet,
]);

console.log(output);
