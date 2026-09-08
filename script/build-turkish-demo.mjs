import { execFileSync } from "node:child_process";
import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const assets = path.join(root, "docs", "assets", "showcase");
const demo = path.join(root, "docs", "demo");
const work = path.join(demo, "turkish-build");
const frames = path.join(work, "frames");
const segments = path.join(work, "segments");
const audio = path.join(demo, "turkish-audio");
const output = path.join(demo, "voiceops-turkish-demo.mp4");
const contactSheet = path.join(demo, "voiceops-turkish-demo-contact-sheet.jpg");
const deliveryDirectory = path.resolve(root, "..", "..", "VoiceOps Türkçe Demo");
const fps = 30;

await Promise.all([
  mkdir(frames, { recursive: true }),
  mkdir(segments, { recursive: true }),
  mkdir(deliveryDirectory, { recursive: true }),
]);

function run(command, args) {
  execFileSync(command, args, { stdio: "inherit" });
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function duration(file) {
  return Number(execFileSync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    file,
  ], { encoding: "utf8" }).trim());
}

function wrap(text, width = 34) {
  const words = text.split(/\s+/u);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (line && `${line} ${word}`.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function svgBase(content) {
  return `<svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
  <rect width="1080" height="1350" fill="#090c0b"/>
  <style>
    .sans{font-family:'Arial',sans-serif}.mono{font-family:'Courier New',monospace}
    .white{fill:#f4f1e9}.muted{fill:#a8aca7}.orange{fill:#ed7d38}.green{fill:#61c59c}
  </style>${content}</svg>`;
}

async function renderSvg(name, markup) {
  const svg = path.join(frames, `${name}.svg`);
  const png = path.join(frames, `${name}.png`);
  await writeFile(svg, markup);
  run("rsvg-convert", ["-w", "1080", "-h", "1350", svg, "-o", png]);
  return png;
}

async function dialogueOverlay(name, eyebrow, speaker, text, footnote) {
  const lines = wrap(text);
  const lineMarkup = lines.slice(0, 3).map((line, index) =>
    `<text x="76" y="${174 + index * 53}" class="sans white" font-size="43" font-weight="700">${escapeXml(line)}</text>`,
  ).join("");
  return renderSvg(`${name}-overlay`, `<svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
    <style>.sans{font-family:'Arial',sans-serif}.mono{font-family:'Courier New',monospace}.white{fill:#f4f1e9}</style>
    <rect x="42" y="34" width="996" height="286" rx="20" fill="#090c0b" fill-opacity=".97" stroke="#334139"/>
    <rect x="76" y="66" width="58" height="6" fill="#ed7d38"/>
    <text x="76" y="116" class="mono" fill="#ed7d38" font-size="20" font-weight="700" letter-spacing="2">${escapeXml(eyebrow)} / ${escapeXml(speaker)}</text>
    ${lineMarkup}
    <rect x="42" y="1274" width="996" height="44" rx="8" fill="#111714"/>
    <text x="70" y="1304" class="mono" fill="#a8aca7" font-size="18" letter-spacing="1.2">${escapeXml(footnote)}</text>
  </svg>`);
}

async function appFrame(name, screenshotName, eyebrow, speaker, text, crop) {
  const overlay = await dialogueOverlay(name, eyebrow, speaker, text, "GERÇEK ÜRÜN EKRANI · TÜRKÇE CANLI AKIŞ");
  const screenshot = path.join(assets, screenshotName);
  const frame = path.join(frames, `${name}.png`);
  const cropArgs = crop
    ? ["(", screenshot, "-crop", crop, "+repage", "-resize", "900x790!", ")"]
    : ["(", screenshot, "-resize", "980x930>", ")"];
  run("magick", [
    "-size", "1080x1350", "canvas:#090c0b",
    ...cropArgs,
    "-gravity", "south", "-geometry", "+0+76", "-composite",
    overlay, "-composite",
    frame,
  ]);
  return frame;
}

const title = await renderSvg("00-title", svgBase(`
  <rect x="64" y="78" width="66" height="6" class="orange"/>
  <text x="64" y="140" class="mono orange" font-size="23" font-weight="700" letter-spacing="3">VOICEOPS STUDIO / TÜRKÇE DEMO</text>
  <text x="64" y="410" class="sans white" font-size="104" font-weight="800" letter-spacing="-4">Müşteri konuşur.</text>
  <text x="64" y="535" class="sans white" font-size="104" font-weight="800" letter-spacing="-4">Nova tamamlar.</text>
  <text x="64" y="645" class="sans muted" font-size="39">Randevu talebi, eksik bilgiler ve</text>
  <text x="64" y="700" class="sans muted" font-size="39">operasyon kaydı — tek görüşmede.</text>
  <g transform="translate(64 888)">
    <rect width="952" height="248" rx="20" fill="#111714" stroke="#334139"/>
    <text x="38" y="64" class="mono orange" font-size="20" font-weight="700">CANLI AKIŞ</text>
    <text x="38" y="142" class="sans white" font-size="43" font-weight="700">Dinle → Anla → Sor → Kaydet</text>
    <text x="38" y="204" class="sans green" font-size="28">Doğal Türkçe ses · yapılandırılmış sonuç</text>
  </g>`));

const requestFrame = await appFrame(
  "01-request",
  "tr-01-request.png",
  "01 / RANDEVU TALEBİ",
  "MÜŞTERİ + NOVA",
  "“Yarın saat üç için randevu istiyorum.” Nova eksik olan ismi sorar.",
);

const nameFrame = await appFrame(
  "02-name",
  "tr-02-name.png",
  "02 / EKSİK BİLGİ",
  "MÜŞTERİ + NOVA",
  "“Benim adım Yiğit Ertürk.” Nova iletişim numarasını ister.",
);

const completeFrame = await appFrame(
  "03-complete",
  "tr-03-complete.png",
  "03 / YAPILANDIRILMIŞ SONUÇ",
  "NOVA",
  "İsim, telefon, tarih ve saat tamamlandı. Randevu kaydedildi.",
  "480x420+950+1060",
);

const outro = await renderSvg("04-outro", svgBase(`
  <rect x="64" y="78" width="66" height="6" class="orange"/>
  <text x="64" y="140" class="mono orange" font-size="23" font-weight="700" letter-spacing="3">KONUŞMADAN OPERASYONA</text>
  <text x="64" y="408" class="sans white" font-size="98" font-weight="800" letter-spacing="-4">Bir konuşma.</text>
  <text x="64" y="526" class="sans white" font-size="98" font-weight="800" letter-spacing="-4">Hazır kayıt.</text>
  <text x="64" y="646" class="sans green" font-size="40" font-weight="700">Türkçe, doğal ve çalışır durumda.</text>
  <g transform="translate(64 850)">
    <rect width="952" height="260" rx="20" fill="#111714" stroke="#334139"/>
    <text x="38" y="72" class="sans white" font-size="34" font-weight="700">VoiceOps Studio</text>
    <text x="38" y="132" class="sans muted" font-size="29">Ses → niyet → eksik bilgi → kayıt</text>
    <text x="38" y="192" class="sans muted" font-size="29">CRM ve takvim entegrasyonuna hazır</text>
  </g>`));

const files = {
  request: path.join(audio, "01-customer-request.mp3"),
  askName: path.join(audio, "02-nova-name.mp3"),
  name: path.join(audio, "03-customer-name.mp3"),
  askPhone: path.join(audio, "04-nova-phone.mp3"),
  phone: path.join(audio, "05-customer-phone.mp3"),
  complete: path.join(audio, "06-nova-complete.mp3"),
  summary: path.join(audio, "07-summary.mp3"),
};

const sceneDurations = [
  2.6,
  Math.max(7.5, duration(files.request) + duration(files.askName) + 1.5),
  Math.max(7.5, duration(files.name) + duration(files.askPhone) + 1.5),
  Math.max(10, duration(files.phone) + duration(files.complete) + 1.6),
  Math.max(7, duration(files.summary) + 2),
];

const sceneAudio = [];
async function buildDialogueAudio(name, first, second, length) {
  const target = path.join(work, `${name}.m4a`);
  run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", first,
    "-f", "lavfi", "-t", "0.48", "-i", "anullsrc=r=48000:cl=mono",
    "-i", second,
    "-filter_complex",
    `[0:a]highpass=f=85,agate=threshold=0.022:ratio=5:attack=5:release=90,loudnorm=I=-16:TP=-1.5:LRA=9[a0];[1:a]atrim=0:0.48[a1];[2:a]highpass=f=85,agate=threshold=0.022:ratio=5:attack=5:release=90,loudnorm=I=-16:TP=-1.5:LRA=9[a2];[a0][a1][a2]concat=n=3:v=0:a=1,apad,atrim=0:${length},afade=t=out:st=${Math.max(0, length - 0.25)}:d=0.25[out]`,
    "-map", "[out]", "-c:a", "aac", "-b:a", "192k", target,
  ]);
  sceneAudio.push(target);
}

