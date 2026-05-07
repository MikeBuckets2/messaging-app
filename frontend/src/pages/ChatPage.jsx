import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';

export default function ChatPage() {
  const [activeConversation, setActiveConversation] = useState(null);

  return (
    <div className="app-shell">
      <Sidebar
        activeConversationId={activeConversation?.id}
        onSelectConversation={setActiveConversation}
      />

      {activeConversation ? (
        <ChatWindow
          key={activeConversation.id}
          conversation={activeConversation}
        />
      ) : (
        <div className="chat-area chat-empty">
          <div className="chat-empty-icon">💬</div>
          <h2>Your messages</h2>
          <p className="text-muted">Select a conversation or start a new one.</p>
        </div>
      )}
    </div>
  )
};