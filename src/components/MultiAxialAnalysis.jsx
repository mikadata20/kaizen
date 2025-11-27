import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getAllProjects } from '../utils/database';

function MultiAxialAnalysis() {
    const [projects, setProjects] = useState([]);
    const [selectedProjects, setSelectedProjects] = useState([]);
    const [measurements, setMeasurements] = useState([]);
    const [zoomLevel, setZoomLevel] = useState(20); // pixels per second
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        loadProjects();

        // Click outside handler for dropdown
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (selectedProjects.length > 0 && projects.length > 0) {
            const combinedMeasurements = [];
            selectedProjects.forEach(projectName => {
                const project = projects.find(p => p.projectName === projectName);
                if (project && project.measurements) {
                    project.measurements.forEach(m => {
                        combinedMeasurements.push({
                            ...m,
                            projectName: projectName, // Tag with project name
                            laneId: projectName // Use project name as lane ID
                        });
                    });
                }
            });
            setMeasurements(combinedMeasurements);
        } else {
            setMeasurements([]);
        }
    }, [selectedProjects, projects]);

    const loadProjects = async () => {
        try {
            const allProjects = await getAllProjects();
            // Sort by last modified
            allProjects.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
            setProjects(allProjects);
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    };

    const toggleProjectSelection = (projectName) => {
        setSelectedProjects(prev => {
            if (prev.includes(projectName)) {
                return prev.filter(p => p !== projectName);
            } else {
                return [...prev, projectName];
            }
        });
    };

    const getCategoryColor = (category) => {
        switch (category) {
            case 'Value-added': return '#005a9e';
            case 'Non value-added': return '#bfa900';
            case 'Waste': return '#c50f1f';
            default: return '#666';
        }
    };

    // Calculate chart dimensions
    const maxDuration = useMemo(() => {
        if (measurements.length === 0) return 0;
        return Math.max(...measurements.map(m => m.endTime));
    }, [measurements]);

    const timelineWidth = Math.max(800, maxDuration * zoomLevel + 100);
    const laneHeight = 60;
    const headerHeight = 40;

    // Group measurements by Lane (Project)
    const lanes = useMemo(() => {
        return selectedProjects; // Each selected project is a lane
    }, [selectedProjects]);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)', padding: '20px', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>📊 Multi-Axial Analysis</h2>

                {/* Project Selector */}
                <div style={{ position: 'relative' }} ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#333',
                            color: 'white',
                            border: '1px solid #555',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            minWidth: '200px',
                            justifyContent: 'space-between'
                        }}
                    >
                        <span>
                            {selectedProjects.length === 0
                                ? 'Pilih Project...'
                                : `${selectedProjects.length} Project Dipilih`}
                        </span>
                        <span>▼</span>
                    </button>

                    {isDropdownOpen && (
                        <div style={{
                            position: 'absolute',
                            top: '100%',
                            right: 0,
                            marginTop: '5px',
                            backgroundColor: '#252526',
                            border: '1px solid #444',
                            borderRadius: '4px',
                            padding: '10px',
                            zIndex: 1000,
                            width: '300px',
                            maxHeight: '400px',
                            overflowY: 'auto',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                        }}>
                            <div style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px solid #444' }}>
                                <div style={{ fontWeight: 'bold', color: '#fff', marginBottom: '5px' }}>Pilih Project untuk Dianalisis</div>
                                <div style={{ fontSize: '0.8rem', color: '#888' }}>Pilih 2 atau lebih untuk perbandingan</div>
                            </div>
                            {projects.map(project => (
                                <div
                                    key={project.id}
                                    onClick={() => toggleProjectSelection(project.projectName)}
                                    style={{
                                        padding: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        backgroundColor: selectedProjects.includes(project.projectName) ? '#37373d' : 'transparent',
                                        borderRadius: '4px',
                                        marginBottom: '2px'
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedProjects.includes(project.projectName)}
                                        onChange={() => { }} // Handled by div click
                                        style={{ cursor: 'pointer' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ color: '#fff', fontSize: '0.9rem' }}>{project.projectName}</div>
                                        <div style={{ color: '#888', fontSize: '0.75rem' }}>
                                            {new Date(project.lastModified).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Chart Controls */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#252526', padding: '10px', borderRadius: '4px' }}>
                <span style={{ color: '#ccc', fontSize: '0.9rem' }}>Zoom:</span>
                <input
                    type="range"
                    min="5"
                    max="100"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                    style={{ width: '150px' }}
                />
                <span style={{ color: '#fff', fontSize: '0.9rem' }}>{zoomLevel}px/s</span>
            </div>

            {/* Gantt Chart Area */}
            <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#1e1e1e', borderRadius: '8px', border: '1px solid #333', position: 'relative' }}>
                {selectedProjects.length === 0 ? (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '2rem' }}>📊</div>
                        <div>Silakan pilih project di menu dropdown kanan atas untuk memulai analisis.</div>
                    </div>
                ) : (
                    <div style={{ minWidth: `${timelineWidth + 200}px`, padding: '20px' }}>

                        {/* Time Ruler */}
                        <div style={{ display: 'flex', marginBottom: '10px', position: 'sticky', top: 0, zIndex: 10, backgroundColor: '#1e1e1e' }}>
                            <div style={{ width: '200px', flexShrink: 0 }}></div> {/* Spacer for labels */}
                            <div style={{ position: 'relative', height: '30px', flex: 1 }}>
                                {Array.from({ length: Math.ceil(maxDuration) + 2 }).map((_, i) => {
                                    if (i % 5 !== 0 && zoomLevel < 20) return null; // Skip labels if zoomed out
                                    return (
                                        <div key={i} style={{ position: 'absolute', left: `${i * zoomLevel}px`, top: 0 }}>
                                            <div style={{ borderLeft: '1px solid #555', height: '10px' }}></div>
                                            <div style={{ fontSize: '0.75rem', color: '#888', transform: 'translateX(-50%)', marginTop: '4px' }}>{i}s</div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Lanes */}
                        {lanes.map((laneName, index) => {
                            const laneMeasurements = measurements.filter(m => m.laneId === laneName);
                            return (
                                <div key={laneName} style={{ display: 'flex', marginBottom: '20px', position: 'relative' }}>
                                    {/* Lane Label */}
                                    <div style={{
                                        width: '200px',
                                        flexShrink: 0,
                                        padding: '10px',
                                        backgroundColor: '#252526',
                                        borderRight: '1px solid #444',
                                        borderTopLeftRadius: '4px',
                                        borderBottomLeftRadius: '4px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                        zIndex: 5
                                    }}>
                                        <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '0.9rem' }}>{laneName}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>Total: {Math.max(...(laneMeasurements.map(m => m.endTime) || [0]), 0).toFixed(2)}s</div>
                                    </div>

                                    {/* Lane Timeline */}
                                    <div style={{
                                        flex: 1,
                                        height: `${laneHeight}px`,
                                        backgroundColor: '#2a2a2a',
                                        position: 'relative',
                                        borderTopRightRadius: '4px',
                                        borderBottomRightRadius: '4px',
                                        overflow: 'hidden'
                                    }}>
                                        {/* Grid Lines */}
                                        {Array.from({ length: Math.ceil(maxDuration) + 2 }).map((_, i) => (
                                            <div key={i} style={{
                                                position: 'absolute',
                                                left: `${i * zoomLevel}px`,
                                                top: 0,
                                                bottom: 0,
                                                borderLeft: '1px solid rgba(255,255,255,0.05)'
                                            }} />
                                        ))}

                                        {/* Measurement Bars */}
                                        {laneMeasurements.map(m => (
                                            <div
                                                key={m.id}
                                                style={{
                                                    position: 'absolute',
                                                    left: `${m.startTime * zoomLevel}px`,
                                                    width: `${Math.max(2, m.duration * zoomLevel)}px`,
                                                    top: '10px',
                                                    bottom: '10px',
                                                    backgroundColor: getCategoryColor(m.category),
                                                    borderRadius: '4px',
                                                    border: '1px solid rgba(255,255,255,0.2)',
                                                    cursor: 'pointer',
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                                title={`${m.elementName}\nDuration: ${m.duration.toFixed(2)}s\nCategory: ${m.category}`}
                                            >
                                                {m.duration * zoomLevel > 30 && (
                                                    <span style={{ fontSize: '0.75rem', color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0 4px' }}>
                                                        {m.elementName}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default MultiAxialAnalysis;
