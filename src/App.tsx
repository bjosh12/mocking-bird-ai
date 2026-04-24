import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { Onboarding } from './screens/Onboarding';
import { HomeDashboard } from './screens/HomeDashboard';
import { LiveSession } from './screens/LiveSession';
import { History } from './screens/History';
import { Settings } from './screens/Settings';
import { Scorecard } from './screens/Scorecard';
import { Widget } from './screens/Widget';
import { TitleBar } from './components/TitleBar';
import { KnowledgeBase } from './screens/KnowledgeBase';
import { CloudLogin } from './screens/CloudLogin';

function App() {
  const { currentView, setDocuments } = useStore();
  const [isWidget, setIsWidget] = useState(false);

  useEffect(() => {
    if ((window as any).electronAPI) {
      (window as any).electronAPI.db.getDocuments().then(setDocuments);
    }
  }, []);

  useEffect(() => {
    if (window.location.hash === '#widget') {
      setIsWidget(true);
    }
  }, []);

  if (isWidget) {
    return <Widget />;
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground font-sans antialiased selection:bg-primary selection:text-primary-foreground overflow-hidden">
      <TitleBar />
      <div className="flex-1 overflow-y-auto">
        {currentView === 'cloud-login' && <CloudLogin />}
        {currentView === 'onboarding' && <Onboarding />}
        {currentView === 'home' && <HomeDashboard />}
        {currentView === 'live-session' && <LiveSession />}
        {currentView === 'history' && <History />}
        {currentView === 'settings' && <Settings />}
        {currentView === 'scorecard' && <Scorecard />}
        {currentView === 'knowledge-base' && <KnowledgeBase />}
      </div>
    </div>
  );
}

export default App;
