import { motion } from 'framer-motion';
import { ChevronRight, History, Search, Settings as SettingsIcon, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Answer, AppPreferences } from '@/types';

interface ExpandedWorkspaceProps {
  history: Answer[];
  prefs: AppPreferences;
  onUpdatePrefs: (patch: Partial<AppPreferences>) => void;
  onClearHistory: () => void;
  onSelectSession: (answer: Answer) => void;
  onBack: () => void;
}

type Tab = 'history' | 'settings';

export function ExpandedWorkspace({
  history,
  prefs,
  onUpdatePrefs,
  onClearHistory,
  onSelectSession,
  onBack,
}: ExpandedWorkspaceProps) {
  const [tab, setTab] = useState<Tab>('history');
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    if (!query.trim()) return history;
    const q = query.toLowerCase();
    return history.filter(
      (a) => a.prompt.toLowerCase().includes(q) || a.intro.toLowerCase().includes(q),
    );
  }, [history, query]);

  return (
    <div className="flex h-full flex-col">
      {/* Sub-header with tabs */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-2.5">
        <div className="flex items-center gap-1">
          <TabButton active={tab === 'history'} onClick={() => setTab('history')} icon={<History size={13} strokeWidth={1.75} />}>
            History
          </TabButton>
          <TabButton active={tab === 'settings'} onClick={() => setTab('settings')} icon={<SettingsIcon size={13} strokeWidth={1.75} />}>
            Settings
          </TabButton>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="rounded-lg px-2 py-1 text-[11px] font-medium text-white/45 transition-colors hover:bg-white/[0.06] hover:text-white/80"
        >
          Back
        </button>
      </div>

      {tab === 'history' ? (
        <HistoryTab
          items={filtered}
          query={query}
          onQuery={setQuery}
          onClear={onClearHistory}
          onSelect={onSelectSession}
          hasItems={history.length > 0}
        />
      ) : (
        <SettingsTab prefs={prefs} onUpdate={onUpdatePrefs} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'focus-ring flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11.5px] font-medium transition-colors',
        active
          ? 'bg-white/[0.07] text-white/90'
          : 'text-white/45 hover:bg-white/[0.04] hover:text-white/70',
      ].join(' ')}
    >
      {icon}
      {children}
    </button>
  );
}

function HistoryTab({
  items,
  query,
  onQuery,
  onClear,
  onSelect,
  hasItems,
}: {
  items: Answer[];
  query: string;
  onQuery: (v: string) => void;
  onClear: () => void;
  onSelect: (a: Answer) => void;
  hasItems: boolean;
}) {
  if (!hasItems) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/8 bg-white/[0.02]">
          <History size={20} className="text-white/30" strokeWidth={1.5} />
        </div>
        <p className="text-[12.5px] font-medium text-white/50">No sessions yet</p>
        <p className="text-[11px] text-white/30">Your answered questions will appear here.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-2.5">
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-1.5">
          <Search size={13} className="text-white/35" strokeWidth={1.75} />
          <input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder="Search sessions…"
            className="w-full bg-transparent text-[12px] text-white/80 placeholder:text-white/30 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear history"
          className="focus-ring grid h-8 w-8 place-items-center rounded-xl text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 size={14} strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-4">
        {items.length === 0 ? (
          <p className="py-8 text-center text-[11.5px] text-white/30">No matches for "{query}".</p>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <motion.button
                key={item.id}
                type="button"
                onClick={() => onSelect(item)}
                whileHover={{ x: 2 }}
                transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                className="group flex w-full items-center gap-3 rounded-xl2 border border-white/8 bg-white/[0.02] px-3.5 py-3 text-left transition-colors hover:border-white/15 hover:bg-white/[0.04]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[12px] font-medium text-white/85">{item.prompt}</p>
                  <p className="mt-0.5 truncate text-[10.5px] text-white/35">
                    {item.intro} · {item.steps.length} steps
                  </p>
                </div>
                <ChevronRight size={14} className="text-white/25 transition-colors group-hover:text-white/50" strokeWidth={1.75} />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsTab({
  prefs,
  onUpdate,
}: {
  prefs: AppPreferences;
  onUpdate: (patch: Partial<AppPreferences>) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4">
      <div className="space-y-5">
        <SettingsSection title="Assistant">
          <ToggleRow
            label="Pin on top"
            description="Keep the window above other apps"
            checked={prefs.pinOnTop}
            onChange={(v) => onUpdate({ pinOnTop: v })}
          />
        </SettingsSection>

        <SettingsSection title="AI Model">
          <SelectRow
            label="Model"
            value={prefs.model}
            options={['Local AI', 'Ollama (soon)', 'Cloud (soon)']}
            onChange={(v) => onUpdate({ model: v })}
          />
          <p className="px-1 pt-2 text-[10.5px] leading-relaxed text-white/30">
            NextStep is prepared for a local Ollama integration. Browser builds use a clearly
            labelled mock provider — no real AI calls are made.
          </p>
        </SettingsSection>

        <SettingsSection title="Appearance">
          <SelectRow
            label="Accent"
            value={prefs.accent === 'ice' ? 'Icy Blue' : 'Soft Violet'}
            options={['Icy Blue', 'Soft Violet']}
            onChange={(v) => onUpdate({ accent: v === 'Icy Blue' ? 'ice' : 'violet' })}
          />
          <ToggleRow
            label="Enable animations"
            description="Motion and micro-interactions"
            checked={prefs.enableAnimations}
            onChange={(v) => onUpdate({ enableAnimations: v })}
          />
        </SettingsSection>

        <SettingsSection title="Privacy">
          <p className="px-1 text-[10.5px] leading-relaxed text-white/35">
            Sessions are stored locally on this device only. Nothing is sent to a server in the
            browser build. Clearing history removes them permanently.
          </p>
        </SettingsSection>
      </div>
    </div>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-wider text-white/35">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl2 border border-white/8 bg-white/[0.02] px-3.5 py-3">
      <div>
        <p className="text-[12px] font-medium text-white/85">{label}</p>
        {description && <p className="mt-0.5 text-[10.5px] text-white/35">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={[
          'focus-ring relative h-5 w-9 rounded-full border transition-colors duration-200',
          checked ? 'border-accent-ice/40 bg-accent-ice/25' : 'border-white/10 bg-white/[0.04]',
        ].join(' ')}
      >
        <motion.span
          layout
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className={[
            'absolute top-0.5 h-3.5 w-3.5 rounded-full',
            checked ? 'left-[18px] bg-white' : 'left-0.5 bg-white/50',
          ].join(' ')}
        />
      </button>
    </div>
  );
}

function SelectRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl2 border border-white/8 bg-white/[0.02] px-3.5 py-3">
      <p className="text-[12px] font-medium text-white/85">{label}</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="focus-ring rounded-lg border border-white/10 bg-ink-800 px-2.5 py-1.5 text-[11.5px] font-medium text-white/80 focus:outline-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt} className="bg-ink-800 text-white">
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}
