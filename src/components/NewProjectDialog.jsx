import React, { useState } from 'react';
import { getProjectByName } from '../utils/database';

function NewProjectDialog({ isOpen, onClose, onSubmit }) {
    const [projectName, setProjectName] = useState('');
    const [videoFile, setVideoFile] = useState(null);
    const [error, setError] = useState('');

    const handleVideoSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setVideoFile(file);
            setError('');
        }
    };

    const handleSubmit = async () => {
        // Validation
        if (!projectName.trim()) {
            setError('Nama proyek tidak boleh kosong');
            return;
        }

        if (!videoFile) {
            setError('Pilih file video terlebih dahulu');
            return;
        }

        // Check if project name already exists
        const existing = await getProjectByName(projectName.trim());
        if (existing) {
            setError('Nama proyek sudah digunakan');
            return;
        }

        // Submit
        onSubmit(projectName.trim(), videoFile);

        // Reset
        setProjectName('');
        setVideoFile(null);
        setError('');
    };

    const handleCancel = () => {
        setProjectName('');
        setVideoFile(null);
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
        }}>
            <div style={{
                backgroundColor: '#1a1a1a',
                padding: '30px',
                borderRadius: '8px',
                minWidth: '400px',
                maxWidth: '500px',
                border: '1px solid #333'
            }}>
                <h2 style={{ marginTop: 0, color: 'white' }}>Proyek Baru</h2>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
                        Nama Proyek *
                    </label>
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="Masukkan nama proyek"
                        style={{
                            width: '100%',
                            padding: '10px',
                            backgroundColor: '#222',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            color: 'white',
                            fontSize: '1rem'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
                        File Video *
                    </label>
                    <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoSelect}
                        style={{ display: 'none' }}
                        id="video-file-input"
                    />
                    <label
                        htmlFor="video-file-input"
                        style={{
                            display: 'inline-block',
                            padding: '10px 20px',
                            backgroundColor: '#333',
                            color: 'white',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            border: '1px solid #555'
                        }}
                    >
                        📹 Pilih Video
                    </label>
                    {videoFile && (
                        <div style={{ marginTop: '8px', color: '#4a9eff' }}>
                            ✓ {videoFile.name}
                        </div>
                    )}
                </div>

                {error && (
                    <div style={{
                        padding: '10px',
                        backgroundColor: '#c50f1f',
                        color: 'white',
                        borderRadius: '4px',
                        marginBottom: '20px'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button
                        onClick={handleCancel}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#333',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleSubmit}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: 'var(--accent-blue)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer'
                        }}
                    >
                        Buat Proyek
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NewProjectDialog;
