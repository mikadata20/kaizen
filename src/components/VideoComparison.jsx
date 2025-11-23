import React, { useState, useEffect, useRef } from 'react';
import { getAllProjects } from '../utils/database';

function VideoComparison() {
    console.log('VideoComparison rendering');
    const [sessions, setSessions] = useState([]);
    const [leftSessionId, setLeftSessionId] = useState(null);
    const [rightSessionId, setRightSessionId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncEnabled, setSyncEnabled] = useState(true);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [zoom, setZoom] = useState(1);
    const [isPlaying, setIsPlaying] = useState(false);

    const leftVideoRef = useRef(null);
    const rightVideoRef = useRef(null);
    const objectUrls = useRef([]);

    useEffect(() => {
        console.log('VideoComparison mounted');
        loadSessions();

        // Cleanup object URLs on unmount
        return () => {
            console.log('VideoComparison unmounting, cleaning up URLs');
            objectUrls.current.forEach(url => URL.revokeObjectURL(url));
        };
    }, []);

    const loadSessions = async () => {
        try {
            console.log('Loading projects...');
            const allProjects = await getAllProjects();
            console.log('Projects loaded:', allProjects.length);

            // Sort by last modified
            allProjects.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

            // Map projects to session-like structure and create video URLs
            const mappedSessions = allProjects
                .filter(p => p.videoBlob || p.videoName)
                .map(p => {
                    let videoUrl = null;
                    if (p.videoBlob) {
                        videoUrl = URL.createObjectURL(p.videoBlob);
                        objectUrls.current.push(videoUrl);
                    }

                    return {
                        id: p.id,
                        videoName: p.videoName || p.projectName,
                        timestamp: p.lastModified,
                        videoUrl: videoUrl,
                        measurements: p.measurements || []
                    };
                });

            console.log('Mapped sessions:', mappedSessions.length);
            setSessions(mappedSessions);
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const leftSession = sessions.find(s => s.id === leftSessionId);
    const rightSession = sessions.find(s => s.id === rightSessionId);

    const handlePlayPause = () => {
        const leftVideo = leftVideoRef.current;
        const rightVideo = rightVideoRef.current;

        if (isPlaying) {
            if (leftVideo) leftVideo.pause();
            if (rightVideo) rightVideo.pause();
        } else {
            if (leftVideo) leftVideo.play();
            if (rightVideo) rightVideo.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSpeedChange = (speed) => {
        setPlaybackSpeed(speed);
        if (leftVideoRef.current) leftVideoRef.current.playbackRate = speed;
        if (rightVideoRef.current && syncEnabled) rightVideoRef.current.playbackRate = speed;
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', backgroundColor: 'var(--bg-secondary)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>🎬 Video Side-by-Side Comparison</h2>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: '#ccc', fontSize: '0.9rem' }}>Zoom: {zoom.toFixed(1)}x</span>
                        <input
                            type="range"
                            min="1"
                            max="3"
                            step="0.1"
                            value={zoom}
                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                            style={{ width: '100px', cursor: 'pointer' }}
                        />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', color: '#ccc' }}>
                        <input
                            type="checkbox"
                            checked={syncEnabled}
                            onChange={(e) => setSyncEnabled(e.target.checked)}
                        />
                        🔗 Synchronized Playback
                    </label>
                </div>
            </div>

            {/* Session Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                    <label style={{ display: 'block', color: '#ccc', marginBottom: '5px', fontSize: '0.9rem' }}>
                        Left Video:
                    </label>
                    <select
                        value={leftSessionId || ''}
                        onChange={(e) => setLeftSessionId(Number(e.target.value))}
                        style={{
                            width: '100%',
                            padding: '8px',
                            backgroundColor: '#333',
                            border: '1px solid #4da6ff',
                            color: '#fff',
                            borderRadius: '4px'
                        }}
                    >
                        <option value="">Select video...</option>
                        {sessions.map(session => (
                            <option key={session.id} value={session.id}>
                                {session.videoName} ({new Date(session.timestamp).toLocaleDateString()})
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', color: '#ccc', marginBottom: '5px', fontSize: '0.9rem' }}>
                        Right Video:
                    </label>
                    <select
                        value={rightSessionId || ''}
                        onChange={(e) => setRightSessionId(Number(e.target.value))}
                        style={{
                            width: '100%',
                            padding: '8px',
                            backgroundColor: '#333',
                            border: '1px solid #0a5',
                            color: '#fff',
                            borderRadius: '4px'
                        }}
                    >
                        <option value="">Select video...</option>
                        {sessions.map(session => (
                            <option key={session.id} value={session.id}>
                                {session.videoName} ({new Date(session.timestamp).toLocaleDateString()})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Video Players */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', minHeight: '400px' }}>
                <VideoPlayer
                    videoRef={leftVideoRef}
                    session={leftSession}
                    title="Left"
                    color="#4da6ff"
                    onPlayStateChange={setIsPlaying}
                    zoom={zoom}
                />
                <VideoPlayer
                    videoRef={rightVideoRef}
                    session={rightSession}
                    title="Right"
                    color="#0a5"
                    onPlayStateChange={setIsPlaying}
                    zoom={zoom}
                />
            </div>

            {/* Playback Controls */}
            <div style={{ display: 'flex', gap: '15px', alignItems: 'center', padding: '15px', backgroundColor: '#1a1a1a', borderRadius: '8px' }}>
                <button
                    className="btn"
                    onClick={handlePlayPause}
                    disabled={!leftSession && !rightSession}
                    style={{ padding: '10px 30px', fontSize: '1.1rem', backgroundColor: 'var(--accent-blue)' }}
                >
                    {isPlaying ? '⏸ Pause' : '▶ Play'}
                </button>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ color: '#ccc', fontSize: '0.9rem' }}>Speed:</span>
                    {[0.5, 1, 1.5, 2].map(speed => (
                        <button
                            key={speed}
                            className="btn"
                            onClick={() => handleSpeedChange(speed)}
                            style={{
                                padding: '6px 12px',
                                fontSize: '0.85rem',
                                backgroundColor: playbackSpeed === speed ? 'var(--accent-blue)' : ''
                            }}
                        >
                            {speed}x
                        </button>
                    ))}
                </div>

                {leftSession && (
                    <div style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#888' }}>
                        <span>Left: {leftSession.measurements.length} elements, {leftSession.measurements.reduce((s, m) => s + m.duration, 0).toFixed(2)}s</span>
                    </div>
                )}
                {rightSession && (
                    <div style={{ fontSize: '0.85rem', color: '#888' }}>
                        <span>Right: {rightSession.measurements.length} elements, {rightSession.measurements.reduce((s, m) => s + m.duration, 0).toFixed(2)}s</span>
                    </div>
                )}
            </div>

            {!leftSession && !rightSession && (
                <div style={{ textAlign: 'center', color: '#666', padding: '30px' }}>
                    Select two videos above to begin comparison
                </div>
            )}
        </div>
    );
}

const VideoPlayer = ({ videoRef, session, title, color, onPlayStateChange, zoom = 1 }) => (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', border: `2px solid ${color || '#555'}`, borderRadius: '8px', overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
        <div style={{ padding: '10px', backgroundColor: color || '#333', color: '#fff', fontWeight: 'bold' }}>
            {title}: {session ? session.videoName : 'No video selected'}
        </div>
        <div style={{ flex: 1, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {session && session.videoUrl ? (
                <video
                    ref={videoRef}
                    src={session.videoUrl}
                    style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        transform: `scale(${zoom})`,
                        transformOrigin: 'center center',
                        transition: 'transform 0.1s ease-out'
                    }}
                    onPlay={() => onPlayStateChange(true)}
                    onPause={() => onPlayStateChange(false)}
                />
            ) : (
                <div style={{ color: '#666', textAlign: 'center' }}>
                    <p>No video available</p>
                    <p style={{ fontSize: '0.8rem' }}>Please select a session with video</p>
                </div>
            )}
        </div>
    </div>
);

export default VideoComparison;
