import { useState } from 'react';
import { searchUsers } from '../api/users';
import { sendFriendRequest, getSentRequests } from '../api/friends';
import { createConversation } from '../api/conversations';
import Avatar from './Avatar';

export default function NewConversationModal({ onClose, onCreated }) {
  const [tab, setTab] = useState('chat');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [groupMode, setGroupMode] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupAvatar, setGroupAvatar] = useState(null);

  const [sentTo, setSentTo] = useState(new Set());

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { users } = await searchUsers(query.trim());
      setResults(users);
      if (users.length === 0) setError('No users found.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    };
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleStartDm = async (user) => {
    try {
      const { conversation } = await createConversation({ type: 'dm', recipientId: user.id });
      onCreated(conversation);
    } catch (err) {
      setError(err.message);
    };
  };

  const handleToggleGroupMember = (user) => {
    setGroupMembers((prev) =>
      prev.find((m) => m.id === user.id)
        ? prev.filter((m) => m.id !== user.id)
        : [...prev, user]
    );
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setError('Please enter a group name.');
      return;
    };
    if (groupMembers.length === 0) {
      setError('Please select at least one member.');
      return;
    };

    try {
      const formData = new FormData();
      formData.append('type', 'group');
      formData.append('name', groupName.trim());
      groupMembers.forEach((m) => formData.append('memberIds[]', m.id));
      if (groupAvatar) formData.append('avatar', groupAvatar);

      const { conversation } = await createConversation(formData);
      onCreated(conversation);
    } catch (err) {
      setError(err.message);
    };
  };

  const handleSendRequest = async (user) => {
    try {
      await sendFriendRequest(user.id);
      setSentTo((prev) => new Set([...prev, user.id]));
    } catch (err) {
      setError(err.message);
    };
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{tab === 'chat' ? (groupMode ? 'New Group' : 'New Conversation') : 'Add Friend'}</h2>

        <div className="modal-tabs">
          {[
            { key: 'chat', label: 'New Chat' },
            { key: 'friend', label: 'Add Friend' },
          ].map(({ key, label }) => (
            <button
              key={key}
              className={`modal-tab ${tab === key ? 'active' : ''}`}
              onClick={() => {
                setTab(key)
                setGroupMode(false)
                setResults([])
                setQuery('')
                setError('')
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <div className="error-msg">{error}</div>}

        {tab === 'chat' && groupMode && (
          <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <input
              placeholder="Group name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              style={{
                border: '1.5px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.6rem 0.85rem',
                width: '100%',
              }}
            />
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => setGroupAvatar(e.target.files[0])}
              />
              📷 {groupAvatar ? groupAvatar.name : 'Add group photo (optional)'}
            </label>
            {groupMembers.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {groupMembers.map((m) => (
                  <span
                    key={m.id}
                    style={{
                      background: 'var(--accent)',
                      color: '#fff',
                      borderRadius: '999px',
                      fontSize: '0.78rem',
                      padding: '0.2rem 0.65rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                    }}
                  >
                    {m.username}
                    <button
                      onClick={() => handleToggleGroupMember(m)}
                      style={{ color: '#fff', fontSize: '0.7rem' }}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="search-input-wrap">
          <input
            placeholder="Search by username or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? '…' : 'Search'}
          </button>
        </div>

        <div>
          {results.map((u) => {
            const isSelected = groupMembers.some((m) => m.id === u.id)
            return (
              <div key={u.id} className="user-result">
                <Avatar user={u} size={36} />
                <div className="user-result-info">
                  <div className="user-result-name">{u.username}</div>
                  <div className="user-result-email">{u.email}</div>
                </div>
                {tab === 'chat' ? (
                  groupMode ? (
                    <button
                      className={`btn-sm ${isSelected ? 'danger' : ''}`}
                      onClick={() => handleToggleGroupMember(u)}
                    >
                      {isSelected ? 'Remove' : 'Add'}
                    </button>
                  ) : (
                    <button className="btn-sm" onClick={() => handleStartDm(u)}>
                      Message
                    </button>
                  )
                ) : (
                  <button
                    className="btn-sm"
                    onClick={() => handleSendRequest(u)}
                    disabled={sentTo.has(u.id)}
                  >
                    {sentTo.has(u.id) ? 'Sent ✓' : 'Add'}
                  </button>
                )}
              </div>
            )
          })}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          {tab === 'chat' && (
            groupMode ? (
              <>
                <button className="btn-secondary" onClick={() => setGroupMode(false)}>
                  Back
                </button>
                <button className="btn-primary" style={{ width: 'auto', marginTop: 0 }} onClick={handleCreateGroup}>
                  Create Group
                </button>
              </>
            ) : (
              <button
                className="btn-primary"
                style={{ width: 'auto', marginTop: 0 }}
                onClick={() => setGroupMode(true)}
              >
                New Group Instead
              </button>
            )
          )}
        </div>
      </div>
    </div>
  )
};