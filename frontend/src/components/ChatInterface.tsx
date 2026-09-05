'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, Cpu, Database, HelpCircle, ArrowRight } from 'lucide-react';
import { ChatMessage } from '@/lib/types';
import { TruthPanel } from './TruthPanel';
import { ModelBenchmarkModal } from './ModelBenchmarkModal';

const SUGGESTED_QUESTIONS = [
  "Which vendor received the highest payout last quarter?",
  "How much did we spend on marketing last month?",
  "How does that compare with the previous month?",
  "How many transactions remain unreconciled?",
  "Show me total spend by category in Q4 2025",
  "What is our employee salary budget?"
];

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: "Hello! I am TBX Truth Engine. Ask any question about spend, vendor payouts, or reconciliation items. I will compute the exact primary number from DuckDB and verify whether alternative interpretations (like transaction vs. settlement date) materially change the answer.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState<boolean>(false);
  const [dbStatus, setDbStatus] = useState<{ loaded: boolean; records: number }>({ loaded: false, records: 0 });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch backend status
    fetch('/api/schema')
      .then(res => res.json())
      .then(data => {
        if (data.total_records) {
          setDbStatus({ loaded: true, records: data.total_records });
        }
      })
      .catch(() => {
        setDbStatus({ loaded: false, records: 100000 });
      });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.role === 'user' || (m.role === 'assistant' && m.query_plan))
        .map(m => ({ role: m.role, content: m.content, plan: m.query_plan }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, history })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to process request');
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: data.content,
        query_plan: data.query_plan,
        result_package: data.result_package,
        is_clarification: data.is_clarification,
        clarification_options: data.clarification_options,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: `Sorry, an error occurred: ${err.message || 'Unable to connect to query engine.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-slate-100 max-w-7xl mx-auto border-x border-surface-border/50 shadow-2xl">
      {/* Navbar Header */}
      <header className="px-6 py-4 border-b border-surface-border glass-panel flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 text-white font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-white">TBX Truth Engine</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                BVP Catalyst Hackathon
              </span>
            </div>
            <p className="text-xs text-slate-400">Financial Intelligence System with Interpretation Stability Verification</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface border border-surface-border text-xs text-slate-300">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>DuckDB: <strong className="text-white">100,000</strong> Records</span>
          </div>

          <button
            onClick={() => setIsBenchmarkOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all shadow-sm"
          >
            <Cpu className="w-4 h-4 text-blue-400" />
            <span>Model Benchmark</span>
          </button>
        </div>
      </header>

      {/* Chat Canvas */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 sm:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 shrink-0 h-fit mt-1">
                <Bot className="w-5 h-5" />
              </div>
            )}

            <div className={`max-w-3xl space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 rounded-tr-none'
                    : 'glass-panel text-slate-200 border border-surface-border rounded-tl-none'
                }`}
              >
                <div>{msg.content}</div>

                {/* Clarification Options */}
                {msg.is_clarification && msg.clarification_options && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-white/10">
                    <div className="text-xs font-semibold text-slate-300">Suggested Clarifications:</div>
                    <div className="flex flex-wrap gap-2">
                      {msg.clarification_options.map((opt, i) => (
                        <button
                          key={i}
                          onClick={() => handleSend(opt)}
                          className="px-3 py-1.5 rounded-lg bg-surface hover:bg-surface-border text-xs text-blue-300 border border-blue-500/30 transition-all"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Truth Panel Render */}
              {msg.result_package && (
                <TruthPanel pkg={msg.result_package} />
              )}

              <div className="text-[10px] text-slate-500 px-1">
                {msg.timestamp}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="p-2 rounded-xl bg-surface-border text-slate-300 shrink-0 h-fit mt-1">
                <User className="w-5 h-5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 items-center text-slate-400 text-xs italic p-4 glass-panel rounded-2xl w-fit">
            <RefreshCw className="w-4 h-4 animate-spin text-blue-400" />
            <span>Understanding language &amp; querying DuckDB analytical engine...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Suggested Questions Pill Row */}
      <div className="px-6 py-2 border-t border-surface-border/40 bg-surface/30 flex items-center gap-2 overflow-x-auto text-xs shrink-0">
        <span className="text-slate-400 text-[11px] font-semibold whitespace-nowrap flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
          Suggested:
        </span>
        {SUGGESTED_QUESTIONS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(q)}
            className="px-3 py-1 rounded-full bg-surface-border/40 hover:bg-surface-border text-slate-300 hover:text-white border border-white/5 transition-all whitespace-nowrap shrink-0 text-[11px]"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Chat Input Bar */}
      <footer className="p-4 border-t border-surface-border glass-panel shrink-0">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-3 bg-surface p-2 rounded-xl border border-surface-border focus-within:border-blue-500/50 transition-all shadow-inner"
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a financial question (e.g. 'Which vendor received the highest payout last quarter?')..."
            className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-md transition-all shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </footer>

      {/* Benchmark Modal */}
      <ModelBenchmarkModal
        isOpen={isBenchmarkOpen}
        onClose={() => setIsBenchmarkOpen(false)}
      />
    </div>
  );
};
