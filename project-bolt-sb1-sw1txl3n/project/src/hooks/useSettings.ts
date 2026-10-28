import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import type { Accent, Theme } from '@/types';

interface DbSettings {
  api_key: string | null;
  model: string;
  theme: Theme;
  accent: Accent;
  enable_animations: boolean;
}

const DEFAULT_SETTINGS: DbSettings = {
  api_key: null,
  model: 'gpt-4o-mini',
  theme: 'dark',
  accent: 'ice',
  enable_animations: true,
};

export function useSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<DbSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from('user_settings')
        .select('api_key, model, theme, accent, enable_animations')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        setLoading(false);
        return;
      }

      if (data) {
        setSettings(data as DbSettings);
      } else {
        // Create default settings row
        const { data: created } = await supabase
          .from('user_settings')
          .insert({ user_id: user.id })
          .select('api_key, model, theme, accent, enable_animations')
          .maybeSingle();
        if (created && active) setSettings(created as DbSettings);
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [user]);

  const update = useCallback(
    async (patch: Partial<DbSettings>) => {
      if (!user) return;
      setSettings((prev) => ({ ...prev, ...patch }));
      await supabase.from('user_settings').update(patch).eq('user_id', user.id);
    },
    [user],
  );

  return { settings, update, loading };
}
