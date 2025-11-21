import React, { useEffect, useState } from 'react';
import { getUserSessions } from '../services/userRewardsService';

interface UserSession {
  id: number;
  busId: number;
  startTime: string;
  endTime?: string;
  startLocationId: number;
  endLocationId?: number;
  pointsEarned: number;
  distanceTracked: number;
  status: string;
}

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
      } catch (err) {
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
            <th>Bus ID</th>
            <th>Start Time</th>
            <th>End Time</th>
            <th>Points</th>
            <th>Distance (km)</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map(session => (
            <tr key={session.id}>
              <td>{session.busId}</td>
              <td>{new Date(session.startTime).toLocaleString()}</td>
              <td>{session.endTime ? new Date(session.endTime).toLocaleString() : '-'}</td>
              <td>{session.pointsEarned}</td>
              <td>{(session.distanceTracked / 1000).toFixed(2)}</td>
              <td>{session.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserSessionHistory;
