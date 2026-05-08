import { useState, useEffect } from 'react';
import { Trash2, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getMyConversations, deleteConversation } from '../api/conversations';
import Avatar from './Avatar';

const POLL_INTERVAL_MS = 5_000;

export default function ConversationList({ activeId, onSelect, onDelete }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [hoveredId, setHoveredId] = useState(null);

  const fetchConversations = async () => {
    try {
      const { conversations } = await getMyConversations();
      setConversations(conversations);
    } catch (err) {
      console.error('Failed to load conversations', err);
    };
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (e, convoId) => {
    e.stopPropagation();
    if (!confirm('Remove this conversation from your inbox?')) return;
    try {
      await deleteConversation(convoId);
      setConversations((prev) => prev.filter((c) => c.id !== convoId));
      if (activeId === convoId) onDelete();
    } catch (err) {
      console.error(err);
    };
  };

  if (conversations.length === 0) {
    return (
      <p className="text-muted" style={{ padding: '1rem 1.25rem' }}>
        No conversations yet. Start one!
      </p>
    );
  };

  return (
    <div>
      {conversations.map((convo) => {
        const displayName = getConvoName(convo, user.id)
        const otherUser = getDmPartner(convo, user.id)
        const lastMsg = convo.messages?.[0]
        const preview = lastMsg
          ? lastMsg.imageUrl
            ? <Camera size={15} />
            : `${lastMsg.sender.id === user.id ? 'You: ' : ''}${lastMsg.text}`
          : 'No messages yet'

        return (
          <div
            key={convo.id}
            className={`convo-item ${activeId === convo.id ? 'active' : ''}`}
            onClick={() => onSelect(convo)}
            onMouseEnter={() => setHoveredId(convo.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <Avatar user={convo.isGroup ? groupAvatar(convo) : otherUser} size={38} />
            <div className="convo-info">
              <div className="convo-name">{displayName}</div>
              <div className="convo-preview">{preview}</div>
            </div>
            {hoveredId === convo.id && (
              <button
                className="convo-delete-btn"
                onClick={(e) => handleDelete(e, convo.id)}
                title="Delete conversation"
              >
                <Trash2 size={15} />
              </button>
            )}
          </div>
        )
      })}
    </div>
  );
};

const getConvoName = (convo, myId) => {
  if (convo.isGroup) return convo.name || 'Group';
  const other = getDmPartner(convo, myId);
  return other?.username || 'Unknown';
};

const getDmPartner = (convo, myId) => {
  return convo.members?.find((m) => m.userId !== myId)?.user || null;
};

const groupAvatar = (convo) => ({
  username: convo.name || 'Group',
  avatarUrl: convo.avatarUrl || null,
});