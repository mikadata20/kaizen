import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize, Minimize, ChevronLeft, ChevronRight } from 'lucide-react';
import VideoAnnotation from './features/VideoAnnotation';

function VRTrainingMode({ measurements = [], videoSrc, videoName, currentProject }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [currentStep, setCurrentStep] = useState(null);
    const [nextStep, setNextStep] = useState(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [stepIndex, setStepIndex] = useState(0);
    const [zoom, setZoom] = useState(1);
    const [showDrawingTools, setShowDrawingTools] = useState(false);
    const [currentTool, setCurrentTool] = useState('pen');
    const [drawColor, setDrawColor] = useState('#00d2ff');
    const [lineWidth, setLineWidth] = useState(3);
    const [annotations, setAnnotations] = useState([]);

    const videoRef = useRef(null);
    const containerRef = useRef(null);

    // Update current step based on video time
    useEffect(() => {
        if (measurements.length === 0) return;

        const activeStep = measurements.find(
            m => currentTime >= m.startTime && currentTime < (m.startTime + m.duration)
        );

        setCurrentStep(activeStep || null);

        // Find next step
        const currentIndex = measurements.findIndex(m => m === activeStep);
        if (currentIndex !== -1 && currentIndex < measurements.length - 1) {
            setNextStep(measurements[currentIndex + 1]);
            setStepIndex(currentIndex);
        } else if (currentIndex === -1 && measurements.length > 0) {
            setNextStep(measurements[0]);
            setStepIndex(-1);
        } else {
            setNextStep(null);
            setStepIndex(currentIndex);
        }
    }, [currentTime, measurements]);

    // Handle time update
    const handleTimeUpdate = () => {
        if (videoRef.current) {
            setCurrentTime(videoRef.current.currentTime);
        }
    };

    // Handle metadata loaded
    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
        }
    };

    // Play/Pause
    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    // Previous Step
    const previousStep = () => {
        if (stepIndex > 0 && measurements[stepIndex - 1]) {
            const prevStep = measurements[stepIndex - 1];
            if (videoRef.current) {
                videoRef.current.currentTime = prevStep.startTime;
            }
        } else if (measurements.length > 0) {
            if (videoRef.current) {
                videoRef.current.currentTime = 0;
            }
        }
    };

    // Next Step
    const goToNextStep = () => {
        if (stepIndex < measurements.length - 1 && measurements[stepIndex + 1]) {
            const next = measurements[stepIndex + 1];
            if (videoRef.current) {
                videoRef.current.currentTime = next.startTime;
            }
        }
    };

    // Toggle Fullscreen
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    // Keyboard controls
    useEffect(() => {
        const handleKeyPress = (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                togglePlay();
            } else if (e.code === 'ArrowLeft') {
                previousStep();
            } else if (e.code === 'ArrowRight') {
                goToNextStep();
            } else if (e.code === 'KeyF') {
                toggleFullscreen();
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isPlaying, stepIndex]);

    // Listen for fullscreen changes
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Format time
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate progress
    const progress = measurements.length > 0 ? ((stepIndex + 1) / measurements.length) * 100 : 0;

    return (
        <div
            ref={containerRef}
            style={{
                width: '100%',
                height: '100%',
                backgroundColor: '#000',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Video Player */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {videoSrc ? (
                    <video
                        ref={videoRef}
                        src={videoSrc}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        style={{
                            width: '100%',
                            height: '100%',
                            transform: `scale(${zoom})`,
                            transition: 'transform 0.2s ease',
                            objectFit: 'contain'
                        }}
                    />
                ) : (
                    <div style={{ color: '#666', fontSize: '1.2rem' }}>
                        No video loaded. Please open a project first.
                    </div>
                )}

                {/* Video Annotation Layer */}
                {showDrawingTools && videoRef.current && (
                    <VideoAnnotation
                        videoRef={videoRef}
                        videoState={{ currentTime }}
                        annotations={annotations}
                        onUpdateAnnotations={setAnnotations}
                        currentTool={currentTool}
                        drawColor={drawColor}
                        lineWidth={lineWidth}
                    />
                )}

                {/* HUD Overlay */}
                {videoSrc && (
                    <>
                        {/* Current Step Display */}
                        {currentStep && (
                            <div style={{
                                position: 'absolute',
                                bottom: '20px',
                                left: '20px',
                                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                                padding: '15px 25px',
                                borderRadius: '12px',
                                border: '2px solid #00d2ff',
                                boxShadow: '0 0 20px rgba(0, 210, 255, 0.4)',
                                maxWidth: '400px'
                            }}>
                                <div style={{ fontSize: '0.7rem', color: '#00d2ff', marginBottom: '5px', fontWeight: 'bold' }}>
                                    STEP {stepIndex + 1} / {measurements.length}
                                </div>
                                <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: 'bold', marginBottom: '5px' }}>
                                    {currentStep.elementName}
                                </div>
                                {currentStep.description && (
                                    <div style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                        {currentStep.description}
                                    </div>
                                )}
                                <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '5px' }}>
                                    Duration: {currentStep.duration.toFixed(1)}s
                                </div>
                            </div>
                        )}

                        {/* Next Step Preview */}
                        {nextStep && (
                            <div style={{
                                position: 'absolute',
                                bottom: '120px',
                                right: '30px',
                                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                                padding: '15px 20px',
                                borderRadius: '8px',
                                border: '1px solid #555',
                                maxWidth: '300px'
                            }}>
                                <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '5px' }}>
                                    NEXT STEP
                                </div>
                                <div style={{ fontSize: '0.9rem', color: '#fff', fontWeight: 'bold' }}>
                                    {nextStep.elementName}
                                </div>
                            </div>
                        )}

                        {/* Progress Bar */}
                        <div style={{
                            position: 'absolute',
                            top: '30px',
                            left: '30px',
                            right: '30px',
                            height: '8px',
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: `${progress}%`,
                                height: '100%',
                                backgroundColor: '#00d2ff',
                                transition: 'width 0.3s ease',
                                boxShadow: '0 0 10px rgba(0, 210, 255, 0.8)'
                            }} />
                        </div>

                        {/* Training Info */}
                        <div style={{
                            position: 'absolute',
                            top: '50px',
                            left: '30px',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            padding: '10px 15px',
                            borderRadius: '8px',
                            border: '1px solid #555'
                        }}>
                            <div style={{ fontSize: '0.7rem', color: '#888' }}>TRAINING MODE</div>
                            <div style={{ fontSize: '1rem', color: '#fff', fontWeight: 'bold' }}>
                                {currentProject?.name || videoName || 'Standard Work'}
                            </div>
                        </div>

                        {/* Time Display */}
                        <div style={{
                            position: 'absolute',
                            top: '50px',
                            right: '30px',
                            backgroundColor: 'rgba(0, 0, 0, 0.7)',
                            padding: '10px 15px',
                            borderRadius: '8px',
                            border: '1px solid #555',
                            fontFamily: 'monospace',
                            fontSize: '1rem',
                            color: '#fff'
                        }}>
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                    </>
                )}
            </div>

            {/* Control Bar */}
            <div style={{
                padding: '20px',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                borderTop: '1px solid #333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '15px',
                flexWrap: 'wrap'
            }}>
                {/* Previous Step */}
                <button
                    onClick={previousStep}
                    disabled={stepIndex <= 0}
                    style={{
                        padding: '12px 20px',
                        backgroundColor: stepIndex <= 0 ? '#333' : '#444',
                        border: '1px solid #555',
                        borderRadius: '8px',
                        color: stepIndex <= 0 ? '#666' : '#fff',
                        cursor: stepIndex <= 0 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                    }}
                >
                    <ChevronLeft size={18} /> Previous
                </button>

                {/* Play/Pause */}
                <button
                    onClick={togglePlay}
                    style={{
                        padding: '15px 30px',
                        backgroundColor: '#00d2ff',
                        border: 'none',
                        borderRadius: '8px',
                        color: '#000',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '1rem',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 15px rgba(0, 210, 255, 0.4)'
                    }}
                >
                    {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                    {isPlaying ? 'Pause' : 'Play'}
                </button>

                {/* Next Step */}
                <button
                    onClick={goToNextStep}
                    disabled={stepIndex >= measurements.length - 1}
                    style={{
                        padding: '12px 20px',
                        backgroundColor: stepIndex >= measurements.length - 1 ? '#333' : '#444',
                        border: '1px solid #555',
                        borderRadius: '8px',
                        color: stepIndex >= measurements.length - 1 ? '#666' : '#fff',
                        cursor: stepIndex >= measurements.length - 1 ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                    }}
                >
                    Next <ChevronRight size={18} />
                </button>

                {/* Zoom Controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                        onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                        disabled={zoom <= 0.5}
                        style={{
                            padding: '10px 15px',
                            backgroundColor: zoom <= 0.5 ? '#333' : '#444',
                            border: '1px solid #555',
                            borderRadius: '8px',
                            color: zoom <= 0.5 ? '#666' : '#fff',
                            cursor: zoom <= 0.5 ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        }}
                    >
                        -
                    </button>
                    <span style={{ color: '#aaa', fontSize: '0.9rem', minWidth: '60px', textAlign: 'center' }}>
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                        disabled={zoom >= 3}
                        style={{
                            padding: '10px 15px',
                            backgroundColor: zoom >= 3 ? '#333' : '#444',
                            border: '1px solid #555',
                            borderRadius: '8px',
                            color: zoom >= 3 ? '#666' : '#fff',
                            cursor: zoom >= 3 ? 'not-allowed' : 'pointer',
                            fontSize: '1rem',
                            fontWeight: 'bold'
                        }}
                    >
                        +
                    </button>
                </div>

                {/* Fullscreen Toggle */}
                <button
                    onClick={toggleFullscreen}
                    style={{
                        padding: '12px 20px',
                        backgroundColor: '#444',
                        border: '1px solid #555',
                        borderRadius: '8px',
                        color: '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.9rem',
                        fontWeight: 'bold'
                    }}
                >
                    {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                    {isFullscreen ? 'Exit VR' : 'Enter VR'}
                </button>
            </div>

            {/* Drawing Toolbar */}
            {!isFullscreen && showDrawingTools && (
                <div style={{
                    position: 'absolute',
                    top: '100px',
                    left: '30px',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    padding: '15px',
                    borderRadius: '12px',
                    border: '2px solid #00d2ff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    zIndex: 100
                }}>
                    <div style={{ color: '#00d2ff', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '5px' }}>Drawing Tools</div>

                    {/* Tool Buttons */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', maxWidth: '200px' }}>
                        {['pen', 'line', 'arrow', 'rectangle', 'circle', 'text'].map(tool => (
                            <button
                                key={tool}
                                onClick={() => setCurrentTool(tool)}
                                style={{
                                    padding: '8px 12px',
                                    backgroundColor: currentTool === tool ? '#00d2ff' : '#333',
                                    border: currentTool === tool ? '2px solid #fff' : '1px solid #555',
                                    borderRadius: '6px',
                                    color: currentTool === tool ? '#000' : '#fff',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                {tool === 'pen' ? '🖊' : tool === 'line' ? '—' : tool === 'arrow' ? '→' :
                                    tool === 'rectangle' ? '▢' : tool === 'circle' ? '○' : 'T'}
                            </button>
                        ))}
                    </div>

                    {/* Color Picker */}
                    <div>
                        <div style={{ color: '#aaa', fontSize: '0.7rem', marginBottom: '5px' }}>Color:</div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {['#00d2ff', '#ff0000', '#00ff00', '#ffff00', '#ff00ff', '#ffffff'].map(color => (
                                <button
                                    key={color}
                                    onClick={() => setDrawColor(color)}
                                    style={{
                                        width: '24px',
                                        height: '24px',
                                        backgroundColor: color,
                                        border: drawColor === color ? '3px solid #fff' : '1px solid #555',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Line Width */}
                    <div>
                        <div style={{ color: '#aaa', fontSize: '0.7rem', marginBottom: '5px' }}>Width: {lineWidth}px</div>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={lineWidth}
                            onChange={(e) => setLineWidth(Number(e.target.value))}
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* Clear & Close */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                        <button
                            onClick={() => setAnnotations([])}
                            style={{
                                flex: 1,
                                padding: '6px',
                                backgroundColor: '#ff4444',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}
                        >
                            Clear All
                        </button>
                        <button
                            onClick={() => setShowDrawingTools(false)}
                            style={{
                                flex: 1,
                                padding: '6px',
                                backgroundColor: '#333',
                                border: '1px solid #555',
                                borderRadius: '6px',
                                color: '#fff',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 'bold'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}

            {/* Drawing Tool Toggle Button */}
            {!isFullscreen && !showDrawingTools && (
                <button
                    onClick={() => setShowDrawingTools(true)}
                    style={{
                        position: 'absolute',
                        top: '100px',
                        left: '30px',
                        backgroundColor: 'rgba(0, 210, 255, 0.2)',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        border: '2px solid #00d2ff',
                        color: '#00d2ff',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                    title="Enable drawing tools to annotate video"
                >
                    🖊 Drawing Tools
                </button>
            )}
        </div>
    );
}

export default VRTrainingMode;
