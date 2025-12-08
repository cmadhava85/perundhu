import React, { useEffect, useState } from 'react';
import { getUserSessions, type UserSession } from '../services/userRewardsService';

const UserSessionHistory: React.FC<{ userId: string }> = ({ userId }) => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSessions = async () => {
      try {
        if (isMounted) {
          setLoading(true);
        }
        const data = await getUserSessions(userId);
        
        if (isMounted) {
          setSessions(data);
          setError(null);
        }
      } catch {
        if (isMounted) {
          setError('Failed to load session history');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchSessions();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  if (loading) return <div>Loading session history...</div>;
  if (error) return <div>{error}</div>;
  if (!sessions.length) return <div>No session history found.</div>;

  return (
    <div className="user-session-history">
      <h3>Session History</h3>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Buses Tracked</th>
            <th>Duration</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(session => (
            <tr key={session.id}>
              <td>{new Date(session.sessionDate).toLocaleString()}</td>
              <td>{session.busesTracked}</td>
              <td>{session.duration}</td>
              <td>{session.pointsEarned}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserSessionHistory;
