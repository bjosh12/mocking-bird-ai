import { useEffect, useState } from 'react';
import { useStore } from '@/store/useStore';

export function Settings() {
  const { setCurrentView, isLicensed } = useStore();
  const [deepgramKey, setDeepgramKey] = useState('');
  const [openAiKey, setOpenAiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if ((window as any).electronAPI) {
      const loadKeys = async () => {
        const dgKey = await (window as any).electronAPI.store.get('DEEPGRAM_API_KEY');
        const oaKey = await (window as any).electronAPI.store.get('OPENAI_API_KEY');
        if (dgKey) setDeepgramKey(dgKey);
        if (oaKey) setOpenAiKey(oaKey);
      };
      loadKeys();
    }
  }, []);

  const handleSave = async () => {
    if ((window as any).electronAPI) {
      await (window as any).electronAPI.store.set('DEEPGRAM_API_KEY', deepgramKey);
      await (window as any).electronAPI.store.set('OPENAI_API_KEY', openAiKey);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem 1rem',
    background: '#111118',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 10, color: '#fff', fontSize: '0.9rem',
    outline: 'none', boxSizing: 'border-box'
  };

  return (
    <div style={{ height: '100vh', overflowY: 'auto', background: 'linear-gradient(145deg, #0a0a0f 0%, #0d0d1a 100%)', padding: '2rem', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Settings</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Configure your AI engine and stealth preferences</p>
          </div>
          <button 
            onClick={() => setCurrentView('home')}
            style={{ padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer' }}
          >
            ← Back to Dashboard
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* API Keys Card - ONLY FOR LIFETIME LICENSED USERS */}
          {isLicensed ? (
            <div style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🔑</span> API Configuration (Lifetime Mode)
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                As a Lifetime License holder, you use your own API keys. This ensures unlimited access and full privacy of your data.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Deepgram API Key</label>
                  <input type="password" value={deepgramKey} onChange={e => setDeepgramKey(e.target.value)} placeholder="sk-..." style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>OpenAI API Key</label>
                  <input type="password" value={openAiKey} onChange={e => setOpenAiKey(e.target.value)} placeholder="sk-..." style={inputStyle} />
                </div>
                <button 
                  onClick={handleSave}
                  style={{ 
                    marginTop: '1rem',
                    padding: '0.875rem', 
                    background: isSaved ? '#22c55e' : 'linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%)',
                    border: 'none',
                    borderRadius: 10, 
                    color: '#fff', 
                    fontWeight: 700, 
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {isSaved ? "✓ Settings Saved" : "Save Configuration"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 16, padding: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c4b5fd', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>☁️</span> Cloud Managed AI
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                You are currently using our hosted AI engine. No configuration is required. 
                Your transcription and answer generation are handled automatically via your subscription.
              </p>
              <button 
                onClick={() => window.open('https://localhost:3000/pricing', '_blank')}
                style={{ marginTop: '1.5rem', background: 'none', border: '1px solid rgba(196,181,253,0.3)', color: '#c4b5fd', padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
              >
                Switch to Lifetime License →
              </button>
            </div>
          )}

          {/* Stealth Mode Info Card */}
          <div style={{ background: 'linear-gradient(135deg, rgba(167,139,250,0.05) 0%, rgba(124,58,237,0.02) 100%)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 16, padding: '2rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#c4b5fd', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span>🕵️‍♂️</span> Stealth Mode Guide
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', marginBottom: '0.5rem' }}>Global Hotkey</div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                  Press <code style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 4, color: '#c4b5fd' }}>Alt + C</code> anywhere on your system to instantly hide or show the Copilot widget.
                </p>
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', marginBottom: '0.5rem' }}>Ghost Mode</div>
                <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                  Use the ghost toggle in the widget header to enable click-through mode. This prevents accidental clicks during coding interviews.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
