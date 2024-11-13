// WebSocketService.js
import { Stomp } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

class WebSocketService {
    constructor() {
        this.stompClient = null;
    }

    connect(userId, onMessageReceived) {
        // Replace `localhost:2024` with your server address
        const socket = new SockJS('http://localhost:1105/ws');
        this.stompClient = Stomp.over(socket);

        this.stompClient.connect({ userId: userId }, () => {
            console.log('Connected to WebSocket server');

            // Subscribe to user's private queue
            this.stompClient.subscribe(`/user/queue/messages`, (message) => {
                console.log('Message received:', message.body);
                onMessageReceived(JSON.parse(message.body));
            });
        }, (error) => {
            console.error('WebSocket connection error:', error);
        });
    }

    sendGroupMessage(message) {
        if (this.stompClient && this.stompClient.connected) {
            console.log('Sending message:', message);
            this.stompClient.send('/app/group', {}, JSON.stringify(message));
        } else {
            console.warn('Cannot send message, not connected to WebSocket server');
        }
    }

    sendPrivateMessage(message) {
        if (this.stompClient && this.stompClient.connected) {
            console.log('Sending message:', message);
            this.stompClient.send('/app/private', {}, JSON.stringify(message));
        } else {
            console.warn('Cannot send message, not connected to WebSocket server');
        }
    }

    disconnect() {
        if (this.stompClient) {
            this.stompClient.disconnect(() => {
                console.log('Disconnected from WebSocket server');
            });
        } else {
            console.warn('Cannot disconnect, not connected to WebSocket server');
        }
    }
}

export default new WebSocketService();
