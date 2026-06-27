import { useState } from 'react';
import { BottomNav } from './components/BottomNav';
import { RestTimerBar } from './components/RestTimerBar';
import { usePwaUpdate } from './hooks/usePwaUpdate';
import { HistoryScreen } from './screens/HistoryScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { TodayScreen } from './screens/TodayScreen';
import type { Tab } from './store/useAppStore';

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const { needRefresh, update, dismiss } = usePwaUpdate();

  return (
    <div className="app">
      {tab === 'today' && <TodayScreen />}
      {tab === 'history' && <HistoryScreen />}
      {tab === 'settings' && <SettingsScreen />}

      <RestTimerBar />

      {needRefresh && (
        <div className="update-toast">
          <span>New version available</span>
          <button onClick={update}>Reload</button>
          <button onClick={dismiss}>✕</button>
        </div>
      )}

      <BottomNav tab={tab} onChange={setTab} />
    </div>
  );
}
