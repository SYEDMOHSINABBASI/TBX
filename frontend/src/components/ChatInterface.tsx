'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, RefreshCw, Cpu, Database, Mic, ArrowRight, Shield, Layers, TrendingUp, AlertCircle, FileCheck } from 'lucide-react';
import { ChatMessage } from '@/lib/types';
import { TruthPanel } from './TruthPanel';
import { ModelBenchmarkModal } from './ModelBenchmarkModal';
import { Sidebar } from './Sidebar';

const LEDGER_PULSE_TILES = [
  { label: "Spend Last Month", query: "What did we spend last month?", val: "₹155.85L", status: "Sensitive" },
  { label: "Top 5 Counterparties", query: "Who were our top five counterparties last quarter?", val: "5 Entities", status: "Stable" },
  { label: "NEFT June Outflow", query: "How much went out through NEFT in June?", val: "₹79.57L", status: "Stable" },
  { label: "Account Balance", query: "What is the balance across all our accounts?", val: "₹87.52L", status: "Stable" },
  { label: "Unreconciled Check", query: "Which accounts do not reconcile?", val: "1 Gap", status: "Sensitive" }
];

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isBenchmarkOpen, setIsBenchmarkOpen] = useState<boolean>(false);
  const [recordCount, setRecordCount] = useState<number>(100000);
  const [resolverCoverage, setResolverCoverage] = useState<number>(0.9701);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch schema & health stats
    fetch('/api/schema')
      .then(res => res.json())
      .then(data => {
        if (data.rows) setRecordCount(data.rows);
        if (data.resolver_coverage) setResolverCoverage(data.resolver_coverage);
      })
      .catch(() => {
        setRecordCount(100000);
        setResolverCoverage(0.9701);
      });

    // Check for ?replay= URL parameters
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const replay = urlParams.get('replay');
      if (replay === 'spend_last_month') {
        handleSend("What did we spend last month?");
      } else if (replay === 'error') {
        handleSend("How much did we spend on the marketing category last month?");
      }
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleNewChat = () => {
    setMessages([]);
    setInput('');
  };

  const handleVoiceSimulate = () => {
    setIsVoiceActive(true);
    setTimeout(() => {
      setIsVoiceActive(false);
      handleSend("What did we spend last month?");
    }, 1500);
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
      {/* Veritas Sidebar */}
      <Sidebar
        onNewChat={handleNewChat}
        onOpenBenchmark={() => setIsBenchmarkOpen(true)}
        recordCount={recordCount}
        resolverCoverage={resolverCoverage}
      />

      {/* Main Workspace Canvas */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-[#090c15]">
        {/* Floating Glass Header */}
        <header className="px-6 py-3 border-b border-white/5 lyzr-glass flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-white tracking-tight">Veritas Workspace</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  LEDGER PRO
                </span>
              </div>
              <p className="text-xs text-slate-400">Deterministic DuckDB Financial Engine &amp; Counterparty Resolver</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBenchmarkOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-semibold transition-all shadow-sm"
            >
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>Model Benchmark (&lt;20B Cap)</span>
            </button>
          </div>
        </header>

        {/* Ledger Pulse Tiles Bar */}
        <div className="px-6 py-3 border-b border-white/5 bg-[#0b0e18] flex items-center gap-3 overflow-x-auto text-xs shrink-0">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5 shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            Ledger Pulse:
          </span>

          {LEDGER_PULSE_TILES.map((tile, i) => (
            <button
              key={i}
              onClick={() => handleSend(tile.query)}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 text-left transition-all shrink-0 flex items-center gap-2.5 group"
            >
              <div>
                <div className="text-[10px] text-slate-400 font-medium group-hover:text-emerald-300 transition-colors">{tile.label}</div>
                <div className="text-xs font-bold text-white font-mono">{tile.val}</div>
              </div>
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                tile.status === 'Stable' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
              }`}>
                {tile.status}
              </span>
            </button>
          ))}
        </div>

        {/* Scrollable Conversation Workspace */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          {/* Welcome Screen when conversation is empty */}
          {messages.length === 0 && (
            <div className="max-w-4xl mx-auto space-y-8 pt-4 pb-12">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  Veritas — Plain-Language Company Ledger Intelligence
                </div>

                <h2 className="text-3xl sm:text-5xl font-extrabold text-gradient-cyan tracking-tight">
                  Company Ledger Answers with Proven Working
                </h2>

                <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                  Queries run deterministically over <strong className="text-slate-200 font-semibold">bank, account, and transaction</strong> tables. Shows underlying records, alternative readings, and interpretation stability.
                </p>
              </div>

              {/* Sample Prompt Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleSend("What did we spend last month?")}
                  className="p-5 rounded-2xl lyzr-card border border-white/5 text-left flex items-start gap-4 transition-all lyzr-card-hover group"
                >
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500/20 transition-all shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors flex items-center gap-1.5">
                      Spend Last Month
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div className="text-xs text-slate-400 leading-relaxed">
                      "What did we spend last month?" (Shows transaction date vs settlement date sensitivity)
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleSend("Who were our top five counterparties last quarter?")}
                  className="p-5 rounded-2xl lyzr-card border border-white/5 text-left flex items-start gap-4 transition-all lyzr-card-hover group"
                >
                  <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500/20 transition-all shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                      Top 5 Counterparties
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div className="text-xs text-slate-400 leading-relaxed">
                      "Who were our top five counterparties last quarter?" (Decoded via Counterparty Resolver)
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleSend("Which accounts do not reconcile?")}
                  className="p-5 rounded-2xl lyzr-card border border-white/5 text-left flex items-start gap-4 transition-all lyzr-card-hover group"
                >
                  <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500/20 transition-all shrink-0">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors flex items-center gap-1.5">
                      Reconciliation Check
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div className="text-xs text-slate-400 leading-relaxed">
                      "Which accounts do not reconcile?" (Runs R1 Balance Gap &amp; R3 Untraceable checks)
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => handleSend("Find the transaction with reference 7797183088")}
                  className="p-5 rounded-2xl lyzr-card border border-white/5 text-left flex items-start gap-4 transition-all lyzr-card-hover group"
                >
                  <div className="p-3 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20 group-hover:bg-violet-500/20 transition-all shrink-0">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors flex items-center gap-1.5">
                      Reference Lookup
                      <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div className="text-xs text-slate-400 leading-relaxed">
                      "Find transaction with reference 7797183088" (Plaintext reference search)
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Active Message Thread */}
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-300 shrink-0 h-fit mt-1">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div className={`max-w-3xl space-y-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-4 sm:p-5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/10 rounded-tr-none font-medium'
                      : 'lyzr-card text-slate-200 border border-white/10 rounded-tl-none'
                  }`}
                >
                  <div>{msg.content}</div>

                  {msg.is_clarification && msg.clarification_options && (
                    <div className="mt-4 space-y-2 pt-3 border-t border-white/10">
                      <div className="text-xs font-semibold text-emerald-300">Suggested Clarifications:</div>
                      <div className="flex flex-wrap gap-2">
                        {msg.clarification_options.map((opt, i) => (
                          <button
                            key={i}
                            onClick={() => handleSend(opt)}
                            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs text-emerald-300 border border-emerald-500/30 transition-all font-medium"
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
            <div className="flex gap-3 items-center text-slate-300 text-xs p-4 lyzr-card rounded-2xl w-fit border border-emerald-500/30">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              <span>Querying DuckDB &amp; Counterparty Resolver...</span>
            </div>
          )}

          {isVoiceActive && (
            <div className="flex gap-3 items-center text-emerald-300 text-xs p-4 lyzr-card rounded-2xl w-fit border border-emerald-500/50 animate-pulse">
              <Mic className="w-4 h-4 text-emerald-400" />
              <span>Sarvam API: Listening &amp; Transcribing spoken Indian language speech...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        {/* Floating Glass Input Footer with Sarvam Voice Icon */}
        <footer className="p-4 sm:p-6 border-t border-white/5 lyzr-glass shrink-0">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="max-w-4xl mx-auto flex items-center gap-3 bg-[#0d101b] p-2 rounded-2xl border border-white/10 focus-within:border-emerald-500/50 transition-all shadow-2xl"
          >
            <button
              type="button"
              onClick={handleVoiceSimulate}
              title="Speak in Indian Language (Sarvam Voice API)"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-emerald-400 border border-white/10 transition-all shrink-0"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask a ledger question (e.g. 'What did we spend last month?')..."
              className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-40 text-white shadow-lg shadow-emerald-500/20 transition-all shrink-0 font-semibold"
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
