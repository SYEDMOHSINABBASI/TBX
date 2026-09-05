'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, Cpu, Database, HelpCircle, ArrowRight, Shield, Layers, TrendingUp } from 'lucide-react';
import { ChatMessage } from '@/lib/types';
import { TruthPanel } from './TruthPanel';
import { ModelBenchmarkModal } from './ModelBenchmarkModal';
import { Sidebar } from './Sidebar';

const PROMPT_CARDS = [
  {
    title: "Bank Payout Ranking",
    subtitle: "Which bank received the highest transaction payout in 2025?",
    icon: TrendingUp,
    query: "Which bank received the highest transaction payout in 2025?"
  },
  {
    title: "Date Sensitivity Analysis",
    subtitle: "What was total debit spending in June 2026?",
    icon: Layers,
    query: "What was total debit spending in June 2026?"
  },
  {
    title: "Account Balance Check",
    subtitle: "What is the available balance across ICICI Bank accounts?",
    icon: Database,
    query: "What is the available balance across ICICI Bank accounts?"
  },
  {
    title: "Reference Number Search",
    subtitle: "Find transaction details for reference 1715499972",
    icon: Shield,
    query: "Find transaction details for reference 1715499972"
  }
];

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState<boolean>(false);
  const [recordCount, setRecordCount] = useState<number>(100000);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/schema')
      .then(res => res.json())
      .then(data => {
        if (data.total_transactions) {
          setRecordCount(data.total_transactions);
        }
      })
      .catch(() => setRecordCount(100000));
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
  };

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
    <div className="flex h-screen bg-[#07090e] text-slate-100 overflow-hidden font-sans">
      {/* Lyzr Sidebar */}
      <Sidebar
        onNewChat={handleNewChat}
        onOpenBenchmark={() => setIsBenchmarkOpen(true)}
        recordCount={recordCount}
      />

      {/* Main Studio Canvas */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#090c15]">
        {/* Top Floating Glass Header */}
        <header className="px-6 py-4 border-b border-white/5 lyzr-glass flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">TBX Truth Engine</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Lyzr Studio AI
                </span>
              </div>
              <p className="text-xs text-slate-400">Deterministic Financial Intelligence with Interpretation Stability</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBenchmarkOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold transition-all shadow-sm"
            >
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Qwen 2.5 8B (&lt;20B Cap)</span>
            </button>
          </div>
        </header>

        {/* Scrollable Conversation Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          {/* Welcome Hero Screen when message list is empty */}
          {messages.length === 0 && (
            <div className="max-w-4xl mx-auto space-y-8 pt-8 pb-12">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  BVP Catalyst Hackathon Innovation
                </div>

                <h2 className="text-3xl sm:text-5xl font-extrabold text-gradient-purple tracking-tight">
                  Verify Truth Beyond Assumptions
                </h2>

                <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                  Ask financial questions over <strong className="text-slate-200 font-semibold">100,000 records</strong> across bank, account, and transaction schemas. Deterministically verified via DuckDB.
                </p>
              </div>

              {/* 4 Prompt Grid Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PROMPT_CARDS.map((card, idx) => {
                  const IconComp = card.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSend(card.query)}
                      className="p-5 rounded-2xl lyzr-card border border-white/5 text-left flex items-start gap-4 transition-all lyzr-card-hover group"
                    >
                      <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-all shrink-0">
                        <IconComp className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                          {card.title}
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </div>
                        <div className="text-xs text-slate-400 leading-relaxed">
                          {card.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Message Thread */}
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 border border-cyan-500/30 text-cyan-300 shrink-0 h-fit mt-1">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div className={`max-w-3xl space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-4 sm:p-5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/10 rounded-tr-none font-medium'
                      : 'lyzr-card text-slate-200 border border-white/10 rounded-tl-none'
                  }`}
                >
                  <div>{msg.content}</div>

                  {msg.is_clarification && msg.clarification_options && (
                    <div className="mt-4 space-y-2 pt-3 border-t border-white/10">
                      <div className="text-xs font-semibold text-cyan-300">Suggested Clarifications:</div>
                      <div className="flex flex-wrap gap-2">
                        {msg.clarification_options.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(opt)}
                            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-cyan-300 border border-cyan-500/30 transition-all font-medium"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.result_package && (
                  <TruthPanel pkg={msg.result_package} />
                )}

                <div className="text-[10px] text-slate-500 px-1 font-mono">
                  {msg.timestamp}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-slate-300 shrink-0 h-fit mt-1">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-slate-300 text-xs p-4 lyzr-card rounded-2xl w-fit border border-cyan-500/30">
              <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Querying DuckDB analytical engine &amp; computing stability matrix...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Lyzr Floating Glass Input Footer */}
        <footer className="p-4 sm:p-6 border-t border-white/5 lyzr-glass shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="max-w-4xl mx-auto flex items-center gap-3 bg-[#0d101b] p-2 rounded-2xl border border-white/10 focus-within:border-cyan-500/50 transition-all shadow-2xl"
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a financial question (e.g. 'Which bank received the highest payout in 2025?')..."
              className="flex-1 bg-transparent px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-white shadow-lg shadow-cyan-500/20 transition-all shrink-0 font-semibold"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </footer>

        {/* Model Benchmark Modal */}
        <ModelBenchmarkModal
          isOpen={isBenchmarkOpen}
          onClose={() => setIsBenchmarkOpen(false)}
        />
      </div>
    </div>
  );
};
