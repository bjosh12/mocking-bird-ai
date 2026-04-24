import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';


export function History() {
  const { setCurrentView, setCurrentSession } = useStore();
  const [sessions, setSessions] = useState<any[]>([]);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  useEffect(() => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.db.getSessions().then(setSessions);
    }
  }, []);

  const handleReview = (session: any) => {
    setCurrentSession(session);
    setCurrentView('scorecard');
  };

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: 'linear-gradient(145deg, #0a0a0f 0%, #0d0d1a 100%)', padding: '2rem', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Interview History</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Review your past performances and AI suggestions</p>
          </div>
          <button 
            onClick={() => setCurrentView('home')}
            style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            ← Back to Dashboard
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {sessions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', background: 'rgba(255,255,255,0.02)', borderRadius: 16, border: '1px dashed rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
              <p style={{ color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>No interview sessions found yet.</p>
            </div>
          ) : (
            sessions.map(session => (
              <div 
                key={session.id}
                onMouseEnter={() => setHoveredId(session.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{ 
                  background: hoveredId === session.id ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.025)', 
                  border: '1px solid',
                  borderColor: hoveredId === session.id ? 'rgba(167,139,250,0.3)' : 'rgba(255,255,255,0.07)',
                  borderRadius: 14, 
                  padding: '1.25rem 1.5rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: hoveredId === session.id ? 'translateY(-2px)' : 'none',
                  boxShadow: hoveredId === session.id ? '0 10px 30px -10px rgba(0,0,0,0.5)' : 'none'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#a78bfa' }} />
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: 0 }}>{session.job_title}</h3>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', paddingLeft: '1.25rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>{session.company_name}</span>
                    <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.25)' }}>{new Date(session.created_at).toLocaleString()}</span>
                  </div>
                </div>
                <button 
                  onClick={() => handleReview(session)}
                  style={{ 
                    padding: '0.625rem 1.25rem', 
                    background: hoveredId === session.id ? 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)' : 'rgba(167,139,250,0.1)',
                    border: 'none',
                    borderRadius: 9, 
                    color: hoveredId === session.id ? '#fff' : '#c4b5fd', 
                    fontSize: '0.8rem', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  Review Details →
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
