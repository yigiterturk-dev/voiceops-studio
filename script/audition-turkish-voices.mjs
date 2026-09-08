import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(root, "docs", "demo", "turkish-voice-auditions");
const text = "Talebinizi aldım. Adınızı ve soyadınızı söyler misiniz? Yarın saat on beş için randevu talebinizi oluşturdum. Bilgileriniz müşteri temsilcisine aktarıldı.";
const voices = [
  { id: "e09985869f094323a7e2bbeeb2a8dc42", name: "semm-profesyonel" },
  { id: "9fb14ec683bf4b0ab1f944b43e6d0053", name: "hilal-sakin" },
  { id: "f0a5a9785e51457492ad967fdec19abf", name: "feride-dogal" },
  { id: "f25c830f882b49328d5400e7e0ed3198", name: "sila-sakin" },
];

if (!process.env.FISH_AUDIO_API_KEY?.trim()) throw new Error("FISH_AUDIO_API_KEY is required.");
await mkdir(outputDirectory, { recursive: true });

for (const voice of voices) {
  const tts = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FISH_AUDIO_API_KEY}`,
      "Content-Type": "application/json",
      model: process.env.FISH_AUDIO_MODEL || "s2-pro",
    },
    body: JSON.stringify({
      text,
      reference_id: voice.id,
      format: "mp3",
      sample_rate: 44_100,
      mp3_bitrate: 128,
      latency: "balanced",
      normalize: true,
      temperature: 0.28,
      top_p: 0.66,
      prosody: { speed: 1, volume: 0, normalize_loudness: true },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!tts.ok) throw new Error(`${voice.name} TTS failed (${tts.status})`);
  const bytes = Buffer.from(await tts.arrayBuffer());
  await writeFile(path.join(outputDirectory, `${voice.name}.mp3`), bytes);

  const form = new FormData();
  form.append("audio", new Blob([bytes], { type: "audio/mpeg" }), `${voice.name}.mp3`);
  form.append("language", "tr");
  form.append("ignore_timestamps", "true");
  const asr = await fetch("https://api.fish.audio/v1/asr", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.FISH_AUDIO_API_KEY}` },
    body: form,
    signal: AbortSignal.timeout(30_000),
  });
  if (!asr.ok) throw new Error(`${voice.name} ASR failed (${asr.status})`);
  const transcript = await asr.json();
  console.log(`${voice.name}: ${transcript.text}`);
}

console.log(outputDirectory);
