import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { updateMe } from '../api/users';
import Avatar from '../components/Avatar';

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);

  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const formData = new FormData();

      if (username !== user.username) formData.append('username', username);
      if (bio !== (user.bio || '')) formData.append('bio', bio);
      if (avatarFile) formData.append('avatar', avatarFile);
      if (newPassword) {
        formData.append('currentPassword', currentPassword);
        formData.append('newPassword', newPassword);
      };

      const { user: updated } = await updateMe(formData);
      refreshUser(updated);
      setSuccess('Profile updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setAvatarFile(null);
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    };
  };

  const displayUser = avatarPreview
    ? { ...user, avatarUrl: avatarPreview }
    : user;

  return (
    <div className="app-shell">
      <aside className="sidebar" style={{ width: 60, minWidth: 60, alignItems: 'center', paddingTop: '1rem' }}>
        <button
          className="icon-btn"
          title="Back to chats"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={20} />
        </button>
      </aside>

      <div className="profile-page">
        <div className="profile-inner">
          <h1>Profile Settings</h1>

          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}

          <form onSubmit={handleSave}>
            <div className="profile-section">
              <h2>Photo</h2>
              <div className="profile-avatar-section">
                <Avatar user={displayUser} size={72} />
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    ref={avatarInputRef}
                    style={{ display: 'none' }}
                    onChange={handleAvatarChange}
                  />
                  <label
                    className="profile-avatar-label"
                    onClick={() => avatarInputRef.current?.click()}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
                  >
                    <Camera size={15} />
                    {avatarFile ? avatarFile.name : 'Change photo'}
                  </label>
                  <p className="text-muted" style={{ marginTop: '0.3rem', fontSize: '0.78rem' }}>
                    JPG, PNG or GIF · Max 5 MB
                  </p>
                </div>
              </div>
            </div>

            <div className="profile-section">
              <h2>Basic Info</h2>
              <div className="profile-field">
                <label htmlFor="username">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  minLength={2}
                />
              </div>
              <div className="profile-field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>
              <div className="profile-field">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell people a little about yourself…"
                  maxLength={200}
                />
              </div>
            </div>

            <div className="profile-section">
              <h2>Change Password</h2>
              <div className="profile-field">
                <label htmlFor="currentPassword">Current password</label>
                <input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Leave blank to keep current"
                />
              </div>
              <div className="profile-field">
                <label htmlFor="newPassword">New password</label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  minLength={6}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={logout}
                style={{ color: 'var(--danger)', fontWeight: 500, fontSize: '0.9rem' }}
              >
                Sign out
              </button>
              <button type="submit" className="profile-save-btn" disabled={saving}>
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
};