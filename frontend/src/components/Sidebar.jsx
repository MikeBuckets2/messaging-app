import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SquarePen, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ConversationList from './ConversationList';
import FriendsPanel from './FriendsPanel';
import NewConversationModal from './NewConversationModal';
import Avatar from './Avatar';

export default function Sidebar({ activeConversationId, onSelectConversation, onDeleteActiveConversation }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('chats');
  const [showNewConvoModal, setShowNewConvoModal] = useState(false);

  const handleNewConversation = (conversation) => {
    setShowNewConvoModal(false);
    onSelectConversation(conversation);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-logo">Echo</span>
        <div className="sidebar-actions">
          <button
            className="icon-btn"
            title="New conversation"
            onClick={() => setShowNewConvoModal(true)}
          >
            <SquarePen size={18} />
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
        {['chats', 'friends'].map((tab) => (
          <button
            key={tab}
            onClick={() => setView(tab)}
            style={{
              flex: 1,
              padding: '0.6rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: view === tab ? '#fff' : 'var(--sidebar-text)',
              borderBottom: `2px solid ${view === tab ? 'var(--accent)' : 'transparent'}`,
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="sidebar-scroll">
        {view === 'chats' ? (
          <ConversationList
            activeId={activeConversationId}
            onSelect={onSelectConversation}
            onDelete={onDeleteActiveConversation}
          />
        ) : (
          <FriendsPanel onStartDm={onSelectConversation} />
        )}
      </div>

      <div className="sidebar-footer">
        <Avatar user={user} size={34} />
        <div className="sidebar-user-info">
          <div className="sidebar-username">{user?.username}</div>
          <div className="sidebar-user-status">Online</div>
        </div>
        <button className="icon-btn" title="Profile" onClick={() => navigate('/profile')}>
          <Settings size={18} />
        </button>
        <button className="icon-btn" title="Logout" onClick={logout}>
          <LogOut size={18} />
        </button>
      </div>

      {showNewConvoModal && (
        <NewConversationModal
          onClose={() => setShowNewConvoModal(false)}
          onCreated={handleNewConversation}
        />
      )}
    </aside>
  );
};