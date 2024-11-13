import React, { useEffect, useState, useRef } from 'react';
import ChatList from './ChatList';
import WebSocketService from './websocketService';
import Cookies from 'js-cookie';
import axios from 'axios';
import ImageShow from './ImageShow';
import ChatInfo from './ChatInfo';


async function fetchPrivateChat(chatId) {
    try {
        const response = await axios.get(`http://localhost:1105/api/v1/chat/private/${chatId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching chat data:', error);
    }
}

async function fetchGroupChat(chatId) {
    try {
        const response = await axios.get(`http://localhost:1105/api/v1/chat/group/${chatId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching chat data:', error);
    }
}

async function uploadFile(userId, chatId, file) {
    const formData = new FormData();
    formData.append('userId', userId);
    formData.append('chatId', chatId);
    formData.append('file', file);
    try {
        const response = await axios.post('http://localhost:1105/api/v1/uploads/file', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error) {
        console.error('Error uploading file:', error);
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const Chat = () => {
    const [userId, setUserId] = useState('');
    const [userName, setUserName] = useState('');
    const [chat, setChat] = useState('');
    const [messages, setMessages] = useState([]);
    const [messageContent, setMessageContent] = useState('');
    const [newMessage, setNewMessage] = useState(null);
    const messagesEndRef = useRef(null);
    const [audio] = useState(new Audio('/notifi_sound.mp3'));
    const [filesContent, setFilesContent] = useState([]);
    const [selectedImage, setSelectedImage] = useState(null);
    const [userInteracted, setUserInteracted] = useState(false);

    useEffect(() => {
        const handleUserInteraction = () => {
            setUserInteracted(true);
            window.removeEventListener('click', handleUserInteraction);
            window.removeEventListener('keydown', handleUserInteraction);
        };

        window.addEventListener('click', handleUserInteraction);
        window.addEventListener('keydown', handleUserInteraction);

        return () => {
            window.removeEventListener('click', handleUserInteraction);
            window.removeEventListener('keydown', handleUserInteraction);
        };
    }, []);




    useEffect(() => {
        const savedUser = Cookies.get('user');
        const { id } = JSON.parse(savedUser || '{}');
        const { username } = JSON.parse(savedUser || '{}');
        setUserId(id);
        setUserName(username);


    }, []);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setSelectedImage(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        setMessages([]);
        const fetchData = chat.group ? fetchGroupChat : fetchPrivateChat;
        fetchData(chat.id).then((data) => setMessages(data || []));
    }, [chat]);

    useEffect(() => {
        WebSocketService.connect(userId, (message) => {
            const { type } = message;
            if (type === 'MESSAGE') {
                setMessages((prevMessages) => [...(prevMessages || []), message]);
                setNewMessage(message);
                if (userInteracted) {
                    audio.play();
                }
            }
            if (type === 'CREATE_GROUP') {
                setNewMessage(message);
                if (userInteracted) {
                    audio.play();
                }
            }

            if (type === 'FRIEND_REQUEST_ACCEPTED') {
                setNewMessage(message);
                if (userInteracted) {
                    audio.play();
                }
            }
            else {
                if (userInteracted) {
                    audio.play();
                }
            }
        });
        return () => {
            WebSocketService.disconnect();
        };
    }, [userId, audio, userInteracted]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
        window.scrollTo(0, 0);
        sleep(1000).then(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            }
            window.scrollTo(0, 0);
        });

    }, [messages]);

    const handleSendMessage = async () => {
        if (messageContent.trim() === '' && filesContent.length === 0) return;

        let attachments = await Promise.all(filesContent.map(async (file) => {
            let attachment = await uploadFile(userId, chat.id, file.file);
            return { fileUrl: attachment.fileUrl, fileType: attachment.fileType, fileSize: attachment.fileSize };
        }));

        console.log(attachments);


        const message = {
            chatId: chat.id,
            senderId: userId,
            senderName: userName,
            content: messageContent,
            timestamp: new Date().toISOString(),
            attachments,
        };

        setMessages((prevMessages) => [...(prevMessages || []), message]);
        setNewMessage(message);

        if (chat.group) WebSocketService.sendGroupMessage(message);
        else WebSocketService.sendPrivateMessage(message);

        setMessageContent('');
        setFilesContent([]);
    };

    const openFilePicker = () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.multiple = true;
        fileInput.click();

        fileInput.addEventListener('change', async (e) => {
            const files = e.target.files;
            const filesArray = Array.from(files);

            const filesContent = await Promise.all(filesArray.map(async (file) => {
                const fileUrl = URL.createObjectURL(file);
                return { name: file.name, content: fileUrl, file };
            }));

            setFilesContent(filesContent);
        });
    };



    return (
        <div className="flex w-full h-screen items-center justify-center bg-white">
            {/* Image Popup */}
            {selectedImage && (
                <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" >
                    <div className="relative">
                        <img src={selectedImage} alt="Selected" className="h-screen w-auto object-contain" />
                        <button
                            onClick={() => setSelectedImage(null)}
                            className="absolute top-0 right-0 m-4 text-white text-2xl"
                        >
                            &times;
                        </button>
                    </div>
                </div>
            )}
            {/* Chat List and Messages */}
            <ChatList userId={userId} setChat={setChat} newMessage={newMessage} />
            <div className="w-2/5 h-screen flex shadow-lg">
                <div className="bg-white p-4 flex-grow">
                    {chat.id ? (
                        <div className="flex flex-col h-full">
                            <div className="bg-slate-200 h-auto w-auto">
                                <h2 className="text-xl font-bold m-4">{chat.name}</h2>
                            </div>
                            <div className="flex-grow space-y-2 mb-4 overflow-y-auto bg-gray-100 pt-2">
                                {messages && messages.map((msg, index) => (
                                    <div
                                        key={index}
                                        className={`pb-2 ${msg.senderId === userId ? 'text-right place-self-end mr-2 ml-16' : 'text-left place-self-start ml-2 mr-16'}`}
                                    >
                                        {msg.senderId === messages[index - 1]?.senderId ? null : (
                                            <p className={`text-gray-500 px-2`}>
                                                {msg.senderName}
                                            </p>
                                        )}
                                        <div>
                                            {msg.content && (
                                                <p className={`p-2 rounded ${msg.senderId === userId ? 'bg-blue-500 text-white' : 'bg-blue-100'}`}>
                                                    {msg.content}
                                                </p>
                                            )}
                                            {msg.attachments && (
                                                <div className={`${msg.senderId === userId ? 'text-right' : 'text-left'}`}>
                                                    <ImageShow image={msg.attachments} setSelectedImage={setSelectedImage} />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>
                            <div className="flex flex-col w-full h-auto">
                                <div className={`flex row items-start space-x-2 p-2 ${filesContent && filesContent.length > 0 ? 'h-28' : 'h-0'}`}>
                                    {filesContent.map((file, index) => (
                                        <div key={index} className="relative">
                                            {file.content ? (
                                                <img alt={file.name} src={file.content} className="w-20 h-20 object-cover rounded" />
                                            ) : (
                                                <p className="text-red-500">Invalid image source</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center">
                                    <button onClick={openFilePicker} className="p-2 bg-gray-200 rounded-l">
                                        Select Files
                                    </button>
                                    <input
                                        type="text"
                                        value={messageContent}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                                        onChange={(e) => setMessageContent(e.target.value)}
                                        placeholder="Type your message"
                                        className="flex-grow p-2 border rounded-l"
                                    />
                                    <button onClick={handleSendMessage} className="p-2 bg-blue-500 text-white rounded-r">
                                        Send
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <p>Select a chat to start messaging</p>
                    )}
                </div>
            </div>
            {chat.id && (
                <ChatInfo chat={chat} userId={userId} newMessage={newMessage} />
            )}

        </div >
    );
};

export default Chat;
