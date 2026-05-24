import { Learner, ViewName } from '../types';

interface HeaderProps {
  currentView: ViewName;
  learner: Learner | null;
  onNavigate: (view: Exclude<ViewName, 'scenario'>) => void;
}

export default function Header({ currentView, learner, onNavigate }: HeaderProps) {
  return (
    <header className="header">
      <div className="container header-inner">
        <div className="brand">
          <strong>Phishing Awareness Simulator</strong>
          <span>
            {learner
              ? `Learner profile active: ${learner.displayName || 'Anonymous learner'}`
              : 'No learner profile yet'}
          </span>
        </div>
        <nav className="nav" aria-label="Primary navigation">
          <button className={currentView === 'home' ? 'active' : ''} onClick={() => onNavigate('home')}>
            Home
          </button>
          <button className={currentView === 'scenarios' || currentView === 'scenario' ? 'active' : ''} onClick={() => onNavigate('scenarios')}>
            Scenarios
          </button>
          <button className={currentView === 'dashboard' ? 'active' : ''} onClick={() => onNavigate('dashboard')}>
            Dashboard
          </button>
          <button className={currentView === 'resources' ? 'active' : ''} onClick={() => onNavigate('resources')}>
            Resources
          </button>
        </nav>
      </div>
    </header>
  );
}
