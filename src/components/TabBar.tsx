export type TabId = 'home' | 'calendar' | 'drinks' | 'settings';

type Props = {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
};

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'home', label: 'Home', icon: '⌂' },
  { id: 'calendar', label: 'Calendar', icon: '◫' },
  { id: 'drinks', label: 'Drinks', icon: '🍹' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

export const TabBar = ({ activeTab, onTabChange }: Props) => {
  return (
    <nav className="tab-bar" aria-label="Main tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          <span>{tab.icon}</span>
          <small>{tab.label}</small>
        </button>
      ))}
    </nav>
  );
};
