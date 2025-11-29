/**
 * Stream Handler Utility
 * Handles various video stream protocols (HTTP, HTTPS, HLS)
 */

class StreamHandler {
    constructor() {
        this.currentStream = null;
        this.streamType = null;
        this.hlsInstance = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000;
    }

    /**
     * Connect to HTTP/HTTPS stream
     * @param {string} url - Stream URL
     * @param {HTMLVideoElement} videoElement - Video element to attach stream
     * @returns {Promise<boolean>} Success status
     */
    async connectHTTPStream(url, videoElement) {
        try {
            this.streamType = 'http';
            this.currentStream = url;

            videoElement.src = url;

            return new Promise((resolve, reject) => {
                videoElement.onloadedmetadata = () => {
                    this.reconnectAttempts = 0;
                    resolve(true);
                };

                videoElement.onerror = (error) => {
                    console.error('HTTP Stream error:', error);
                    this.handleStreamError(url, videoElement);
                    reject(error);
                };
            });
        } catch (error) {
            console.error('Failed to connect HTTP stream:', error);
            throw error;
        }
    }

    /**
     * Connect to HLS stream
     * @param {string} url - HLS stream URL (.m3u8)
     * @param {HTMLVideoElement} videoElement - Video element to attach stream
     * @returns {Promise<boolean>} Success status
     */
    async connectHLSStream(url, videoElement) {
        try {
            // Check if HLS.js is available
            if (typeof window.Hls === 'undefined') {
                throw new Error('HLS.js library not loaded');
            }

            this.streamType = 'hls';
            this.currentStream = url;

            // Check if HLS is natively supported (Safari)
            if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
                videoElement.src = url;
                this.reconnectAttempts = 0;
                return true;
            }
            // Use HLS.js for other browsers
            else if (window.Hls.isSupported()) {
                if (this.hlsInstance) {
                    this.hlsInstance.destroy();
                }

                this.hlsInstance = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true,
                    backBufferLength: 90
                });

                this.hlsInstance.loadSource(url);
                this.hlsInstance.attachMedia(videoElement);

                return new Promise((resolve, reject) => {
                    this.hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
                        this.reconnectAttempts = 0;
                        resolve(true);
                    });

                    this.hlsInstance.on(window.Hls.Events.ERROR, (event, data) => {
                        console.error('HLS error:', data);
                        if (data.fatal) {
                            this.handleHLSError(data, url, videoElement);
                            reject(data);
                        }
                    });
                });
            } else {
                throw new Error('HLS is not supported in this browser');
            }
        } catch (error) {
            console.error('Failed to connect HLS stream:', error);
            throw error;
        }
    }

    /**
     * Handle HLS errors and attempt recovery
     */
    handleHLSError(data, url, videoElement) {
        if (!this.hlsInstance) return;

        switch (data.type) {
            case window.Hls.ErrorTypes.NETWORK_ERROR:
                console.log('Network error, attempting to recover...');
                this.hlsInstance.startLoad();
                break;
            case window.Hls.ErrorTypes.MEDIA_ERROR:
                console.log('Media error, attempting to recover...');
                this.hlsInstance.recoverMediaError();
                break;
            default:
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
                    setTimeout(() => {
                        this.connectHLSStream(url, videoElement);
                    }, this.reconnectDelay);
                } else {
                    console.error('Max reconnection attempts reached');
                    this.disconnect();
                }
                break;
        }
    }

    /**
     * Handle HTTP stream errors
     */
    handleStreamError(url, videoElement) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`Reconnecting HTTP stream... Attempt ${this.reconnectAttempts}`);
            setTimeout(() => {
                this.connectHTTPStream(url, videoElement);
            }, this.reconnectDelay);
        } else {
            console.error('Max reconnection attempts reached for HTTP stream');
        }
    }

    /**
     * Disconnect current stream
     */
    disconnect() {
        if (this.hlsInstance) {
            this.hlsInstance.destroy();
            this.hlsInstance = null;
        }
        this.currentStream = null;
        this.streamType = null;
        this.reconnectAttempts = 0;
    }

    /**
     * Get current stream status
     * @returns {Object} Stream status information
     */
    getStreamStatus() {
        return {
            isConnected: this.currentStream !== null,
            streamType: this.streamType,
            streamUrl: this.currentStream,
            reconnectAttempts: this.reconnectAttempts
        };
    }

    /**
     * Get MediaStream from video element for recording
     * @param {HTMLVideoElement} videoElement
     * @returns {MediaStream}
     */
    getMediaStream(videoElement) {
        if (!videoElement) {
            throw new Error('Video element is required');
        }

        // Capture stream from video element
        return videoElement.captureStream ? videoElement.captureStream() : videoElement.mozCaptureStream();
    }
}

export default StreamHandler;
