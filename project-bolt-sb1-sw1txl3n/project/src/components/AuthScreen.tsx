import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Mail, Lock } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fn = mode === 'signin' ? signIn : signUp;
    const { error } = await fn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
    }
  };

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-ink-950 p-4">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div
          className="absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-[0.07] blur-[120px]"
          style={{ background: 'radial-gradient(circle, #A9C7FF 0%, transparent 70%)' }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="relative z-10 w-full max-w-[400px] rounded-xl4 border border-white/[0.08] bg-ink-900/80 p-8 shadow-win backdrop-blur-2xl"
      >
        {/* Title */}
        <div className="mb-7">
          <h1 className="text-[26px] font-bold tracking-tight text-white">
            NextStep
          </h1>
          <p className="mt-2 text-[13px] text-white/45">
            Your intelligent desktop assistant. Sign in to save conversations and get real answers.
          </p>
        </div>

        {/* Mode toggle */}
        <div className="mb-5 flex gap-1 rounded-xl border border-white/8 bg-white/[0.02] p-1">
          <ModeTab active={mode === 'signin'} onClick={() => setMode('signin')}>
            Sign in
          </ModeTab>
          <ModeTab active={mode === 'signup'} onClick={() => setMode('signup')}>
            Create account
          </ModeTab>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Field
            icon={<Mail size={15} strokeWidth={1.75} />}
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={setEmail}
            autoComplete="email"
            required
          />
          <Field
            icon={<Lock size={15} strokeWidth={1.75} />}
            type="password"
            placeholder="Password"
            value={password}
            onChange={setPassword}
            autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            required
          />

          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="rounded-lg border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-[12px] text-red-300/90"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.01 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-[13px] font-semibold text-ink-950 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {mode === 'signin' ? 'Sign in' : 'Create account'}
                <ArrowRight size={15} strokeWidth={2} />
              </>
            )}
          </motion.button>
        </form>

        <p className="mt-5 text-center text-[11px] text-white/30">
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
            }}
            className="font-medium text-accent-ice/80 underline-offset-2 hover:underline"
          >
            {mode === 'signin' ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </motion.div>
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'flex-1 rounded-lg py-2 text-[12px] font-medium transition-all',
        active ? 'bg-white/[0.08] text-white/90' : 'text-white/40 hover:text-white/60',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function Field({
  icon,
  type,
  placeholder,
  value,
  onChange,
  autoComplete,
  required,
}: {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.02] px-3.5 py-3 transition-colors focus-within:border-accent-ice/30">
      <span className="text-white/35">{icon}</span>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        className="w-full bg-transparent text-[13px] text-white/90 placeholder:text-white/30 focus:outline-none"
      />
    </div>
  );
}
