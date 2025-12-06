import React, { useState, useEffect } from 'react';

const CollaborationControl = ({ manager, onSyncToggle, isSyncEnabled }) => {
    const [users, setUsers] = useState([]);
    const [localUser, setLocalUser] = useState({ name: 'User', id: '' });
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!manager) return;

        setLocalUser({ name: manager.userName, id: manager.userId });

        // Listen for user updates
        const handleUserJoined = (user) => {
            setUsers(prev => {
                if (prev.find(u => u.id === user.userId)) return prev;
                return [...prev, { id: user.userId, name: user.name, status: 'Active' }];
            });
        };

        const handleUserPresence = (user) => {
            setUsers(prev => {
                // Update existing or add new
                const existing = prev.find(u => u.id === user.userId);
                if (existing) {
                    return prev.map(u => u.id === user.userId ? { ...u, name: user.name, lastSeen: Date.now() } : u);
                }
                return [...prev, { id: user.userId, name: user.name, status: 'Active', lastSeen: Date.now() }];
            });
        };

        manager.on('user_joined', handleUserJoined);
        manager.on('user_presence', handleUserPresence);

        // Prune inactive users
        const interval = setInterval(() => {
            const now = Date.now();
            setUsers(prev => prev.filter(u => now - (u.lastSeen || now) < 10000));
        }, 5000);

        return () => {
            manager.off('user_joined', handleUserJoined);
            manager.off('user_presence', handleUserPresence);
            clearInterval(interval);
        };
    }, [manager]);

    return (
        <div style={{
            position: 'relative'
        }}>
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    backgroundColor: isSyncEnabled ? '#00cc6a' : '#2d2d2d',
                    color: 'white',
                    border: '1px solid #444',
                    padding: '8px 15px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
                }}
            >
                {isSyncEnabled ? '🔗 Synced' : '🤝 Collaborate'}
                <span style={{
                    backgroundColor: '#fff',
                    color: '#333',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '11px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>{users.length + 1}</span>
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div style={{
                    position: 'absolute',
                    top: '45px',
                    left: '0',
                    width: '250px',
                    backgroundColor: '#1e1e1e',
                    borderRadius: '8px',
                    border: '1px solid #444',
                    padding: '15px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.5)'
                }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#fff' }}>Session Members</h4>

                    <div style={{ marginBottom: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0', borderBottom: '1px solid #333' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00cc6a' }}></div>
                            <span style={{ color: '#fff', flex: 1 }}>{localUser.name} (You)</span>
                        </div>
                        {users.map(user => (
                            <div key={user.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 0' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#00cc6a' }}></div>
                                <span style={{ color: '#ccc', flex: 1 }}>{user.name}</span>
                                <span style={{ fontSize: '0.8rem', color: '#666' }}>Viewer</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#aaa', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={isSyncEnabled}
                                onChange={(e) => onSyncToggle(e.target.checked)}
                            />
                            Enable Sync
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CollaborationControl;
