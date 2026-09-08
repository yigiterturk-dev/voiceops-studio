import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const outputDirectory = path.join(root, "docs", "demo", "multilingual-audio");

const lines = [
  { locale: "tr", voice: "16e48a4339404751af93079974053936", text: "Yarın saat üç için randevu almak istiyorum." },
  { locale: "en", voice: "c2623f0c075b4492ac367989aee1576f", text: "I'd like to book an appointment tomorrow at three." },
  { locale: "es", voice: "bfed5c0810a347dbb62e8ccce7f59c48", text: "Quiero reservar una cita mañana a las tres." },
  { locale: "de", voice: "90042f762dbf49baa2e7776d011eee6b", text: "Ich möchte morgen um fünfzehn Uhr einen Termin buchen." },
  { locale: "fr", voice: "5567200c7d8341738f0892bbacd3be3c", text: "Je souhaite prendre rendez-vous demain à quinze heures." },
  { locale: "it", voice: "20025b87b38047c2b9401e153262d001", text: "Vorrei prenotare un appuntamento domani alle quindici." },
  { locale: "pt", voice: "5b5a485751824c1993e210602cee16cb", text: "Quero marcar um horário amanhã às quinze horas." },
  { locale: "nl", voice: "add4d395494c4ed0ba2018e77b39ea54", text: "Ik wil morgen om vijftien uur een afspraak boeken." },
  { locale: "pl", voice: "10461d3ce8484db3b230949ea1ee8d17", text: "Chcę umówić się na jutro na piętnastą." },
  { locale: "ru", voice: "2a1036d645634680b3cc69aeeb60375b", text: "Я хочу записаться на завтра на пятнадцать часов." },
  {
    locale: "summary",
    voice: "16e48a4339404751af93079974053936",
    text: "Voice Ops konuşmayı anlar, eksik bilgileri toplar ve randevuyu yapılandırılmış bir kayda dönüştürür.",
  },
];

if (!process.env.FISH_AUDIO_API_KEY?.trim()) {
  throw new Error("FISH_AUDIO_API_KEY is required to generate the multilingual demo audio.");
}

await mkdir(outputDirectory, { recursive: true });
const requestedLocales = new Set(process.argv.slice(2));
const selectedLines = requestedLocales.size
  ? lines.filter((line) => requestedLocales.has(line.locale))
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
      temperature: 0.35,
      top_p: 0.7,
      prosody: { speed: 1.04, volume: 0, normalize_loudness: true },
    }),
    signal: AbortSignal.timeout(60_000),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Fish Audio ${line.locale} failed (${response.status}): ${detail.slice(0, 200)}`);
  }
  await writeFile(path.join(outputDirectory, `${line.locale}.mp3`), Buffer.from(await response.arrayBuffer()));
  console.log(`generated ${line.locale}`);
}
