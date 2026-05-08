import { useState, useRef } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
import { sendMessage } from '../api/messages';

export default function MessageInput({ conversationId, onSent }) {
  const [text, setText] = useState('');
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  const clearImage = () => {
    setImage(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
  };

  const handleSend = async () => {
    if ((!text.trim() && !image) || sending) return;

    setSending(true);
    try {
      const formData = new FormData();
      if (text.trim()) formData.append('text', text.trim());
      if (image) formData.append('image', image);

      const { message } = await sendMessage(conversationId, formData);
      onSent(message);
      setText('');
      clearImage();
      textareaRef.current?.focus();
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    };
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    };
  };

  const autoResize = (e) => {
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <div className="message-input-area">
      {preview && (
        <div className="image-preview">
          <img src={preview} alt="Preview" />
          <button className="image-preview-remove" onClick={clearImage}>
            <X size={11} />
          </button>
        </div>
      )}

      <div className="message-input-row">
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleImageChange}
        />

        <button
          className="icon-btn"
          title="Attach image"
          onClick={() => fileInputRef.current?.click()}
          style={{ color: 'var(--text-secondary)', flexShrink: 0 }}
        >
          <Paperclip size={18} />
        </button>

        <textarea
          ref={textareaRef}
          rows={1}
          placeholder="Type a message… (Enter to send)"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            autoResize(e)
          }}
          onKeyDown={handleKeyDown}
        />

        <button
          className="send-btn"
          onClick={handleSend}
          disabled={(!text.trim() && !image) || sending}
          title="Send"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
};