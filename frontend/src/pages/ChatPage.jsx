import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import ChatWindow from '../components/ChatWindow';
import { MessageCircleMore } from 'lucide-react';

export default function ChatPage() {
  const [activeConversation, setActiveConversation] = useState(null);
  const [showChat, setShowChat] = useState(false);

  const handleSelectConversation = (convo) => {
    setActiveConversation(convo);
    setShowChat(true);
  };

  const handleBackToSidebar = () => {
    setShowChat(false);
  };

  const handleDeleteActive = () => {
    setActiveConversation(null);
    setShowChat(false);
  };

  return (
    <div className="app-shell">
      <div className={`sidebar-wrapper ${showChat ? 'mobile-hidden' : 'mobile-visible'}`}>
        <Sidebar
          activeConversationId={activeConversation?.id}
          onSelectConversation={handleSelectConversation}
          onDeleteActiveConversation={handleDeleteActive}
        />
      </div>

      <div className={`chat-wrapper ${!showChat ? 'mobile-hidden' : 'mobile-visible'}`}>
        {activeConversation ? (
          <ChatWindow
            key={activeConversation.id}
            conversation={activeConversation}
            onBack={handleBackToSidebar}
          />
        ) : (
          <div className="chat-area chat-empty">
            <div className="chat-empty-icon">
              <MessageCircleMore size={56} />
            </div>
            <h2>Your messages</h2>
            <p className="text-muted">Select a conversation or start a new one.</p>
          </div>
        )}
      </div>
    </div>
  )
};