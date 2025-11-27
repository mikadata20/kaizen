import React, { useState, useEffect, useRef } from 'react';
import { getAllProjects } from '../utils/database';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function ManualCreation() {
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [videoSrc, setVideoSrc] = useState(null);
    const videoRef = useRef(null);

    // Manual Data State
    const [manualData, setManualData] = useState([]);
    const [headerInfo, setHeaderInfo] = useState({
        title: 'WORK INSTRUCTION MANUAL',
        docNo: '',
        date: new Date().toISOString().split('T')[0],
        author: ''
    });

    useEffect(() => {
        loadProjects();
    }, []);

    useEffect(() => {
        if (selectedProjectId && projects.length > 0) {
            const project = projects.find(p => p.projectName === selectedProjectId);
            setSelectedProject(project);
            if (project.videoBlob) {
                setVideoSrc(URL.createObjectURL(project.videoBlob));
            }
            // Initialize manual data from measurements
            if (project.measurements) {
                setManualData(project.measurements.map(m => ({
                    ...m,
                    image: null, // To store captured screenshot
                    description: m.elementName || '',
                    keyPoints: '',
                    safety: ''
                })));
            }
        } else {
            setSelectedProject(null);
            setVideoSrc(null);
            setManualData([]);
        }
    }, [selectedProjectId, projects]);

    const loadProjects = async () => {
        try {
            const allProjects = await getAllProjects();
            setProjects(allProjects);
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    };

    const captureFrame = (index) => {
        if (!videoRef.current) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7); // Compress slightly

        setManualData(prev => {
            const newData = [...prev];
            newData[index].image = dataUrl;
            return newData;
        });
    };

    const updateManualItem = (index, field, value) => {
        setManualData(prev => {
            const newData = [...prev];
            newData[index][field] = value;
            return newData;
        });
    };

    const seekTo = (time) => {
        if (videoRef.current) {
            videoRef.current.currentTime = time;
        }
    };

    const exportToPDF = () => {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(18);
        doc.text(headerInfo.title, 105, 15, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Doc No: ${headerInfo.docNo}`, 15, 25);
        doc.text(`Date: ${headerInfo.date}`, 15, 30);
        doc.text(`Author: ${headerInfo.author}`, 15, 35);

        // Table Content
        const tableBody = manualData.map((item, index) => [
            index + 1,
            { content: '', image: item.image }, // Placeholder for image
            item.description,
            item.keyPoints,
            item.safety,
            item.duration.toFixed(1) + 's'
        ]);

        doc.autoTable({
            startY: 40,
            head: [['No', 'Image', 'Description', 'Key Points', 'Safety/Quality', 'Time']],
            body: tableBody,
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2, minCellHeight: 30 },
            columnStyles: {
                0: { cellWidth: 10 },
                1: { cellWidth: 40 },
                2: { cellWidth: 50 },
                3: { cellWidth: 40 },
                4: { cellWidth: 30 },
                5: { cellWidth: 15 }
            },
            didDrawCell: (data) => {
                if (data.column.index === 1 && data.cell.raw.image) {
                    try {
                        doc.addImage(data.cell.raw.image, 'JPEG', data.cell.x + 2, data.cell.y + 2, 36, 26);
                    } catch (e) {
                        console.error('Error adding image to PDF', e);
                    }
                }
            }
        });

        doc.save(`${headerInfo.title.replace(/\s+/g, '_')}.pdf`);
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-secondary)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>📘 Manual Creation</h2>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <select
                        value={selectedProjectId}
                        onChange={(e) => setSelectedProjectId(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', backgroundColor: '#333', color: 'white', border: '1px solid #555' }}
                    >
                        <option value="">-- Pilih Proyek --</option>
                        {projects.map(p => (
                            <option key={p.projectName} value={p.projectName}>{p.projectName}</option>
                        ))}
                    </select>
                    <button
                        onClick={exportToPDF}
                        disabled={!selectedProject}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: selectedProject ? '#0078d4' : '#555',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: selectedProject ? 'pointer' : 'not-allowed'
                        }}
                    >
                        Export PDF
                    </button>
                </div>
            </div>

            {selectedProject ? (
                <div style={{ display: 'flex', gap: '20px', flex: 1, overflow: 'hidden' }}>
                    {/* Left Panel: Video & Header Info */}
                    <div style={{ flex: '0 0 400px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ backgroundColor: '#1e1e1e', padding: '10px', borderRadius: '8px' }}>
                            <h3 style={{ marginTop: 0, color: '#ccc', fontSize: '1rem' }}>Header Info</h3>
                            <div style={{ display: 'grid', gap: '10px' }}>
                                <input
                                    placeholder="Document Title"
                                    value={headerInfo.title}
                                    onChange={e => setHeaderInfo({ ...headerInfo, title: e.target.value })}
                                    style={{ padding: '5px', backgroundColor: '#333', border: '1px solid #555', color: 'white' }}
                                />
                                <input
                                    placeholder="Document No"
                                    value={headerInfo.docNo}
                                    onChange={e => setHeaderInfo({ ...headerInfo, docNo: e.target.value })}
                                    style={{ padding: '5px', backgroundColor: '#333', border: '1px solid #555', color: 'white' }}
                                />
                                <input
                                    placeholder="Author"
                                    value={headerInfo.author}
                                    onChange={e => setHeaderInfo({ ...headerInfo, author: e.target.value })}
                                    style={{ padding: '5px', backgroundColor: '#333', border: '1px solid #555', color: 'white' }}
                                />
                            </div>
                        </div>

                        <div style={{ flex: 1, backgroundColor: '#000', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {videoSrc && (
                                <video
                                    ref={videoRef}
                                    src={videoSrc}
                                    controls
                                    style={{ width: '100%', maxHeight: '100%' }}
                                />
                            )}
                        </div>
                        <div style={{ textAlign: 'center', color: '#888', fontSize: '0.8rem' }}>
                            Pause video at desired frame and click "Capture" on the element.
                        </div>
                    </div>

                    {/* Right Panel: Elements List */}
                    <div style={{ flex: 1, overflowY: 'auto', backgroundColor: '#1e1e1e', borderRadius: '8px', padding: '10px' }}>
                        {manualData.map((item, index) => (
                            <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '15px', backgroundColor: '#252526', padding: '10px', borderRadius: '4px', border: '1px solid #333' }}>
                                {/* Image Section */}
                                <div style={{ width: '150px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                    <div style={{ width: '100%', height: '100px', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #444' }}>
                                        {item.image ? (
                                            <img src={item.image} alt="Step" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                                        ) : (
                                            <span style={{ color: '#555', fontSize: '0.8rem' }}>No Image</span>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => captureFrame(index)}
                                        style={{ padding: '5px', backgroundColor: '#444', color: 'white', border: 'none', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        📸 Capture
                                    </button>
                                    <button
                                        onClick={() => seekTo(item.startTime)}
                                        style={{ padding: '5px', backgroundColor: '#333', color: '#ccc', border: '1px solid #555', cursor: 'pointer', fontSize: '0.8rem' }}
                                    >
                                        ▶ Seek Start
                                    </button>
                                </div>

                                {/* Text Inputs */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <span style={{ fontWeight: 'bold', color: '#fff' }}>Step {index + 1}</span>
                                        <span style={{ color: '#888' }}>{item.duration.toFixed(1)}s</span>
                                    </div>

                                    <textarea
                                        placeholder="Description"
                                        value={item.description}
                                        onChange={e => updateManualItem(index, 'description', e.target.value)}
                                        style={{ width: '100%', height: '60px', backgroundColor: '#333', border: '1px solid #444', color: 'white', fontSize: '0.9rem', padding: '5px' }}
                                    />

                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <input
                                            placeholder="Key Points"
                                            value={item.keyPoints}
                                            onChange={e => updateManualItem(index, 'keyPoints', e.target.value)}
                                            style={{ flex: 1, backgroundColor: '#333', border: '1px solid #444', color: 'white', padding: '5px' }}
                                        />
                                        <input
                                            placeholder="Safety / Quality"
                                            value={item.safety}
                                            onChange={e => updateManualItem(index, 'safety', e.target.value)}
                                            style={{ flex: 1, backgroundColor: '#333', border: '1px solid #444', color: 'white', padding: '5px' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666', border: '2px dashed #444', borderRadius: '8px' }}>
                    Pilih proyek untuk mulai membuat manual.
                </div>
            )}
        </div>
    );
}

export default ManualCreation;
