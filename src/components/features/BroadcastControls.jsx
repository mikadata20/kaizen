import React, { useState, useRef, useEffect } from 'react';
import ChatBox from './ChatBox';

function BroadcastControls({
    isBroadcasting,
    isMuted,
    onToggleMute,
    chatMessages,
    onSendMessage,
    userName = 'Host',
    onStopBroadcast
}) {
    const [isVisible, setIsVisible] = useState(true);
    const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
    const [lastMessageCount, setLastMessageCount] = useState(0);

    // Detect new messages
    useEffect(() => {
        if (chatMessages.length > lastMessageCount && !isVisible) {
            setHasUnreadMessages(true);
        }
        setLastMessageCount(chatMessages.length);
    }, [chatMessages.length, lastMessageCount, isVisible]);

    // Clear unread when chat is opened
    useEffect(() => {
        if (isVisible) {
            setHasUnreadMessages(false);
        }
    }, [isVisible]);

    if (!isBroadcasting) return null;

    return (
        <>
            {/* Floating Controls Bar */}
            <div style={{
                position: 'fixed',
                bottom: isVisible ? '420px' : '20px',
                right: '20px',
                backgroundColor: '#1e1e1e',
                border: '1px solid #444',
                borderRadius: '8px',
                padding: '10px',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                zIndex: 1001,
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                transition: 'bottom 0.3s ease'
            }}>
                {/* Mute Button */}
                <button
                    onClick={onToggleMute}
                    style={{
                        padding: '8px 12px',
                        backgroundColor: isMuted ? '#c50f1f' : '#107c10',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.9rem'
                    }}
                    title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                    {isMuted ? '🔇' : '🎤'}
                </button>

                {/* Chat Toggle Button */}
                <button
                    onClick={() => setIsVisible(!isVisible)}
                    style={{
                        padding: '8px 12px',
                        backgroundColor: '#0078d4',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.9rem',
                        position: 'relative'
                    }}
                    title={isVisible ? 'Hide Chat' : 'Show Chat'}
                >
                    💬 {isVisible ? 'Hide' : 'Show'}
                    {hasUnreadMessages && (
                        <span style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            backgroundColor: '#c50f1f',
                            color: 'white',
                            borderRadius: '50%',
                            width: '12px',
                            height: '12px',
                            fontSize: '0.6rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            animation: 'pulse 1s infinite'
                        }}>
                            !
                        </span>
                    )}
                </button>

                {/* Stop Broadcast Button */}
                {onStopBroadcast && (
                    <button
                        onClick={onStopBroadcast}
                        style={{
                            padding: '8px 12px',
                            backgroundColor: '#c50f1f',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            fontSize: '0.9rem'
                        }}
                        title="Stop Broadcasting"
                    >
                        ⏹ Stop
                    </button>
                )}
            </div>

            {/* Chat Box */}
            {isVisible && (
                <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000 }}>
                    <ChatBox
                        messages={chatMessages}
                        onSendMessage={onSendMessage}
                        userName={userName}
                    />
                </div>
            )}

            {/* Pulse animation for notification */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </>
    );
}

export default BroadcastControls;
