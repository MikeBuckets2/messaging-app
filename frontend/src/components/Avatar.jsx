export default function Avatar({ user, size = 36, showOnline = false }) {
  const initial = user?.username?.[0]?.toUpperCase() || '?';

  const style = {
    width: size,
    height: size,
    fontSize: size * 0.38,
  };

  return (
    <div className="avatar-wrap">
      {user?.avatarUrl ? (
        <img
          className="avatar"
          src={user.avatarUrl}
          alt={user.username}
          style={style}
        />
      ) : (
        <div className="avatar" style={style}>
          {initial}
        </div>
      )}
      {showOnline && <span className="online-dot" />}
    </div>
  );
};