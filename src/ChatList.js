import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Nav from './Nav';

async function readChat(userId, chatId, isGroup) {
    try {
        await axios.put(`http://localhost:1105/api/v1/chat/${userId}/read/${chatId}?isGroup=${isGroup}`);
    } catch (error) {
        console.error('Error updating chat:', error);
    }

}

async function fetchChats(userId) {
    try {
        const response = await axios.get(`http://localhost:1105/api/v1/chat/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching chat data:', error);
    }
}


const debounce = (func, delay) => {
    let timeoutId;
    return (...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
};

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const ChatList = ({ userId, setChat, newMessage }) => {
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchAndUpdateChats = async () => {
            const data = await fetchChats(userId);
            setChats(data);
        };

        fetchAndUpdateChats();

        const intervalId = setInterval(() => {
            fetchAndUpdateChats();
        }, 60000); // Fetch chats and notifications every 60 seconds

        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, [userId]);

    useEffect(() => {
        if (newMessage && newMessage.type === "MESSAGE") {
            setChats((prevChats) => {
                const updatedChats = prevChats.map(chat => {
                    if (chat.id === newMessage.chatId) {
                        chat.lastMessage = newMessage.content;
                        chat.timestamp = newMessage.timestamp;
                    }
                    return chat;
                });
                return updatedChats.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            });

            if (selectedChat && newMessage.chatId === selectedChat.id) {
                readChat(userId, newMessage.chatId, selectedChat.group);
            }
        }
        if (newMessage && (newMessage.type === "CREATE_GROUP" || newMessage.type === "FRIEND_REQUEST_ACCEPTED")) {

            setChats((prevChats) => {
                const updatedChats = [...prevChats, {
                    id: newMessage.id,
                    name: newMessage.name,
                    lastMessage: newMessage.lastMessage,
                    timestamp: newMessage.timestamp,
                    group: newMessage.group,
                    unreadCount: newMessage.unreadCount
                }];
                return updatedChats.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newMessage]);

    const handleChatClick = (chat) => {
        setChat(chat);
        setSelectedChat(chat);
        // find in chats array and update unread count

        readChat(userId, chat.id, chat.group);
        setChats((prevChats) => {
            const updatedChats = prevChats.map(c => {
                if (c.id === chat.id) {
                    c.unreadCount = 0;
                }
                return c;
            });
            return updatedChats;
        });

        setSearchQuery('');
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const handleSearchChange = useCallback(debounce((e) => {
        setSearchQuery(e.target.value);
    }, 300), []);

    const filteredChats = (chats || []).filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
    );


    const handleFriendRequestAccept = async () => {
        await sleep(100);
        const data = await fetchChats(userId);
        setChats(data);
    }

    function timeAgo(timestamp) {
        const now = new Date();
        const past = new Date(timestamp);
        const diffInMs = now - past; // Difference in milliseconds

        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        const diffInMonths = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 30));
        const diffInYears = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 365));

        if (diffInYears > 0) {
            return `${diffInYears} year${diffInYears > 1 ? 's' : ''}`;
        } else if (diffInMonths > 0) {
            return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''}`;
        } else if (diffInDays > 0) {
            return `${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
        } else if (diffInHours > 0) {
            return `${diffInHours} hour${diffInHours > 1 ? 's' : ''}`;
        } else if (diffInMinutes < 1) {
            return 'Just now';
        } else
            return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    }

    return (
        <div className="p-2 h-screen w-1/4 max-w-72 min-w-60 bg-white shadow-lg mr-1">
            <Nav userId={userId} handleFriendRequestAccept={handleFriendRequestAccept} />
            <div className="flex items-center mb-2">
                <input
                    type="text"
                    placeholder="Search for chats"
                    className="p-2 border rounded flex-grow"
                    onChange={handleSearchChange}
                />
            </div>
            <div className="h-[calc(100vh-64px)] overflow-y-auto mt-2">
                <ul className="space-y-1">
                    {filteredChats && filteredChats.map(chat => (
                        <li
                            key={chat.id}
                            onClick={() => handleChatClick(chat)}
                            className={`flex h-24 w-80 items-center p-3 rounded-lg cursor-pointer ${selectedChat && selectedChat.id === chat.id ? 'bg-gray-200' : 'bg-gray-100'}`}
                        >
                            <div className='flex items-center w-full'>
                                <img
                                    src={`http://localhost:1105/api/v1/${chat.image}`}
                                    alt={`${chat.name}'s avatar`}
                                    className="w-10 h-10 rounded-full mr-3"
                                />
                                <div className="flex flex-col justify-center flex-grow w-56">
                                    <h2 className={`text-lg font-semibold truncate ${chat.unreadCount > 0 ? 'font-bold' : ''}`}>{chat.name}</h2>
                                    <p
                                        className={`text-sm ${chat.unreadCount > 0 ? 'font-bold' : 'text-gray-600'} overflow-hidden whitespace-nowrap text-ellipsis`}
                                        style={{ maxWidth: 'calc(100% - 20px)' }}
                                    >
                                        {chat.lastMessage}
                                    </p>
                                    <span className="text-xs text-gray-500">
                                        {chat.timestamp ? timeAgo(chat.timestamp) : ''}
                                    </span>
                                </div>
                                {chat.unreadCount > 0 && (
                                    <div className="ml-2 w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default ChatList;