const titleAudio = path.join(work, "00-title.m4a");
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-t", String(sceneDurations[0]), "-i", "anullsrc=r=48000:cl=mono", "-c:a", "aac", "-b:a", "192k", titleAudio]);
sceneAudio.push(titleAudio);
await buildDialogueAudio("01-request", files.request, files.askName, sceneDurations[1]);
await buildDialogueAudio("02-name", files.name, files.askPhone, sceneDurations[2]);
await buildDialogueAudio("03-complete", files.phone, files.complete, sceneDurations[3]);

const outroAudio = path.join(work, "04-outro.m4a");
run("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-i", files.summary,
  "-filter_complex", `[0:a]highpass=f=85,agate=threshold=0.022:ratio=5:attack=5:release=90,loudnorm=I=-16:TP=-1.5:LRA=9,apad,atrim=0:${sceneDurations[4]},afade=t=out:st=${sceneDurations[4] - 0.8}:d=0.5[out]`,
  "-map", "[out]", "-c:a", "aac", "-b:a", "192k", outroAudio,
]);
sceneAudio.push(outroAudio);

const videoScenes = [title, requestFrame, nameFrame, completeFrame, outro];
for (let index = 0; index < videoScenes.length; index += 1) {
  const sceneDuration = sceneDurations[index];
  const count = Math.round(sceneDuration * fps);
  const fadeOut = Math.max(0, sceneDuration - 0.18).toFixed(2);
  run("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-framerate", "1", "-loop", "1", "-t", String(sceneDuration), "-i", videoScenes[index],
    "-vf", `scale=2160:2700:flags=lanczos,zoompan=z='1+0.012*on/${count}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${count}:s=1080x1350:fps=${fps},fade=t=in:st=0:d=0.15,fade=t=out:st=${fadeOut}:d=0.18,format=yuv420p`,
    "-frames:v", String(count), "-an", "-c:v", "libx264", "-preset", "fast", "-crf", "19", "-profile:v", "high", "-level", "4.1", "-g", "60",
    path.join(segments, `${String(index).padStart(2, "0")}.mp4`),
  ]);
}

