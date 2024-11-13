import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaArrowDown, FaArrowUp } from 'react-icons/fa';
import { TbLetterCase, TbDots } from "react-icons/tb";
import ChatFile from './ChatFile';

async function fetchMembers(chatId) {
    try {
        const response = await axios.get(`http://localhost:1105/api/v1/chat/group/${chatId}/participants`);
        return response.data;
    } catch (error) {
        console.error('Error fetching members:', error);
    }
}


const ChatInfo = ({ userId, chat, newMessage }) => {
    const [members, setMembers] = useState([]);
    const [showMemberSetting, setShowMemberSetting] = useState(false);
    const [showMembers, setShowMembers] = useState(false);
    const [showFiles, setShowFiles] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const memberSettingRef = useRef(null);

    const handleClickOutside = (event) => {
        if (memberSettingRef.current && !memberSettingRef.current.contains(event.target)) {
            setShowMemberSetting(null);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const fetchMembersData = async () => {
            const data = await fetchMembers(chat.id);
            setMembers(data);
        };
        if (chat.group) {
            fetchMembersData();
        }
    }, [chat.id, chat.group]);

    useEffect(() => {
        setShowMembers(false);
        setShowFiles(false);
        setShowSettings(false);
    }, [chat]);




    const handleToggleMembers = () => {
        setShowMembers(!showMembers);
    };

    const handleToggleFiles = () => {
        setShowFiles(!showFiles);
    };

    const handleToggleSettings = () => {
        setShowSettings(!showSettings);
    };

    const handleToggleMemberSetting = (member) => {
        setShowMemberSetting(member);
    }

    return (
        <div className="h-screen w-1/5 bg-gray-100 shadow-lg ml-1">
            <div className="p-6">
                <div className="justify-center items-center flex flex-col mb-12">
                    <div className="mb-2">
                        <img src={`http://localhost:1105/api/v1/${chat.image}`} alt="Chat" className="h-36 w-36 object-cover rounded-full" />
                    </div>
                    <div className="mb-4">
                        <p className="text-gray-700 font-semibold text-3xl">{chat.name}</p>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="p-2 flex items-center justify-between rounded hover:shadow-sm hover:bg-white" onClick={handleToggleSettings}>
                        <p className="text-gray-700 font-semibold text-lg ">Chat Settings</p>
                        <p className="text-blue-500 cursor-pointer">
                            {showSettings ? (
                                <FaArrowUp />
                            ) : (
                                <FaArrowDown />
                            )}
                        </p>
                    </div>
                    {showSettings && (
                        <div className='pl-2'>
                            <div className="p-2 flex items-center justify-start rounded hover:shadow-sm hover:bg-white" onClick={handleToggleSettings}>
                                <p className="text-blue-500 text-xl"> <TbLetterCase /></p>
                                <p className="pl-2 text-gray-700 font-semibold text-lg ">Edit Nickname</p>
                            </div>
                            <div className="p-2 flex items-center justify-start rounded hover:shadow-sm hover:bg-white" onClick={handleToggleSettings}>
                                <p className="text-blue-500 text-xl"> <TbLetterCase /></p>
                                <p className="pl-2 text-gray-700 font-semibold text-lg ">Edit Nickname</p>
                            </div>

                        </div>
                    )}
                </div>
                {chat.group && (
                    <div className="mb-4">
                        <div className="p-2 flex items-center justify-between rounded hover:shadow-sm hover:bg-white" onClick={handleToggleMembers}>
                            <p className="text-gray-700 font-semibold text-lg ">Members</p>
                            <p className="text-blue-500 cursor-pointer"> {showMembers ? (
                                <FaArrowUp />
                            ) : (
                                <FaArrowDown />
                            )}</p>
                        </div>
                        {showMembers && (
                            <div className='pl-2'>
                                {members && members.map((member, index) => (
                                    <div key={index} className="p-2 flex items-center justify-between rounded hover:shadow-sm hover:bg-white">
                                        <div className='flex flex-row'>
                                            <img src={`http://localhost:1105/api/v1/${member.image}`} alt="Chat" className="h-10 w-10 object-cover rounded-full" />
                                            <p className="pl-2 text-gray-700 font-semibold text-lg ">{member.username}</p>
                                        </div>
                                        <div>
                                            <button className='hover:bg-gray-200 rounded-full p-2' onClick={() => handleToggleMemberSetting(member)}>
                                                <p className="text-gray-700 text-xl"> <TbDots /></p>
                                            </button>
                                            {showMemberSetting && showMemberSetting.id === member.id && (
                                                <div className='absolute ' ref={memberSettingRef}>
                                                    <div className="p-2 flex items-center justify-start rounded shadow-sm bg-white" onClick={handleToggleMemberSetting}>
                                                        <p className="text-blue-500 text-xl"> <TbLetterCase /></p>
                                                        <p className="pl-2 text-gray-700 font-semibold text-lg ">Edit Nickname</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                <div className="mb-4">
                    <div className="p-2 flex items-center justify-between rounded hover:shadow-sm hover:bg-white" onClick={handleToggleFiles}>
                        <p className="text-gray-700 font-semibold text-lg ">Files</p>
                        <p className="text-blue-500 cursor-pointer"> {showFiles ? (
                            <FaArrowUp />
                        ) : (
                            <FaArrowDown />
                        )}</p>
                    </div>
                    {showFiles && (
                        <ChatFile userId={userId} chatId={chat.id} newMessage={newMessage} />
                    )}
                </div>
            </div>
        </div >
    );
};

export default ChatInfo;