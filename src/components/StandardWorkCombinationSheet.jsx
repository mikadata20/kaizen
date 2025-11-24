import React, { useState, useEffect } from 'react';
import { getAllProjects } from '../utils/database';

function StandardWorkCombinationSheet() {
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        if (selectedProjectId && projects.length > 0) {
            const project = projects.find(p => p.projectName === selectedProjectId);
            setSelectedProject(project);
        } else {
            setSelectedProject(null);
        }
    }, [selectedProjectId, projects]);

    const loadProjects = async () => {
        try {
            const allProjects = await getAllProjects();
            if (Array.isArray(allProjects)) {
                allProjects.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
                setProjects(allProjects);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    };

    // Helper to generate wavy path
    const generateWavyPath = (x1, y, x2, amplitude = 3, frequency = 0.2) => {
        let path = `M ${x1} ${y}`;
        const width = x2 - x1;
        const steps = Math.ceil(width); // One step per pixel for smoothness
        for (let i = 0; i <= steps; i++) {
            const x = x1 + i;
            const yOffset = Math.sin(i * frequency) * amplitude;
            path += ` L ${x} ${y + yOffset}`;
        }
        return path;
    };

    const renderChart = () => {
        if (!selectedProject || !selectedProject.measurements || selectedProject.measurements.length === 0) {
            return <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>Tidak ada data pengukuran untuk ditampilkan.</div>;
        }

        const measurements = selectedProject.measurements;
        const rowHeight = 40;
        const headerHeight = 30;
        const chartWidth = 800; // Fixed width for now, could be dynamic
        const chartHeight = measurements.length * rowHeight + headerHeight;

        // Calculate total time to determine scale
        // We assume sequential flow for Operator (Manual + Walk) and Machine (Auto) might overlap or be sequential.
        // For this visualization, let's plot them cumulatively per element row to show the breakdown.
        // Wait, SWCS usually has a continuous time axis.
        // Let's calculate the max cumulative time to set the X-axis scale.

        let maxDuration = 0;
        measurements.forEach(m => {
            const total = (m.manualTime || 0) + (m.autoTime || 0) + (m.walkTime || 0);
            if (total > maxDuration) maxDuration = total;
        });

        // If maxDuration is small, ensure a minimum scale
        const maxScaleTime = Math.max(maxDuration * 1.2, 10); // Add some padding
        const pixelsPerSecond = chartWidth / maxScaleTime;

        return (
            <div style={{ overflowX: 'auto', backgroundColor: '#fff', padding: '10px', borderRadius: '4px' }}>
                <svg width={chartWidth} height={chartHeight} style={{ display: 'block' }}>
                    {/* Grid Lines */}
                    {Array.from({ length: Math.ceil(maxScaleTime) + 1 }).map((_, i) => (
                        <line
                            key={i}
                            x1={i * pixelsPerSecond}
                            y1={headerHeight}
                            x2={i * pixelsPerSecond}
                            y2={chartHeight}
                            stroke="#eee"
                            strokeWidth="1"
                        />
                    ))}

                    {/* Time Labels */}
                    {Array.from({ length: Math.ceil(maxScaleTime / 5) + 1 }).map((_, i) => {
                        const time = i * 5;
                        return (
                            <text
                                key={i}
                                x={time * pixelsPerSecond}
                                y={20}
                                fontSize="10"
                                fill="#666"
                                textAnchor="middle"
                            >
                                {time}s
                            </text>
                        );
                    })}

                    {/* Rows */}
                    {measurements.map((m, index) => {
                        const y = headerHeight + index * rowHeight + rowHeight / 2;
                        let currentX = 0;

                        const manualWidth = (m.manualTime || 0) * pixelsPerSecond;
                        const autoWidth = (m.autoTime || 0) * pixelsPerSecond;
                        const walkWidth = (m.walkTime || 0) * pixelsPerSecond;

                        // Order: Manual -> Auto -> Walk (Arbitrary assumption, usually depends on process)
                        // User request: Manual (Green Solid), Auto (Blue Dashed), Walk (Red Wavy)

                        const elements = [];

                        // Manual
                        if (manualWidth > 0) {
                            elements.push(
                                <line
                                    key={`manual-${index}`}
                                    x1={currentX}
                                    y1={y}
                                    x2={currentX + manualWidth}
                                    y2={y}
                                    stroke="green"
                                    strokeWidth="3"
                                />
                            );
                            currentX += manualWidth;
                        }

                        // Auto
                        if (autoWidth > 0) {
                            elements.push(
                                <line
                                    key={`auto-${index}`}
                                    x1={currentX}
                                    y1={y}
                                    x2={currentX + autoWidth}
                                    y2={y}
                                    stroke="darkblue"
                                    strokeWidth="3"
                                    strokeDasharray="5,3"
                                />
                            );
                            currentX += autoWidth;
                        }

                        // Walk
                        if (walkWidth > 0) {
                            elements.push(
                                <path
                                    key={`walk-${index}`}
                                    d={generateWavyPath(currentX, y, currentX + walkWidth)}
                                    stroke="red"
                                    strokeWidth="2"
                                    fill="none"
                                />
                            );
                            currentX += walkWidth;
                        }

                        return (
                            <g key={index}>
                                {/* Row Background (Alternating) */}
                                <rect
                                    x="0"
                                    y={headerHeight + index * rowHeight}
                                    width={chartWidth}
                                    height={rowHeight}
                                    fill={index % 2 === 0 ? '#f9f9f9' : '#fff'}
                                    opacity="0.5"
                                />
                                {elements}
                            </g>
                        );
                    })}
                </svg>
            </div>
        );
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>📋 Standard Work Combination Sheet</h2>
                <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    style={{ padding: '8px', borderRadius: '4px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                >
                    <option value="">-- Pilih Proyek --</option>
                    {projects.map(p => (
                        <option key={p.projectName} value={p.projectName}>{p.projectName || p.videoName || 'Untitled'}</option>
                    ))}
                </select>
            </div>

            {selectedProject ? (
                <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
                    {/* Left Panel: Table */}
                    <div style={{ flex: '0 0 400px', overflowY: 'auto', backgroundColor: '#1a1a1a', borderRadius: '8px', border: '1px solid #333' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', color: '#ddd', fontSize: '0.85rem' }}>
                            <thead style={{ backgroundColor: '#333', position: 'sticky', top: 0 }}>
                                <tr>
                                    <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #555' }}>Element Name</th>
                                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #555', color: 'green' }}>Manual</th>
                                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #555', color: '#4da6ff' }}>Auto</th>
                                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #555', color: 'red' }}>Walk</th>
                                    <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #555' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {selectedProject.measurements.map((m, idx) => (
                                    <tr key={idx} style={{ borderBottom: '1px solid #333', backgroundColor: idx % 2 === 0 ? '#1a1a1a' : '#222' }}>
                                        <td style={{ padding: '10px' }}>{m.elementName}</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>{m.manualTime ? m.manualTime.toFixed(2) : '-'}</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>{m.autoTime ? m.autoTime.toFixed(2) : '-'}</td>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>{m.walkTime ? m.walkTime.toFixed(2) : '-'}</td>
                                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>
                                            {((m.manualTime || 0) + (m.autoTime || 0) + (m.walkTime || 0)).toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Right Panel: Chart */}
                    <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ marginBottom: '10px', display: 'flex', gap: '20px', fontSize: '0.85rem', color: '#ccc' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '20px', height: '2px', backgroundColor: 'green' }}></div> Manual
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '20px', height: '2px', borderTop: '2px dashed darkblue' }}></div> Auto
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <svg width="20" height="10"><path d="M 0 5 Q 5 0 10 5 T 20 5" stroke="red" fill="none" /></svg> Walk
                            </div>
                        </div>
                        {renderChart()}
                    </div>
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', border: '2px dashed #444', borderRadius: '8px' }}>
                    Pilih proyek untuk melihat Standard Work Combination Sheet.
                </div>
            )}
        </div>
    );
}

export default StandardWorkCombinationSheet;
