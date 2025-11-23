import React, { useState, useEffect } from 'react';
import { getAllProjects, deleteProject } from '../utils/database';
import { exportProject } from '../utils/projectExport';

function OpenProjectDialog({ isOpen, onClose, onOpenProject }) {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            loadProjects();
        }
    }, [isOpen]);

    const loadProjects = async () => {
        setLoading(true);
        try {
            const allProjects = await getAllProjects();
            setProjects(allProjects);
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = (project) => {
        onOpenProject(project.projectName);
        onClose();
    };

    const handleExport = async (project, e) => {
        e.stopPropagation();
        try {
            await exportProject(project);
        } catch (error) {
            console.error('Error exporting project:', error);
            alert('Gagal export proyek: ' + error.message);
        }
    };

    const handleDelete = async (project, e) => {
        e.stopPropagation();
        if (confirm(`Hapus proyek "${project.projectName}"?`)) {
            try {
                await deleteProject(project.projectName);
                loadProjects(); // Refresh list
            } catch (error) {
                console.error('Error deleting project:', error);
                alert('Gagal hapus proyek: ' + error.message);
            }
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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
                minWidth: '600px',
                maxWidth: '800px',
                maxHeight: '80vh',
                overflow: 'auto',
                border: '1px solid #333'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: 'white' }}>Buka Proyek</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#888',
                            fontSize: '1.5rem',
                            cursor: 'pointer'
                        }}
                    >
                        ×
                    </button>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                        Memuat proyek...
                    </div>
                ) : projects.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                        Belum ada proyek tersimpan
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '15px' }}>
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                style={{
                                    backgroundColor: '#222',
                                    padding: '20px',
                                    borderRadius: '6px',
                                    border: '1px solid #333',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-blue)'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#333'}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{ margin: '0 0 10px 0', color: 'white' }}>
                                            {project.projectName}
                                        </h3>
                                        <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>
                                            📹 {project.videoName}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: '#888', marginBottom: '5px' }}>
                                            📊 {project.measurements?.length || 0} measurements
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                            Dibuat: {formatDate(project.createdAt)}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                                            Terakhir diubah: {formatDate(project.lastModified)}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleOpen(project)}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: 'var(--accent-blue)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            Buka
                                        </button>
                                        <button
                                            onClick={(e) => handleExport(project, e)}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#b8860b',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem'
                                            }}
                                            title="Export sebagai ZIP"
                                        >
                                            💾
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(project, e)}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#c50f1f',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem'
                                            }}
                                            title="Hapus proyek"
                                        >
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default OpenProjectDialog;
