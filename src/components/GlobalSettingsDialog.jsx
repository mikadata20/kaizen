import React, { useState, useEffect } from 'react';
import { X, Save, CheckCircle, AlertCircle, Server, Key, Cpu } from 'lucide-react';
import { validateApiKey } from '../utils/aiGenerator';

function GlobalSettingsDialog({ isOpen, onClose }) {
    const [provider, setProvider] = useState('gemini');
    const [apiKey, setApiKey] = useState('');
    const [model, setModel] = useState('');
    const [baseUrl, setBaseUrl] = useState('');
    const [availableModels, setAvailableModels] = useState([]);
    const [isTesting, setIsTesting] = useState(false);
    const [testStatus, setTestStatus] = useState(null); // 'success', 'error', null

    useEffect(() => {
        if (isOpen) {
            // Load settings from localStorage
            setProvider(localStorage.getItem('ai_provider') || 'gemini');
            setApiKey(localStorage.getItem('gemini_api_key') || '');
            setModel(localStorage.getItem('gemini_model') || 'gemini-1.5-flash');
            setBaseUrl(localStorage.getItem('ai_base_url') || '');
            setTestStatus(null);
        }
    }, [isOpen]);

    const handleProviderChange = (newProvider) => {
        setProvider(newProvider);
        setTestStatus(null);

        // Set defaults based on provider
        if (newProvider === 'gemini') {
            setBaseUrl('');
            setModel('gemini-1.5-flash');
        } else if (newProvider === 'openai') {
            setBaseUrl('https://api.openai.com/v1');
            setModel('gpt-3.5-turbo');
        } else if (newProvider === 'grok') {
            setBaseUrl('https://api.x.ai/v1');
            setModel('grok-beta');
        } else if (newProvider === 'custom') {
            setBaseUrl('http://localhost:11434/v1'); // Default to Ollama
            setModel('qwen2.5:latest');
        }
    };

    const handleTestConnection = async () => {
        setIsTesting(true);
        setTestStatus(null);

        try {
            if (provider === 'gemini') {
                const models = await validateApiKey(apiKey);
                setAvailableModels(models);
                setTestStatus('success');
            } else {
                // Generic test for OpenAI compatible
                const response = await fetch(`${baseUrl}/chat/completions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: model,
                        messages: [{ role: 'user', content: 'Hello' }],
                        max_tokens: 5
                    })
                });

                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.error?.message || response.statusText);
                }
                setTestStatus('success');
            }
        } catch (error) {
            console.error("Connection Test Failed:", error);
            setTestStatus('error');
            alert(`Connection Failed: ${error.message}`);
        } finally {
            setIsTesting(false);
        }
    };

    const handleSave = () => {
        localStorage.setItem('ai_provider', provider);
        localStorage.setItem('gemini_api_key', apiKey); // We keep using this key name for backward compatibility or generic key
        localStorage.setItem('gemini_model', model);
        localStorage.setItem('ai_base_url', baseUrl);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 3000
        }}>
            <div style={{
                backgroundColor: '#1e1e1e',
                width: '500px',
                maxWidth: '90%',
                borderRadius: '12px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                border: '1px solid #333',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '20px',
                    borderBottom: '1px solid #333',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#252525',
                    borderRadius: '12px 12px 0 0'
                }}>
                    <h2 style={{ margin: 0, color: 'white', fontSize: '1.2rem' }}>⚙️ AI Settings</h2>
                    <button
                        onClick={onClose}
                        style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer' }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Provider Selector */}
                    <div>
                        <label style={{ display: 'block', color: '#ccc', marginBottom: '8px', fontSize: '0.9rem' }}>AI Provider</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {['gemini', 'openai', 'grok', 'custom'].map(p => (
                                <button
                                    key={p}
                                    onClick={() => handleProviderChange(p)}
                                    style={{
                                        padding: '10px',
                                        backgroundColor: provider === p ? '#0078d4' : '#333',
                                        color: 'white',
                                        border: '1px solid #555',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        textTransform: 'capitalize',
                                        fontWeight: provider === p ? 'bold' : 'normal'
                                    }}
                                >
                                    {p === 'custom' ? 'Custom / OpenAI API' : p}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Base URL (Hidden for Gemini) */}
                    {provider !== 'gemini' && (
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', marginBottom: '8px', fontSize: '0.9rem' }}>
                                <Server size={16} /> Base URL
                            </label>
                            <input
                                type="text"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                placeholder="https://api.openai.com/v1"
                                style={{ width: '100%', padding: '10px', backgroundColor: '#2d2d2d', border: '1px solid #444', color: 'white', borderRadius: '6px' }}
                            />
                            <p style={{ margin: '5px 0 0 0', fontSize: '0.75rem', color: '#666' }}>
                                Endpoint for chat completions (e.g., http://localhost:11434/v1 for Ollama)
                            </p>
                        </div>
                    )}

                    {/* API Key */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', marginBottom: '8px', fontSize: '0.9rem' }}>
                            <Key size={16} /> API Key
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder={`Enter ${provider} API Key`}
                                style={{ flex: 1, padding: '10px', backgroundColor: '#2d2d2d', border: '1px solid #444', color: 'white', borderRadius: '6px' }}
                            />
                            <button
                                onClick={handleTestConnection}
                                disabled={isTesting || !apiKey}
                                style={{
                                    padding: '0 15px',
                                    backgroundColor: testStatus === 'success' ? '#4caf50' : '#444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: isTesting ? 'wait' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                {isTesting ? 'Testing...' : testStatus === 'success' ? 'Verified' : 'Test'}
                            </button>
                        </div>
                    </div>

                    {/* Model Selector */}
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccc', marginBottom: '8px', fontSize: '0.9rem' }}>
                            <Cpu size={16} /> Model Name
                        </label>
                        {provider === 'gemini' && availableModels.length > 0 ? (
                            <select
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                style={{ width: '100%', padding: '10px', backgroundColor: '#2d2d2d', border: '1px solid #444', color: 'white', borderRadius: '6px' }}
                            >
                                {availableModels.map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                placeholder="e.g., gpt-4, claude-3, qwen2.5"
                                style={{ width: '100%', padding: '10px', backgroundColor: '#2d2d2d', border: '1px solid #444', color: 'white', borderRadius: '6px' }}
                            />
                        )}
                    </div>

                </div>

                {/* Footer */}
                <div style={{
                    padding: '20px',
                    borderTop: '1px solid #333',
                    backgroundColor: '#252525',
                    borderRadius: '0 0 12px 12px',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#333',
                            color: 'white',
                            border: '1px solid #555',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#0078d4',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 'bold'
                        }}
                    >
                        <Save size={18} /> Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
}

export default GlobalSettingsDialog;
