import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMessages } from '../api/messages';
import Avatar from './Avatar';
import MessageInput from './MessageInput';

const POLL_INTERVAL_MS = 3_000;
const ONLINE_THRESHOLD_MS = 2 * 60 * 1000;

export default function ChatWindow({ conversation }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const bottomRef = useRef(null);
  const latestTimestampRef = useRef(null);

  useEffect(() => {
    setMessages([]);
    setLoadingInitial(true);
    setHasMore(true);
    latestTimestampRef.current = null;

    getMessages(conversation.id, { limit: 50 })
      .then(({ messages }) => {
        setMessages(messages);
        if (messages.length < 50) setHasMore(false);
        if (messages.length > 0) {
          latestTimestampRef.current = messages[messages.length - 1].createdAt;
        };
      })
      .catch(console.error)
      .finally(() => setLoadingInitial(false))
  }, [conversation.id]);

  useEffect(() => {
    if (!loadingInitial) {
      bottomRef.current?.scrollIntoView();
    };
  }, [loadingInitial]);

  const pollMessages = useCallback(async () => {
    if (!latestTimestampRef.current) return;
    try {
      const { messages: newMessages } = await getMessages(conversation.id, {
        since: latestTimestampRef.current,
      });
      if (newMessages.length > 0) {
        setMessages((prev) => [...prev, ...newMessages]);
        latestTimestampRef.current = newMessages[newMessages.length - 1].createdAt;
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      };
    } catch (err) {
      console.error('Poll error', err);
    };
  }, [conversation.id]);

  useEffect(() => {
    const interval = setInterval(pollMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [pollMessages]);

  const loadMore = async () => {
    if (messages.length === 0) return;
    setLoadingMore(true);
    try {
      const oldest = messages[0].createdAt;
      const { messages: older } = await getMessages(conversation.id, {
        before: oldest,
        limit: 50,
      });
      setMessages((prev) => [...older, ...prev]);
      if (older.length < 50) setHasMore(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMore(false);
    };
  };

  const handleMessageSent = (message) => {
    setMessages((prev) => [...prev, message]);
    latestTimestampRef.current = message.createdAt;
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const isOnline = (lastSeenAt) =>
    Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;

  const otherMembers = conversation.members?.filter((m) => m.userId !== user.id);
  const partner = !conversation.isGroup ? otherMembers?.[0]?.user : null;
  const headerName = conversation.isGroup
    ? conversation.name
    : partner?.username || 'Unknown';
  const headerSub = conversation.isGroup
    ? `${conversation.members?.length} members`
    : partner
    ? isOnline(partner.lastSeenAt)
      ? 'Online'
      : 'Offline'
    : '';

  const headerAvatar = conversation.isGroup
    ? { username: conversation.name, avatarUrl: conversation.avatarUrl }
    : partner;

  return (
    <div className="chat-area">
      <div className="chat-header">
        <Avatar user={headerAvatar} size={36} showOnline={!conversation.isGroup && partner && isOnline(partner.lastSeenAt)} />
        <div className="chat-header-info">
          <div className="chat-header-name">{headerName}</div>
          {headerSub && <div className="chat-header-sub">{headerSub}</div>}
        </div>
      </div>

      <div className="messages-list">
        {hasMore && (
          <button className="load-more-btn" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Loading…' : 'Load older messages'}
          </button>
        )}

        {loadingInitial ? (
          <div className="flex-center" style={{ flex: 1, color: 'var(--text-secondary)' }}>
            Loading messages…
          </div>
        ) : messages.length === 0 ? (
          <div className="flex-center" style={{ flex: 1, color: 'var(--text-secondary)' }}>
            No messages yet. Say hello!
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isOutgoing = msg.senderId === user.id
            const showSender =
              conversation.isGroup && !isOutgoing &&
              (idx === 0 || messages[idx - 1].senderId !== msg.senderId)

            return (
              <div
                key={msg.id}
                className={`message-row ${isOutgoing ? 'outgoing' : 'incoming'}`}
              >
                {!isOutgoing && (
                  <Avatar user={msg.sender} size={28} />
                )}
                <div>
                  {showSender && (
                    <div className="bubble-sender">{msg.sender.username}</div>
                  )}
                  <div className={`bubble ${isOutgoing ? 'outgoing' : 'incoming'}`}>
                    {msg.imageUrl && (
                      <img
                        src={msg.imageUrl}
                        alt="Shared image"
                        onClick={() => window.open(msg.imageUrl, '_blank')}
                        style={{ cursor: 'pointer' }}
                      />
                    )}
                    {msg.text && <span>{msg.text}</span>}
                  </div>
                  <div className="bubble-time">
                    {formatTime(msg.createdAt)}
                  </div>
                </div>
              </div>
            )
          })
        )}

        <div ref={bottomRef} />
      </div>

      <MessageInput conversationId={conversation.id} onSent={handleMessageSent} />
    </div>
  )
};

const formatTime = (isoString) => {
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  return isToday
    ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
        ' ' +
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};