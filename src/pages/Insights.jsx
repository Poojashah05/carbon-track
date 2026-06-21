/**
 * @file Insights.jsx
 * @description AI Insights page — 3-column layout with profile summary (left 1/3)
 *   and AI recommendations + follow-up chat (right 2/3).
 */

// No props — reads state via hooks/context

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, RotateCcw, Loader2 } from 'lucide-react';
import InsightCard, { InsightSkeleton } from '../components/InsightCard';
import ProgressBar from '../components/ProgressBar';
import { useEmissions } from '../hooks/useEmissions';
import { useGroqInsights } from '../hooks/useGroqInsights';
import {
  getTotalMonthlyEmission,
  getCategoryBreakdown,
  compareToGlobalAverage,
  GLOBAL_MONTHLY_AVG_KG,
} from '../utils/emissionFactors';
import { formatCO2 } from '../utils/formatters';

const DID_YOU_KNOW = [
  "India's per-capita CO\u2082 is ~1.9 t/year \u2014 one-third of the global average.",
  'A single domestic flight can emit more CO\u2082 than 2 months of vegetarian meals.',
  'Switching from car to metro for 20 km daily saves ~1.3 kg CO\u2082 per day.',
  'Rooftop solar reduces your electricity CO\u2082 footprint by up to 94%.',
  'Choosing dal over mutton for one meal saves ~5.6 kg CO\u2082.',
];

const CATEGORY_META = {
  transport: 'Transport', food: 'Food', energy: 'Energy', shopping: 'Shopping',
};

