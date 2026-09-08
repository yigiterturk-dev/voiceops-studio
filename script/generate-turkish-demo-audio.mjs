import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(root, "docs", "demo", "turkish-audio");

// Native Turkish voice that preserved all suffixes in the local articulation
// check; calm enough for a customer-service assistant without sounding dubbed.
const femaleVoice = "9fb14ec683bf4b0ab1f944b43e6d0053";
const maleVoice = "241fac3c0dd14046a1f31816d9cdcc6d";

const lines = [
  {
    id: "01-customer-request",
    voice: maleVoice,
    text: "Yarın saat üç için randevu almak istiyorum.",
  },
  {
    id: "02-nova-name",
    voice: femaleVoice,
    text: "Talebinizi aldım. Adınızı ve soyadınızı söyler misiniz?",
  },
  {
    id: "03-customer-name",
    voice: maleVoice,
    text: "Benim adım Yiğit Ertürk.",
  },
  {
    id: "04-nova-phone",
    voice: femaleVoice,
    text: "Teşekkür ederim. Size ulaşabileceğimiz telefon numaranızı alabilir miyim?",
  },
  {
    id: "05-customer-phone",
    voice: maleVoice,
    text: "Telefon numaram artı doksan, beş yüz elli beş, yüz on bir, yirmi iki, otuz üç.",
  },
  {
    id: "06-nova-complete",
    voice: femaleVoice,
    text: "Randevunuz yarın saat on beş için oluşturuldu. Ekibimiz kısa süre içinde sizi arayacak.",
  },
  {
    id: "07-summary",
    voice: femaleVoice,
    text: "Sistem müşteriyi dinler, eksik bilgileri toplar ve randevu talebini hazır bir operasyona dönüştürür.",
  },
];

if (!process.env.FISH_AUDIO_API_KEY?.trim()) {
  throw new Error("FISH_AUDIO_API_KEY is required to generate the Turkish demo audio.");
}

await mkdir(outputDirectory, { recursive: true });

const requestedIds = new Set(process.argv.slice(2));
const selectedLines = requestedIds.size
  ? lines.filter((line) => requestedIds.has(line.id))
  : lines;

for (const line of selectedLines) {
  const response = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FISH_AUDIO_API_KEY}`,
      "Content-Type": "application/json",
      model: process.env.FISH_AUDIO_MODEL || "s2-pro",
    },
    body: JSON.stringify({
      text: line.text,
      reference_id: line.voice,
      format: "mp3",
      sample_rate: 44_100,
      mp3_bitrate: 128,
      latency: "balanced",
      normalize: true,
      temperature: 0.32,
      top_p: 0.68,
      prosody: {
        speed: 1.02,
        volume: 0,
        normalize_loudness: true,
      },
    }),
    signal: AbortSignal.timeout(60_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Fish Audio ${line.id} failed (${response.status}): ${detail.slice(0, 200)}`);
  }

  await writeFile(
    path.join(outputDirectory, `${line.id}.mp3`),
    Buffer.from(await response.arrayBuffer()),
  );
  console.log(`generated ${line.id}`);
}
