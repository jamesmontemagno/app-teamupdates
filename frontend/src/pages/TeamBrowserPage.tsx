// Team browser page

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../api';
import type { Team } from '../api/types';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { ErrorMessage } from '../components/ErrorMessage';
import { showError, showSuccess } from '../utils/toast';
import { logInfo, logError, recordTeamOperation } from '../telemetry';
import styles from './TeamBrowserPage.module.css';

const USER_ID_KEY = 'teamUpdatesUserId';

export function TeamBrowserPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [publicTeams, setPublicTeams] = useState<Team[]>([]);
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joiningTeamId, setJoiningTeamId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem(USER_ID_KEY);
    setUserId(storedUserId);
    fetchTeams(storedUserId);
  }, []);

  const fetchTeams = async (currentUserId: string | null) => {
    setLoading(true);
    setError(null);

    try {
      const [allPublicTeams, userTeamsList] = await Promise.all([
        api.getTeams(),
        currentUserId ? api.getUserTeams(currentUserId) : Promise.resolve([]),
      ]);

      setPublicTeams(allPublicTeams);
      setUserTeams(userTeamsList);
      
      logInfo('Teams loaded', {
        'teams.public_count': allPublicTeams.length,
        'teams.user_count': userTeamsList.length,
        'user.has_profile': !!currentUserId,
        'component': 'TeamBrowserPage'
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load teams';
      setError(message);
      logError('Failed to load teams', err as Error, {
        'user.id': currentUserId || 'none',
        'component': 'TeamBrowserPage'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (teamId: string) => {
    if (!userId) {
      showError('Please create a profile first');
      logInfo('User attempted to join team without profile', {
        'team.id': teamId,
        'component': 'TeamBrowserPage'
      });
      navigate('/profile/new');
      return;
    }

    setJoiningTeamId(teamId);
    const startTime = performance.now();
    
    const team = publicTeams.find(t => t.id === teamId);
    logInfo('User joining team', {
      'team.id': teamId,
      'team.name': team?.name || 'unknown',
      'user.id': userId,
      'component': 'TeamBrowserPage'
    });

    try {
      await api.joinTeam(teamId, userId);
      const latency = performance.now() - startTime;
      
      recordTeamOperation('join', true);
      logInfo('Successfully joined team', {
        'team.id': teamId,
        'team.name': team?.name || 'unknown',
        'user.id': userId,
        'latency.ms': latency,
        'component': 'TeamBrowserPage'
      });
      
      showSuccess('Successfully joined team!');
      // Refresh teams
      await fetchTeams(userId);
    } catch (err) {
      const latency = performance.now() - startTime;
      
      recordTeamOperation('join', false);
      logError('Failed to join team', err as Error, {
        'team.id': teamId,
        'team.name': team?.name || 'unknown',
        'user.id': userId,
        'latency.ms': latency,
        'component': 'TeamBrowserPage'
      });
      
      showError(err, 'Failed to join team');
    } finally {
      setJoiningTeamId(null);
    }
  };

  const handleTeamClick = (teamId: string) => {
    navigate(`/teams/${teamId}`);
  };

  const isUserMember = (teamId: string) => {
    return userTeams.some((t) => t.id === teamId);
  };

  if (loading) {
    return <LoadingSpinner text="Loading teams..." />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={() => fetchTeams(userId)} />;
  }

  return (
    <div className={styles.container}>
      {!userId && (
        <div className={styles.banner}>
          <p>👋 Create a profile to join teams and start posting updates</p>
          <button onClick={() => navigate('/profile/new')} className={styles['banner-button']}>
            Create Profile
          </button>
        </div>
      )}

      {userTeams.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles['section-title']}>Your Teams</h2>
          <div className={styles.grid}>
            {userTeams.map((team) => (
              <div
                key={team.id}
                className={styles.card}
                onClick={() => handleTeamClick(team.id)}
              >
                <div className={styles['card-content']}>
                  <h3 className={styles['card-title']}>{team.name}</h3>
                  <p className={styles['card-meta']}>
                    {team.memberCount || 0} member{team.memberCount !== 1 ? 's' : ''}
                  </p>
                  {!team.isPublic && (
                    <span className={styles['private-badge']}>🔒 Private</span>
                  )}
                </div>
                <div className={styles['card-actions']}>
                  <span className={styles['member-badge']}>✓ Member</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles['section-title']}>Public Teams</h2>
        {publicTeams.length === 0 ? (
          <p className={styles['empty-state']}>No public teams available</p>
        ) : (
          <div className={styles.grid}>
            {publicTeams.map((team) => {
              const isMember = isUserMember(team.id);
              const isJoining = joiningTeamId === team.id;

              return (
                <div
                  key={team.id}
                  className={styles.card}
                  onClick={() => handleTeamClick(team.id)}
                >
                  <div className={styles['card-content']}>
                    <h3 className={styles['card-title']}>{team.name}</h3>
                    <p className={styles['card-meta']}>
                      {team.memberCount || 0} member{team.memberCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className={styles['card-actions']}>
                    {isMember ? (
                      <span className={styles['member-badge']}>✓ Member</span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleJoinTeam(team.id);
                        }}
                        disabled={isJoining || !userId}
                        className={styles['join-button']}
                      >
                        {isJoining ? 'Joining...' : 'Join'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