export default function Insights() {
  const { logs } = useEmissions();
  const totalKg = getTotalMonthlyEmission(logs);
  const breakdown = getCategoryBreakdown(logs);
  const comparison = compareToGlobalAverage(totalKg);

  const emissionData = {
    transportKg: breakdown.find((b) => b.category === 'transport')?.kg ?? 0,
    foodKg:      breakdown.find((b) => b.category === 'food')?.kg ?? 0,
    energyKg:    breakdown.find((b) => b.category === 'energy')?.kg ?? 0,
    shoppingKg:  breakdown.find((b) => b.category === 'shopping')?.kg ?? 0,
    totalKg,
    globalAvg: GLOBAL_MONTHLY_AVG_KG,
  };

  const {
    reports, streamingContent, isStreaming, error,
    generate, remainingCount, canGenerate,
  } = useGroqInsights(emissionData);

  const [openId, setOpenId] = useState(null);
  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  // Chat state (up to 5-message history)
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;

    const userMsg = { role: 'user', content: chatInput.trim() };
    const history = [...chatMessages, userMsg].slice(-5);
    setChatMessages(history);
    setChatInput('');
    setIsChatting(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      const systemPrompt = `You are CO2Track's carbon advisor. User stats: transport=${emissionData.transportKg.toFixed(1)}kg, food=${emissionData.foodKg.toFixed(1)}kg, energy=${emissionData.energyKg.toFixed(1)}kg, shopping=${emissionData.shoppingKg.toFixed(1)}kg, total=${totalKg.toFixed(1)}kg/month. Answer follow-up questions briefly and specifically. Max 80 words.`;

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [{ role: 'system', content: systemPrompt }, ...history],
          stream: true,
          max_tokens: 200,
        }),
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let content = '';
      const assistantMsg = { role: 'assistant', content: '' };
      setChatMessages((prev) => [...prev, assistantMsg]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          const json = line.replace('data: ', '').trim();
          if (json === '[DONE]') break;
          try {
            const delta = JSON.parse(json).choices?.[0]?.delta?.content ?? '';
            content += delta;
            setChatMessages((prev) => {
              const updated = [...prev];
              updated[updated.length - 1] = { role: 'assistant', content };
              return updated;
            });
          } catch { /* ignore */ }
        }
      }
    } catch {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' },
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  const didYouKnow = DID_YOU_KNOW[Math.floor(Math.random() * DID_YOU_KNOW.length)];

  return (
    <div className="page-container">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-charcoal">Insights</h1>
        <p className="text-sm text-text-muted mt-1">AI-powered personalised carbon reduction advice.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left 1/3 ─────────────────────────────────── */}
        <div className="space-y-4">
          {/* Profile summary */}
          <div className="card p-4">
            <h2 className="text-sm font-semibold text-charcoal mb-3">Monthly Summary</h2>
            <div className="text-3xl font-semibold text-charcoal tabular-nums mb-1">
              {formatCO2(totalKg)}
            </div>
            <p className="text-xs text-text-muted mb-4">
              {comparison.vsGlobal} vs global average
            </p>

            <div className="space-y-3">
              {breakdown.map((b) => (
                <ProgressBar
                  key={b.category}
                  label={CATEGORY_META[b.category] ?? b.category}
                  value={b.kg}
                  max={Math.max(totalKg, 1)}
                  color="forest"
                  showValue={false}
                  className=""
                />
              ))}
            </div>
          </div>

          {/* Did you know */}
          <div className="card p-4 bg-amberLight/30 border-amber/30">
            <p className="text-xs font-semibold text-amber uppercase tracking-wide mb-2">
              Did you know?
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">{didYouKnow}</p>
          </div>
        </div>

        {/* ── Right 2/3 ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Generate button */}
          <div className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-charcoal">AI Recommendations</h2>
                <p className="text-xs text-text-muted mt-0.5">
                  {remainingCount} generation{remainingCount !== 1 ? 's' : ''} remaining this month
                </p>
              </div>
              <button
                type="button"
                onClick={generate}
                disabled={!canGenerate || isStreaming}
                className="btn-primary"
              >
                {isStreaming
                  ? <><Loader2 size={14} className="animate-spin" /> Generating…</>
                  : <><Sparkles size={14} /> Generate Insights</>
                }
              </button>
            </div>

            {error && (
              <div className="mt-3 flex items-center gap-2 text-xs text-danger bg-red-50 border border-red-200 rounded p-3">
                <span>{error}</span>
                <button type="button" onClick={generate} className="ml-auto flex items-center gap-1 underline">
                  <RotateCcw size={12} /> Retry
                </button>
              </div>
            )}

            {/* Streaming output */}
            {isStreaming && streamingContent && (
              <div
                className="mt-4 p-4 bg-surface-1 rounded border border-border text-sm text-text-secondary
                           whitespace-pre-wrap leading-relaxed animate-fade-in"
                aria-live="polite"
                aria-label="AI insights being generated"
              >
                {streamingContent}
                <span className="inline-block w-0.5 h-4 bg-forest ml-0.5 animate-pulse" />
              </div>
            )}

            {isStreaming && !streamingContent && <InsightSkeleton />}
          </div>

          {/* Past reports accordion */}
          {reports.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wide px-1">
                Past Reports
              </h3>
              {reports.map((report, i) => (
                <InsightCard
                  key={report.id}
                  report={report}
                  isOpen={openId === report.id}
                  onToggle={() => toggle(report.id)}
                  isLatest={i === 0}
                />
              ))}
            </div>
          )}

          {/* Follow-up Chat */}
          <div className="card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-charcoal">Ask a Follow-up</h3>
              <p className="text-xs text-text-muted">Chat with your AI carbon advisor</p>
            </div>

            <div className="h-48 overflow-y-auto p-4 space-y-3 scrollbar-thin" aria-live="polite">
              {chatMessages.length === 0 && (
                <p className="text-xs text-text-muted text-center pt-8">
                  Ask anything about reducing your carbon footprint.
                </p>
              )}
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded text-xs leading-relaxed
                      ${msg.role === 'user'
                        ? 'bg-forest text-white rounded-br-none'
                        : 'bg-surface-1 text-text-secondary border border-border rounded-bl-none'
                      }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleChat} className="flex gap-2 p-3 border-t border-border">
              <input
                type="text"
                className="form-input flex-1"
                placeholder="e.g. How can I reduce my food emissions?"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isChatting}
                aria-label="Ask a follow-up question"
              />
              <button
                type="submit"
                className="btn-primary px-3"
                disabled={isChatting || !chatInput.trim()}
                aria-label="Send message"
              >
                {isChatting
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Send size={14} />
                }
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
