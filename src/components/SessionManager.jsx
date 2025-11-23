import React, { useState, useEffect } from 'react';
import { getAllProjects, deleteProjectById, getProjectById } from '../utils/database';

function SessionManager({ onLoadSession, onClose }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const allProjects = await getAllProjects();
            // Sort by last modified (newest first)
            allProjects.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
            setProjects(allProjects);
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (confirm('Hapus proyek ini?')) {
            try {
                await deleteProjectById(id);
                await loadProjects();
            } catch (error) {
                console.error('Error deleting project:', error);
                alert('Gagal menghapus proyek');
            }
        }
    };

    const handleLoad = async (id) => {
        try {
            const project = await getProjectById(id);
            // Map project structure to session structure expected by App
            const sessionData = {
                ...project,
                measurements: project.measurements || []
            };
            onLoadSession(sessionData);
            onClose();
        } catch (error) {
            console.error('Error loading project:', error);
            alert('Gagal memuat proyek');
        }
    };

    const filteredProjects = projects.filter(p =>
        (p.projectName || p.videoName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatDate = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'var(--bg-secondary)',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '800px',
                maxHeight: '80vh',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Header */}
                <div style={{
                    padding: '15px 20px',
                    borderBottom: '1px solid #555',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.2rem' }}>
                        📂 Project Manager
                    </h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#fff',
                            fontSize: '1.5rem',
                            cursor: 'pointer',
                            padding: '0 10px'
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Search */}
                <div style={{ padding: '15px 20px', borderBottom: '1px solid #555' }}>
                    <input
                        type="text"
                        placeholder="Cari proyek..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: '100%',
                            padding: '8px 12px',
                            backgroundColor: '#222',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            color: 'white',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>

                {/* Projects List */}
                <div style={{ flex: 1, overflowY: 'auto', padding: '10px 20px' }}>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                            Loading projects...
                        </div>
                    ) : filteredProjects.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                            {searchTerm ? 'Tidak ada proyek yang cocok' : 'Belum ada proyek tersimpan'}
                        </div>
                    ) : (
                        filteredProjects.map((project) => {
                            const totalTime = (project.measurements || []).reduce((sum, m) => sum + m.duration, 0);
                            return (
                                <div
                                    key={project.id}
                                    style={{
                                        backgroundColor: '#1a1a1a',
                                        border: '1px solid #333',
                                        borderRadius: '6px',
                                        padding: '15px',
                                        marginBottom: '10px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold', marginBottom: '5px' }}>
                                            {project.projectName || project.videoName || 'Untitled Project'}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#888', marginBottom: '5px' }}>
                                            📅 {formatDate(project.lastModified)}
                                        </div>
                                        <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                            {(project.measurements || []).length} elements • {totalTime.toFixed(2)}s total
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            className="btn"
                                            onClick={() => handleLoad(project.id)}
                                            style={{
                                                padding: '6px 12px',
                                                fontSize: '0.85rem',
                                                backgroundColor: 'var(--accent-blue)'
                                            }}
                                        >
                                            📥 Load
                                        </button>
                                        <button
                                            className="btn"
                                            onClick={() => handleDelete(project.id)}
                                            style={{
                                                padding: '6px 12px',
                                                fontSize: '0.85rem',
                                                backgroundColor: '#a00'
                                            }}
                                        >
                                            🗑 Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer */}
                <div style={{
                    padding: '15px 20px',
                    borderTop: '1px solid #555',
                    textAlign: 'right'
                }}>
                    <button
                        className="btn"
                        onClick={onClose}
                        style={{ padding: '8px 16px' }}
                    >
                        Tutup
                    </button>
                </div>
            </div>
        </div>
    );
}

export default SessionManager;