const videoManifest = path.join(work, "video-concat.txt");
await writeFile(videoManifest, videoScenes.map((_, index) => `file '${path.join(segments, `${String(index).padStart(2, "0")}.mp4`).replaceAll("'", "'\\''")}'`).join("\n"));
const silentVideo = path.join(work, "silent.mp4");
run("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", videoManifest, "-c", "copy", silentVideo]);

const combinedAudio = path.join(work, "audio.m4a");
run("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y",
  ...sceneAudio.flatMap((file) => ["-i", file]),
  "-filter_complex", `${sceneAudio.map((_, index) => `[${index}:a]`).join("")}concat=n=${sceneAudio.length}:v=0:a=1,aresample=async=1:first_pts=0[out]`,
  "-map", "[out]",
  "-c:a", "aac", "-b:a", "192k", combinedAudio,
]);

const totalDuration = sceneDurations.reduce((sum, value) => sum + value, 0);
run("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y",
  "-i", silentVideo, "-i", combinedAudio,
  "-map", "0:v:0", "-map", "1:a:0",
  "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
  "-t", String(totalDuration), "-movflags", "+faststart", output,
]);

const checkpoints = [];
let elapsed = 0;
for (const sceneDuration of sceneDurations) {
  checkpoints.push(Math.round((elapsed + sceneDuration / 2) * fps));
  elapsed += sceneDuration;
}
run("ffmpeg", [
  "-hide_banner", "-loglevel", "error", "-y", "-i", output,
  "-vf", `select='${checkpoints.map((frame) => `eq(n,${frame})`).join("+")}',scale=216:270,tile=5x1:padding=6:margin=6:color=white`,
  "-frames:v", "1", contactSheet,
]);

await Promise.all([
  copyFile(output, path.join(deliveryDirectory, "VoiceOps-Turkce-Demo.mp4")),
  copyFile(contactSheet, path.join(deliveryDirectory, "VoiceOps-Turkce-Onizleme.jpg")),
]);

await writeFile(path.join(deliveryDirectory, "OKU-BENI.txt"), [
  "VoiceOps Studio — Türkçe ürün demosu",
  "",
  "Video: VoiceOps-Turkce-Demo.mp4",
  "Önizleme: VoiceOps-Turkce-Onizleme.jpg",
  "",
  "Akış: Türkçe randevu talebi → eksik bilgilerin toplanması → yapılandırılmış kayıt.",
].join("\n"));

console.log(deliveryDirectory);
