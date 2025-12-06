import { v4 as uuidv4 } from 'uuid';

/**
 * CollaborationManager
 * Handles real-time synchronization between tabs using BroadcastChannel API.
 * Syncs: Playback state, measurements, cursor positions.
 */
class CollaborationManager {
    constructor(channelName = 'motion_sync_channel') {
        this.channelName = channelName;
        this.channel = new BroadcastChannel(channelName);
        this.userId = uuidv4().substring(0, 8); // Short ID
        this.userName = `User ${this.userId.substring(0, 4)}`;
        this.role = 'viewer'; // 'host' or 'viewer'
        this.listeners = {};

        this.channel.onmessage = (event) => {
            this.handleMessage(event.data);
        };

        // Heartbeat to detect active users
        this.startHeartbeat();

        // Initial announce
        this.broadcast({ type: 'announce', userId: this.userId, name: this.userName });
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    }

    broadcast(data) {
        this.channel.postMessage({ ...data, senderId: this.userId });
    }

    handleMessage(data) {
        // Ignore own messages (though BroadcastChannel doesn't usually send to self)
        if (data.senderId === this.userId) return;

        switch (data.type) {
            case 'playback_update':
                this.emit('playback', data.payload);
                break;
            case 'cursor_move':
                this.emit('cursor', {
                    userId: data.senderId,
                    x: data.payload.x,
                    y: data.payload.y,
                    name: data.payload.name
                });
                break;
            case 'measurement_add':
            case 'measurement_update':
                this.emit('measurement', data);
                break;
            case 'announce':
                this.emit('user_joined', { userId: data.senderId, name: data.name });
                // Reply with our presence so they know we exist
                this.broadcast({ type: 'presence', userId: this.userId, name: this.userName });
                break;
            case 'presence':
                this.emit('user_presence', { userId: data.senderId, name: data.name });
                break;
            default:
                break;
        }
    }

    // --- Actions ---

    sendPlaybackUpdate(state) {
        // state = { isPlaying: boolean, currentTime: number, speed: number }
        this.broadcast({ type: 'playback_update', payload: state });
    }

    sendCursor(x, y) {
        // Throttle this in UI component, but send raw here
        this.broadcast({ type: 'cursor_move', payload: { x, y, name: this.userName } });
    }

    sendMeasurementUpdate(measurement) {
        this.broadcast({ type: 'measurement_update', payload: measurement });
    }

    setUserName(name) {
        this.userName = name;
        this.broadcast({ type: 'presence', userId: this.userId, name: this.userName });
    }

    close() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.channel.close();
    }

    startHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.broadcast({ type: 'presence', userId: this.userId, name: this.userName });
        }, 5000);
    }
}

export default CollaborationManager;
