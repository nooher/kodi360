import { useEffect, useRef, useState } from 'react';
import { Bot, Send, WifiOff, User } from 'lucide-react';
import { useLang, t } from '../lib/i18n';
import { akili, createAkiliSession, type AkiliSession } from '../akili';
import type { AkiliAnswer } from '../akili/types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  answer?: AkiliAnswer;
}

const SUGGESTIONS_SW = [
  'Nisajilije TIN?',
  'VAT ni kiasi gani na ni lini nasajili?',
  'Nikadirie kodi ya makadirio kwa biashara ndogo',
  'Nikipinga tathmini ya kodi, nifanye nini?',
  'EFD au VFD, tofauti yake ni nini?',
];

let idSeq = 0;
const nextId = () => `m${++idSeq}`;

export default function AkiliWaKodi() {
  const { lang } = useLang();
  const sessionRef = useRef<AkiliSession | null>(null);
  if (!sessionRef.current) sessionRef.current = createAkiliSession(akili);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: nextId(),
      role: 'assistant',
      text:
        lang === 'sw'
          ? 'Habari! Mimi ni Akili wa Kodi — msaidizi wako wa kodi, nafanya kazi bila mtandao. Niulize kuhusu TIN, VAT, EFD, pingamizi, au kodi ya makadirio.'
          : 'Hello! I am Akili wa Kodi — your offline tax assistant. Ask me about TIN, VAT, EFD, objections, or presumptive tax.',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function ask(text: string) {
    const query = text.trim();
    if (!query || busy) return;
    setMessages((m) => [...m, { id: nextId(), role: 'user', text: query }]);
    setInput('');
    setBusy(true);
    const answer = await sessionRef.current!.ask({ text: query, lang });
    const body = lang === 'en' && answer.text.en ? answer.text.en : answer.text.sw;
    setMessages((m) => [...m, { id: nextId(), role: 'assistant', text: body, answer }]);
    setBusy(false);
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 flex flex-col" style={{ minHeight: 'calc(100svh - 4rem)' }}>
      <div className="flex items-center gap-3 mb-4">
        <div className="h-11 w-11 rounded-xl bg-tz-green flex items-center justify-center text-white">
          <Bot className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-tz-black">Akili wa Kodi</h1>
          <p className="text-xs text-tz-black/50 inline-flex items-center gap-1">
            <WifiOff className="h-3 w-3" />
            {t(lang, { sw: 'Inafanya kazi bila mtandao — hakuna data inayotumwa nje', en: 'Runs fully offline — no data ever leaves your device' })}
          </p>
        </div>
      </div>

      <div className="flex-1 rounded-2xl border border-tz-black/10 bg-white overflow-y-auto p-4 sm:p-5 space-y-4 min-h-[50vh]">
        {messages.map((m) => (
          <div key={m.id} className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : ''}`}>
            {m.role === 'assistant' && (
              <div className="h-8 w-8 shrink-0 rounded-lg bg-tz-green/10 flex items-center justify-center text-tz-green-dark">
                <Bot className="h-4.5 w-4.5" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line ${
                m.role === 'user' ? 'bg-tz-blue text-white' : 'bg-paper text-tz-black'
              }`}
            >
              {m.text}
              {m.answer?.sources && m.answer.sources.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-tz-black/10 flex flex-wrap gap-1.5">
                  {m.answer.sources.map((s, i) => (
                    <span key={i} className="text-[11px] rounded-full bg-tz-black/5 px-2 py-0.5 text-tz-black/60">
                      {s.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {m.role === 'user' && (
              <div className="h-8 w-8 shrink-0 rounded-lg bg-tz-blue/10 flex items-center justify-center text-tz-blue">
                <User className="h-4.5 w-4.5" />
              </div>
            )}
          </div>
        ))}
        {busy && (
          <div className="flex gap-2.5">
            <div className="h-8 w-8 shrink-0 rounded-lg bg-tz-green/10 flex items-center justify-center text-tz-green-dark">
              <Bot className="h-4.5 w-4.5" />
            </div>
            <div className="rounded-2xl bg-paper px-4 py-3 text-sm text-tz-black/40">…</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS_SW.map((s) => (
          <button
            key={s}
            onClick={() => ask(s)}
            className="text-xs rounded-full border border-tz-black/15 px-3 py-1.5 text-tz-black/70 hover:bg-tz-black/5"
          >
            {s}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="mt-3 flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t(lang, { sw: 'Andika swali lako la kodi…', en: 'Type your tax question…' })}
          className="flex-1 rounded-xl border border-tz-black/15 px-4 py-3 text-sm outline-none focus:border-tz-green"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-xl bg-tz-green px-4 py-3 text-white disabled:opacity-40 hover:bg-tz-green-dark"
        >
          <Send className="h-4.5 w-4.5" />
        </button>
      </form>
    </div>
  );
}
