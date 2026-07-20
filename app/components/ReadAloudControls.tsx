"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ReaderState = "idle" | "playing" | "paused" | "finished";

function speechChunks(value: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) return [];

  const sentences = normalized.match(/[^.!?]+(?:[.!?]+|$)/g) ?? [normalized];
  const chunks: string[] = [];

  for (const sentence of sentences) {
    const clean = sentence.trim();
    if (clean.length <= 240) {
      chunks.push(clean);
      continue;
    }

    const clauses = clean.split(/(?<=[,;:])\s+/);
    let current = "";
    for (const clause of clauses) {
      if (current && `${current} ${clause}`.length > 240) {
        chunks.push(current);
        current = clause;
      } else {
        current = current ? `${current} ${clause}` : clause;
      }
    }
    if (current) chunks.push(current);
  }

  return chunks;
}

export function ReadAloudControls({ targetId, title }: { targetId: string; title: string }) {
  const [supported, setSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voiceName, setVoiceName] = useState("");
  const [rate, setRate] = useState(1);
  const [state, setState] = useState<ReaderState>("idle");
  const [position, setPosition] = useState(0);
  const chunksRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const sessionRef = useRef(0);

  useEffect(() => {
    if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
      setSupported(false);
      return;
    }

    const loadVoices = () => {
      const available = window.speechSynthesis.getVoices().sort((a, b) => {
        const englishA = a.lang.toLowerCase().startsWith("en") ? 0 : 1;
        const englishB = b.lang.toLowerCase().startsWith("en") ? 0 : 1;
        return englishA - englishB || a.name.localeCompare(b.name);
      });
      setVoices(available);
      setVoiceName((current) => {
        if (current && available.some((voice) => voice.name === current)) return current;
        const saved = window.localStorage.getItem("utopian-reader-voice");
        if (saved && available.some((voice) => voice.name === saved)) return saved;
        return available.find((voice) => voice.default)?.name ?? available[0]?.name ?? "";
      });
    };

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      sessionRef.current += 1;
      window.speechSynthesis.cancel();
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  useEffect(() => {
    if (voiceName) window.localStorage.setItem("utopian-reader-voice", voiceName);
  }, [voiceName]);

  const selectedVoice = useMemo(
    () => voices.find((voice) => voice.name === voiceName),
    [voiceName, voices],
  );

  const speakFrom = useCallback((index: number, session: number) => {
    const chunk = chunksRef.current[index];
    if (!chunk || session !== sessionRef.current) {
      setState("finished");
      setPosition(chunksRef.current.length);
      return;
    }

    indexRef.current = index;
    setPosition(index + 1);
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.rate = rate;
    utterance.pitch = 1;
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.onend = () => speakFrom(index + 1, session);
    utterance.onerror = (event) => {
      if (event.error !== "canceled" && event.error !== "interrupted") setState("idle");
    };
    window.speechSynthesis.speak(utterance);
  }, [rate, selectedVoice]);

  const play = () => {
    if (!supported) return;
    if (state === "paused") {
      window.speechSynthesis.resume();
      setState("playing");
      return;
    }

    const target = document.getElementById(targetId);
    if (!target) return;
    const chunks = speechChunks(target.innerText);
    if (!chunks.length) return;

    window.speechSynthesis.cancel();
    const session = sessionRef.current + 1;
    sessionRef.current = session;
    chunksRef.current = chunks;
    indexRef.current = 0;
    setPosition(0);
    setState("playing");
    speakFrom(0, session);
  };

  const pause = () => {
    window.speechSynthesis.pause();
    setState("paused");
  };

  const stop = () => {
    sessionRef.current += 1;
    window.speechSynthesis.cancel();
    indexRef.current = 0;
    setPosition(0);
    setState("idle");
  };

  if (!supported) {
    return <section className="read-aloud" aria-label="Read aloud">
      <span className="read-aloud-kicker">Listen to this entry</span>
      <p>Your browser does not provide speech playback. The complete written entry remains available below.</p>
    </section>;
  }

  const total = chunksRef.current.length;
  const status = state === "playing"
    ? `Reading ${title}. Passage ${position} of ${total}.`
    : state === "paused"
      ? `Paused at passage ${position} of ${total}.`
      : state === "finished"
        ? `Finished reading ${title}.`
        : "Ready to read this entry aloud.";

  return <section className="read-aloud" aria-labelledby="read-aloud-title">
    <div className="read-aloud-heading">
      <div>
        <span className="read-aloud-kicker">Audio reading</span>
        <h2 id="read-aloud-title">Listen to this entry</h2>
      </div>
      <span className={`read-aloud-state is-${state}`} aria-hidden="true">{state === "playing" ? "Reading" : state === "paused" ? "Paused" : state === "finished" ? "Complete" : "Ready"}</span>
    </div>

    <div className="read-aloud-settings">
      <label>
        <span>Voice</span>
        <select value={voiceName} onChange={(event) => { stop(); setVoiceName(event.target.value); }} disabled={!voices.length}>
          {voices.map((voice) => <option value={voice.name} key={`${voice.name}-${voice.lang}`}>{voice.name} · {voice.lang}</option>)}
        </select>
      </label>
      <label>
        <span>Speed</span>
        <select value={rate} onChange={(event) => { stop(); setRate(Number(event.target.value)); }}>
          <option value={0.75}>Gentle · 0.75×</option>
          <option value={0.9}>Measured · 0.9×</option>
          <option value={1}>Standard · 1×</option>
          <option value={1.15}>Brisk · 1.15×</option>
          <option value={1.3}>Quick · 1.3×</option>
        </select>
      </label>
    </div>

    <div className="read-aloud-actions">
      {state === "playing"
        ? <button type="button" onClick={pause} className="read-aloud-primary"><span aria-hidden="true">Ⅱ</span> Pause</button>
        : <button type="button" onClick={play} className="read-aloud-primary"><span aria-hidden="true">▶</span> {state === "paused" ? "Resume" : state === "finished" ? "Read again" : "Play reading"}</button>}
      <button type="button" onClick={stop} disabled={state === "idle"} className="read-aloud-secondary"><span aria-hidden="true">■</span> Stop</button>
    </div>
    <p className="read-aloud-status" role="status" aria-live="polite">{status}</p>
    <p className="read-aloud-note">Voices are supplied by your browser and device. Playback is generated locally and is not retained by the Corpus.</p>
  </section>;
}
