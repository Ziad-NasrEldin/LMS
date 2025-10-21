import { useEffect, useState } from 'react';
import { 
  initializeSocket, 
  onConnectionStateChange,
  on as onSocketEvent,
  off as offSocketEvent,
  emit,
  ConnectionState
} from '../utils/socket';

const SocketTest = () => {
  const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED);
  const [messages, setMessages] = useState([]);
  const [testMessage, setTestMessage] = useState('');
  const [userId] = useState('test-user-' + Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    // Initialize socket connection
    initializeSocket(userId);

    // Listen for connection state changes
    const handleConnectionChange = (state) => {
      console.log('Connection state changed:', state);
      setConnectionState(state);
    };

    const unsubscribe = onConnectionStateChange(handleConnectionChange);

    // Listen for test messages
    const handleTestMessage = (data) => {
      console.log('Received test message:', data);
      setMessages(prev => [...prev, { type: 'received', text: data.text, time: new Date().toISOString() }]);
    };

    onSocketEvent('testMessage', handleTestMessage);

    // Clean up
    return () => {
      offSocketEvent('testMessage', handleTestMessage);
      unsubscribe();
    };
  }, [userId]);

  const sendTestMessage = () => {
    if (!testMessage.trim()) return;
    
    const message = {
      text: testMessage,
      time: new Date().toISOString(),
      userId
    };

    emit('testMessage', message, (response) => {
      console.log('Server acknowledged message:', response);
      setMessages(prev => [...prev, { 
        type: 'sent', 
        text: testMessage, 
        time: new Date().toISOString() 
      }]);
      setTestMessage('');
    });
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '600px', 
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2>WebSocket Connection Test</h2>
      <div style={{
        padding: '10px',
        marginBottom: '20px',
        backgroundColor: connectionState === ConnectionState.CONNECTED ? '#d4edda' : '#f8d7da',
        border: `1px solid ${connectionState === ConnectionState.CONNECTED ? '#c3e6cb' : '#f5c6cb'}`,
        borderRadius: '4px',
        color: connectionState === ConnectionState.CONNECTED ? '#155724' : '#721c24'
      }}>
        Status: {connectionState}
        <br />
        User ID: {userId}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          placeholder="Type a test message..."
          style={{
            padding: '8px',
            width: '70%',
            marginRight: '10px',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
          onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
        />
        <button 
          onClick={sendTestMessage}
          disabled={connectionState !== ConnectionState.CONNECTED}
          style={{
            padding: '8px 16px',
            backgroundColor: connectionState === ConnectionState.CONNECTED ? '#007bff' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: connectionState === ConnectionState.CONNECTED ? 'pointer' : 'not-allowed'
          }}
        >
          Send Test Message
        </button>
      </div>

      <div style={{
        height: '300px',
        border: '1px solid #dee2e6',
        borderRadius: '4px',
        padding: '10px',
        overflowY: 'auto',
        backgroundColor: '#f8f9fa'
      }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#6c757d', marginTop: '20px' }}>
            No messages yet. Send a test message!
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index}
              style={{
                textAlign: msg.type === 'sent' ? 'right' : 'left',
                marginBottom: '10px'
              }}
            >
              <div style={{
                display: 'inline-block',
                padding: '8px 12px',
                borderRadius: '18px',
                backgroundColor: msg.type === 'sent' ? '#007bff' : '#e9ecef',
                color: msg.type === 'sent' ? 'white' : 'black',
                maxWidth: '80%',
                wordBreak: 'break-word'
              }}>
                {msg.text}
                <div style={{
                  fontSize: '0.75rem',
                  color: msg.type === 'sent' ? 'rgba(255,255,255,0.7)' : '#6c757d',
                  marginTop: '4px'
                }}>
                  {new Date(msg.time).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SocketTest;
