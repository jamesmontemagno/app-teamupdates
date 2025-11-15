// Team context for managing current team from URL params

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Team } from '../api/types';
import * as api from '../api';

interface TeamContextShape {
  teamId: string | null;
  team: Team | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

const TeamContext = createContext<TeamContextShape>({
  teamId: null,
  team: null,
  loading: false,
  error: null,
  refetch: () => {},
});

export function TeamProvider({ children }: { children: React.ReactNode }) {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = async () => {
    if (!teamId) {
      setTeam(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fetchedTeam = await api.getTeam(teamId);
      setTeam(fetchedTeam);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load team';
      setError(message);
      setTeam(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  const value = useMemo(
    () => ({
      teamId: teamId || null,
      team,
      loading,
      error,
      refetch: fetchTeam,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [teamId, team, loading, error]
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTeam() {
  return useContext(TeamContext);
}
