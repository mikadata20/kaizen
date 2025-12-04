import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Download, RefreshCw, AlertCircle } from 'lucide-react';
import { initializePoseDetector, detectPose, drawPoseSkeleton, disposeDetector } from '../utils/poseDetector';
import { classifyAction, smoothActionSequence, actionsToMeasurements, THERBLIG_ACTIONS } from '../utils/actionClassifier';
import HelpButton from './HelpButton';

function ActionRecognition({ videoSrc, onActionsDetected }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [detectedActions, setDetectedActions] = useState([]);
    const [currentAction, setCurrentAction] = useState(null);
    const [showPoseSkeleton, setShowPoseSkeleton] = useState(true);
    const [error, setError] = useState(null);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const animationRef = useRef(null);
    const actionSequenceRef = useRef([]);

    useEffect(() => {
        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
            disposeDetector();
        };
    }, []);

    const processVideo = async () => {
        if (!videoRef.current) return;

        setIsProcessing(true);
        setError(null);
        setProgress(0);
        actionSequenceRef.current = [];

        try {
            // Initialize detector
            await initializePoseDetector();

            const video = videoRef.current;
            const duration = video.duration;
            const fps = 30;
            const totalFrames = Math.floor(duration * fps);

            let previousPose = null;
            let previousAction = 'Idle';
            let frameCount = 0;

            // Process video frame by frame
            const processFrame = async () => {
                if (frameCount >= totalFrames) {
                    // Processing complete
                    finishProcessing();
                    return;
                }

                const currentTime = frameCount / fps;
                video.currentTime = currentTime;

                // Wait for video to seek
                await new Promise(resolve => {
                    video.onseeked = resolve;
                });

                // Detect pose
                const poses = await detectPose(video);

                if (poses && poses.length > 0) {
                    const pose = poses[0];

                    // Classify action
                    const actionResult = classifyAction(pose, previousPose, previousAction);

                    actionSequenceRef.current.push({
                        frame: frameCount,
                        time: currentTime,
                        ...actionResult,
                        pose
                    });

                    setCurrentAction(actionResult);
                    previousPose = pose;
                    previousAction = actionResult.action;

                    // Draw skeleton if enabled
                    if (showPoseSkeleton && canvasRef.current) {
                        const ctx = canvasRef.current.getContext('2d');
                        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                        drawPoseSkeleton(ctx, poses);
                    }
                }

                frameCount++;
                setProgress((frameCount / totalFrames) * 100);

                // Process next frame
                setTimeout(processFrame, 0);
            };

            processFrame();

        } catch (err) {
            console.error('Error processing video:', err);
            setError(err.message);
            setIsProcessing(false);
        }
    };

    const finishProcessing = () => {
        // Smooth action sequence
        const smoothed = smoothActionSequence(actionSequenceRef.current, 5);
        setDetectedActions(smoothed);
        setIsProcessing(false);
        setProgress(100);
        console.log('✅ Action recognition complete:', smoothed);
    };

    const exportToMeasurements = () => {
        if (detectedActions.length === 0) return;

        const measurements = actionsToMeasurements(detectedActions, 30);

        if (onActionsDetected) {
            onActionsDetected(measurements);
        }

        alert(`✅ ${measurements.length} actions exported to measurements!`);
    };

    const resetDetection = () => {
        setDetectedActions([]);
        setCurrentAction(null);
        setProgress(0);
        actionSequenceRef.current = [];
        if (canvasRef.current) {
            const ctx = canvasRef.current.getContext('2d');
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    const helpContent = (
        <>
            <h3 style={{ color: '#ffd700', marginTop: '20px' }}>📌 Fungsi</h3>
            <p>Deteksi otomatis gerakan operator menggunakan AI dan klasifikasi ke dalam Therblig elements.</p>

            <h3 style={{ color: '#ffd700', marginTop: '20px' }}>🚀 Cara Pakai</h3>
            <ol>
                <li>Upload atau pilih video</li>
                <li>Klik <strong>Start Detection</strong></li>
                <li>Tunggu proses selesai (progress bar)</li>
                <li>Review detected actions</li>
                <li>Klik <strong>Export to Measurements</strong></li>
            </ol>

            <h3 style={{ color: '#ffd700', marginTop: '20px' }}>🎯 Actions Detected</h3>
            <ul>
                <li><strong>Reach (R)</strong>: Gerakan tangan menuju objek</li>
                <li><strong>Grasp (G)</strong>: Menggenggam objek</li>
                <li><strong>Move (M)</strong>: Memindahkan objek</li>
                <li><strong>Position (P)</strong>: Memposisikan objek</li>
                <li><strong>Release (RL)</strong>: Melepas objek</li>
            </ul>
        </>
    );

    return (
        <div style={{
            padding: '20px',
            backgroundColor: '#1e1e1e',
            minHeight: '100vh',
            color: '#fff'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h2 style={{ margin: '0 0 5px 0', color: '#00d2ff' }}>🤖 Action Recognition</h2>
                    <p style={{ margin: 0, color: '#aaa', fontSize: '0.9rem' }}>
                        AI-powered automatic action detection and classification
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <HelpButton title="🤖 Action Recognition - Help" content={helpContent} />
                    {!isProcessing && detectedActions.length === 0 && (
                        <button
                            onClick={processVideo}
                            disabled={!videoSrc}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: videoSrc ? '#00d2ff' : '#555',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: videoSrc ? 'pointer' : 'not-allowed',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontWeight: 'bold'
                            }}
                        >
                            <Play size={18} /> Start Detection
                        </button>
                    )}
                    {detectedActions.length > 0 && (
                        <>
                            <button
                                onClick={exportToMeasurements}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#4caf50',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontWeight: 'bold'
                                }}
                            >
                                <Download size={18} /> Export to Measurements
                            </button>
                            <button
                                onClick={resetDetection}
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#ff4b4b',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                <RefreshCw size={18} /> Reset
                            </button>
                        </>
                    )}
                </div>
            </div>

            {error && (
                <div style={{
                    padding: '15px',
                    backgroundColor: '#3a1a1a',
                    border: '1px solid #ff4b4b',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <AlertCircle size={20} color="#ff4b4b" />
                    <span>{error}</span>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '20px' }}>
                {/* Left: Video + Canvas */}
                <div>
                    <div style={{
                        position: 'relative',
                        backgroundColor: '#000',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        marginBottom: '15px'
                    }}>
                        <video
                            ref={videoRef}
                            src={videoSrc}
                            style={{ width: '100%', display: 'block' }}
                            onLoadedMetadata={(e) => {
                                if (canvasRef.current) {
                                    canvasRef.current.width = e.target.videoWidth;
                                    canvasRef.current.height = e.target.videoHeight;
                                }
                            }}
                        />
                        {showPoseSkeleton && (
                            <canvas
                                ref={canvasRef}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    pointerEvents: 'none'
                                }}
                            />
                        )}
                    </div>

                    {/* Progress Bar */}
                    {isProcessing && (
                        <div style={{
                            backgroundColor: '#2a2a2a',
                            borderRadius: '8px',
                            padding: '15px',
                            marginBottom: '15px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span>Processing...</span>
                                <span>{progress.toFixed(0)}%</span>
                            </div>
                            <div style={{
                                width: '100%',
                                height: '8px',
                                backgroundColor: '#1a1a1a',
                                borderRadius: '4px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${progress}%`,
                                    height: '100%',
                                    backgroundColor: '#00d2ff',
                                    transition: 'width 0.3s'
                                }} />
                            </div>
                        </div>
                    )}

                    {/* Current Action */}
                    {currentAction && isProcessing && (
                        <div style={{
                            backgroundColor: '#2a2a2a',
                            borderRadius: '8px',
                            padding: '15px'
                        }}>
                            <h3 style={{ margin: '0 0 10px 0', fontSize: '1rem' }}>Current Action</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    backgroundColor: currentAction.color,
                                    borderRadius: '8px'
                                }} />
                                <div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                                        {currentAction.action}
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#aaa' }}>
                                        Confidence: {(currentAction.confidence * 100).toFixed(0)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Detected Actions List */}
                <div style={{
                    backgroundColor: '#2a2a2a',
                    borderRadius: '8px',
                    padding: '20px',
                    maxHeight: '600px',
                    overflowY: 'auto'
                }}>
                    <h3 style={{ margin: '0 0 15px 0' }}>
                        Detected Actions ({detectedActions.length})
                    </h3>

                    {detectedActions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                            <p>No actions detected yet.</p>
                            <p style={{ fontSize: '0.85rem' }}>
                                Click "Start Detection" to begin analyzing the video.
                            </p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {detectedActions.map((action, index) => (
                                <div
                                    key={index}
                                    style={{
                                        backgroundColor: '#1a1a1a',
                                        padding: '12px',
                                        borderRadius: '6px',
                                        borderLeft: `4px solid ${action.color}`
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                                        <span style={{ fontWeight: 'bold' }}>
                                            {index + 1}. {action.action}
                                        </span>
                                        <span style={{ fontSize: '0.85rem', color: '#aaa' }}>
                                            {action.therblig}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#aaa' }}>
                                        Duration: {(action.duration / 30).toFixed(2)}s
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#aaa' }}>
                                        Confidence: {(action.confidence * 100).toFixed(0)}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ActionRecognition;
