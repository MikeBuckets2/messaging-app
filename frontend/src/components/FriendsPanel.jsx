import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getFriends, getFriendRequests, respondToRequest, removeFriend } from '../api/friends';
import { createConversation } from '../api/conversations';
import Avatar from './Avatar';

const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

export default function FriendsPanel({ onStartDm }) {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState('friends');

  useEffect(() => {
    loadFriends();
    loadRequests();
  }, []);

  const loadFriends = async () => {
    try {
      const { friends } = await getFriends();
      setFriends(friends);
    } catch (err) {
      console.error(err);
    };
  };

  const loadRequests = async () => {
    try {
      const { requests } = await getFriendRequests();
      setRequests(requests);
    } catch (err) {
      console.error(err);
    };
  };

  const handleRespond = async (requestId, action) => {
    try {
      await respondToRequest(requestId, action);
      await Promise.all([loadFriends(), loadRequests()]);
    } catch (err) {
      console.error(err);
    };
  };

  const handleRemoveFriend = async (friendshipId) => {
    if (!confirm('Remove this friend?')) return;
    try {
      await removeFriend(friendshipId);
      setFriends((prev) => prev.filter((f) => f.friendshipId !== friendshipId));
    } catch (err) {
      console.error(err);
    };
  };

  const handleStartDm = async (friend) => {
    try {
      const { conversation } = await createConversation({
        type: 'dm',
        recipientId: friend.id,
      });
      onStartDm(conversation);
    } catch (err) {
      console.error(err);
    };
  };

  const isOnline = (lastSeenAt) =>
    Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;

  return (
    <div>
      <div style={{ display: 'flex', padding: '0.75rem 1.25rem 0.5rem', gap: '0.75rem' }}>
        <button
          onClick={() => setTab('friends')}
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: tab === 'friends' ? 'var(--accent)' : 'var(--sidebar-text)',
          }}
        >
          Friends ({friends.length})
        </button>
        <button
          onClick={() => setTab('requests')}
          style={{
            fontSize: '0.8rem',
            fontWeight: 600,
            color: tab === 'requests' ? 'var(--accent)' : 'var(--sidebar-text)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          Requests
          {requests.length > 0 && (
            <span className="requests-badge">{requests.length}</span>
          )}
        </button>
      </div>

      {tab === 'friends' ? (
        friends.length === 0 ? (
          <p className="text-muted" style={{ padding: '0.75rem 1.25rem' }}>
            No friends yet. Search for users to add them!
          </p>
        ) : (
          friends.map((friend) => (
            <div key={friend.id} className="friend-item" onClick={() => handleStartDm(friend)}>
              <Avatar user={friend} size={34} showOnline={isOnline(friend.lastSeenAt)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="friend-name">{friend.username}</div>
                <div className={`friend-status ${isOnline(friend.lastSeenAt) ? 'online' : ''}`}>
                  {isOnline(friend.lastSeenAt) ? 'Online' : 'Offline'}
                </div>
              </div>
              <button
                className="icon-btn"
                title="Remove friend"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRemoveFriend(friend.friendshipId)
                }}
                style={{ fontSize: '0.8rem' }}
              >
                ✕
              </button>
            </div>
          ))
        )
      ) : (
        <div>
          {requests.length === 0 ? (
            <p className="text-muted" style={{ padding: '0.75rem 1.25rem' }}>
              No pending requests.
            </p>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="friend-item" style={{ cursor: 'default' }}>
                <Avatar user={req.sender} size={34} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="friend-name">{req.sender.username}</div>
                  <div className="friend-status">wants to be friends</div>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    className="btn-sm"
                    onClick={() => handleRespond(req.id, 'accept')}
                    title="Accept"
                  >
                    ✓
                  </button>
                  <button
                    className="btn-sm danger"
                    onClick={() => handleRespond(req.id, 'decline')}
                    title="Decline"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
};