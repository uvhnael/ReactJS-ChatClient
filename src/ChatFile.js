import React, { useEffect, useState } from 'react';
import axios from 'axios';

async function getFiles(chatId) {
    try {
        const response = await axios.get(`http://localhost:1105/api/v1/uploads/files/${chatId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching files:', error);
    }

}

const ChatFile = ({ userId, chatId, newMessage }) => {
    const [files, setFiles] = useState([]);

    useEffect(() => {
        const fetchFiles = async () => {
            const data = await getFiles(chatId);
            setFiles(data);
        };

        fetchFiles();
    }, [chatId]);

    useEffect(() => {
        if (newMessage) {
            if (newMessage.chatId === chatId) {
                if (newMessage.attachments && newMessage.attachments.length > 0) {
                    // add file to files at the start
                    setFiles((prevFiles) => {
                        return [...newMessage.attachments, ...prevFiles];
                    });
                }

            }
        }
    }, [newMessage, chatId]);

    if (files && files.length === 0) return null;
    return (
        <div className="h-96 overflow-y-auto">
            <div className="grid grid-cols-3 gap-1 px-2">
                {files && files.map((file) => (
                    <div key={file.id}>
                        <img src={`http://localhost:1105/api/v1/${file.fileUrl}`} alt="attachment" className="h-32 w-32 object-cover rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatFile;