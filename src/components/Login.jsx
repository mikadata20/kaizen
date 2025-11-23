import React, { useState } from 'react';

// Hardcoded credentials
const CREDENTIALS = {
    username: 'admin',
    password: 'mikadata'
};

function Login({ onLoginSuccess }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();

        if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
            // Login successful
            setError('');
            onLoginSuccess();
        } else {
            // Login failed
            setError('Username atau password salah!');
            setPassword('');
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{
                backgroundColor: '#1a1a1a',
                padding: '40px',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                border: '1px solid #333',
                minWidth: '400px',
                maxWidth: '500px'
            }}>
                {/* Logo/Title */}
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <h1 style={{
                        color: 'var(--accent-blue)',
                        margin: '0 0 10px 0',
                        fontSize: '2rem',
                        fontWeight: 'bold'
                    }}>
                        Motion Analysis
                    </h1>
                    <p style={{ color: '#888', margin: 0, fontSize: '0.9rem' }}>
                        Silakan login untuk melanjutkan
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                    {/* Username Field */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#ccc',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                        }}>
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Masukkan username"
                            autoFocus
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#222',
                                border: '1px solid #444',
                                borderRadius: '6px',
                                color: 'white',
                                fontSize: '1rem',
                                outline: 'none',
                                transition: 'border-color 0.2s'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
                            onBlur={(e) => e.target.style.borderColor = '#444'}
                        />
                    </div>

                    {/* Password Field */}
                    <div style={{ marginBottom: '25px' }}>
                        <label style={{
                            display: 'block',
                            marginBottom: '8px',
                            color: '#ccc',
                            fontSize: '0.9rem',
                            fontWeight: '500'
                        }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Masukkan password"
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    paddingRight: '45px',
                                    backgroundColor: '#222',
                                    border: '1px solid #444',
                                    borderRadius: '6px',
                                    color: 'white',
                                    fontSize: '1rem',
                                    outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
                                onBlur={(e) => e.target.style.borderColor = '#444'}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    color: '#888',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem',
                                    padding: '5px'
                                }}
                                title={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                            >
                                {showPassword ? '👁️' : '👁️‍🗨️'}
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            padding: '12px',
                            backgroundColor: 'rgba(197, 15, 31, 0.2)',
                            border: '1px solid #c50f1f',
                            borderRadius: '6px',
                            color: '#ff6b6b',
                            marginBottom: '20px',
                            fontSize: '0.9rem',
                            textAlign: 'center'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    {/* Login Button */}
                    <button
                        type="submit"
                        style={{
                            width: '100%',
                            padding: '14px',
                            backgroundColor: 'var(--accent-blue)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '1rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 12px rgba(74, 158, 255, 0.3)'
                        }}
                        onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#3a8aff';
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.boxShadow = '0 6px 16px rgba(74, 158, 255, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'var(--accent-blue)';
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.boxShadow = '0 4px 12px rgba(74, 158, 255, 0.3)';
                        }}
                    >
                        Login
                    </button>
                </form>

                {/* Footer Info */}
                <div style={{
                    marginTop: '25px',
                    textAlign: 'center',
                    color: '#666',
                    fontSize: '0.75rem'
                }}>
                    © 2025 Motion Analysis System
                </div>
            </div>
        </div>
    );
}

export default Login;
