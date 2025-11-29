/**
 * Video Recorder Utility
 * Handles video recording using MediaRecorder API
 */

class VideoRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.startTime = null;
        this.stream = null;
        this.mimeType = null;
    }

    /**
     * Get supported MIME types for recording
     * @returns {Array<Object>} Array of supported MIME types with labels
     */
    static getSupportedMimeTypes() {
        const types = [
            { mimeType: 'video/webm;codecs=vp9', label: 'WebM (VP9)' },
            { mimeType: 'video/webm;codecs=vp8', label: 'WebM (VP8)' },
            { mimeType: 'video/webm', label: 'WebM' },
            { mimeType: 'video/mp4', label: 'MP4' },
            { mimeType: 'video/x-matroska;codecs=avc1', label: 'MKV (H.264)' }
        ];

        return types.filter(type => MediaRecorder.isTypeSupported(type.mimeType));
    }

    /**
     * Get best supported MIME type
     * @returns {string} Best supported MIME type
     */
    static getBestMimeType() {
        const supported = VideoRecorder.getSupportedMimeTypes();
        return supported.length > 0 ? supported[0].mimeType : 'video/webm';
    }

    /**
     * Start recording
     * @param {MediaStream|HTMLVideoElement} source - Media stream or video element
     * @param {Object} options - Recording options
     * @returns {Promise<boolean>} Success status
     */
    async startRecording(source, options = {}) {
        try {
            // Get media stream from source
            if (source instanceof HTMLVideoElement) {
                this.stream = source.captureStream ? source.captureStream() : source.mozCaptureStream();
            } else if (source instanceof MediaStream) {
                this.stream = source;
            } else {
                throw new Error('Invalid source. Must be HTMLVideoElement or MediaStream');
            }

            // Set MIME type
            this.mimeType = options.mimeType || VideoRecorder.getBestMimeType();

            if (!MediaRecorder.isTypeSupported(this.mimeType)) {
                console.warn(`${this.mimeType} not supported, falling back to default`);
                this.mimeType = VideoRecorder.getBestMimeType();
            }

            // Create MediaRecorder
            const recorderOptions = {
                mimeType: this.mimeType,
                videoBitsPerSecond: options.videoBitsPerSecond || 2500000 // 2.5 Mbps default
            };

            this.mediaRecorder = new MediaRecorder(this.stream, recorderOptions);
            this.recordedChunks = [];
            this.startTime = Date.now();

            // Handle data available
            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data && event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            // Start recording
            this.mediaRecorder.start(1000); // Collect data every second

            return true;
        } catch (error) {
            console.error('Failed to start recording:', error);
            throw error;
        }
    }

    /**
     * Stop recording
     * @returns {Promise<Blob>} Recorded video blob
     */
    stopRecording() {
        return new Promise((resolve, reject) => {
            if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
                reject(new Error('No active recording'));
                return;
            }

            this.mediaRecorder.onstop = () => {
                const blob = new Blob(this.recordedChunks, {
                    type: this.mimeType
                });
                resolve(blob);
            };

            this.mediaRecorder.onerror = (error) => {
                reject(error);
            };

            this.mediaRecorder.stop();
        });
    }

    /**
     * Pause recording
     */
    pauseRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.pause();
        }
    }

    /**
     * Resume recording
     */
    resumeRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state === 'paused') {
            this.mediaRecorder.resume();
        }
    }

    /**
     * Get recording duration in seconds
     * @returns {number} Duration in seconds
     */
    getRecordingDuration() {
        if (!this.startTime) return 0;
        return Math.floor((Date.now() - this.startTime) / 1000);
    }

    /**
     * Get recording state
     * @returns {string} Recording state (inactive, recording, paused)
     */
    getRecordingState() {
        return this.mediaRecorder ? this.mediaRecorder.state : 'inactive';
    }

    /**
     * Download recorded video
     * @param {Blob} blob - Video blob
     * @param {string} filename - Filename for download
     */
    static downloadRecording(blob, filename = 'recording.webm') {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    }

    /**
     * Create object URL from blob for playback
     * @param {Blob} blob - Video blob
     * @returns {string} Object URL
     */
    static createObjectURL(blob) {
        return URL.createObjectURL(blob);
    }

    /**
     * Check if MediaRecorder is supported
     * @returns {boolean} Support status
     */
    static isSupported() {
        return typeof MediaRecorder !== 'undefined';
    }
}

export default VideoRecorder;
