import React, { useEffect, useState } from 'react';
import { FaUserPlus, FaUsers, FaBell } from 'react-icons/fa';
import axios from 'axios';

async function fetchFriendRequests(userId) {
    try {
        const response = await axios.get(`http://localhost:1105/api/v1/friends/requests/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching friend requests:', error);
    }
}

async function acceptFriendRequest(userId, requestId) {
    try {
        axios.put(`http://localhost:1105/api/v1/friends/accept/${userId}/${requestId}`);
    } catch (error) {
        console.error('Error accepting friend request:', error);
    }
}

async function rejectFriendRequest(userId, requestId) {
    try {
        axios.put(`http://localhost:1105/api/v1/friends/reject/${userId}/${requestId}`);
    } catch (error) {
        console.error('Error rejecting friend request:', error);
    }
}

async function fetchFriends(userId) {
    try {
        const response = await axios.get(`http://localhost:1105/api/v1/friends/${userId}`);
        return response.data;
    } catch (error) {
        console.error('Error fetching friends:', error);
    }
}

async function createGroup(userId, groupName, memberIds) {
    try {
        const response = await axios.post(`http://localhost:1105/api/v1/chat/group/create`, {
            userId,
            groupName,
            participants: memberIds
        });
        console.log('Group created:', response);
    } catch (error) {
        console.error('Error creating group:', error);
    }
}

const Nav = ({ userId, handleFriendRequestAccept }) => {
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState(false);
    const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
    const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
    const [friends, setFriends] = useState([]);
    const [friendName, setFriendName] = useState('');
    const [selectedFriends, setSelectedFriends] = useState([]);
    const [groupName, setGroupName] = useState('');

    useEffect(() => {
        const fetchAndUpdateNotifications = async () => {
            const data = await fetchFriendRequests(userId);
            setNotifications(data);
        };

        fetchAndUpdateNotifications();

        const intervalId = setInterval(() => {
            fetchAndUpdateNotifications();
        }, 60000); // Fetch chats and notifications every 60 seconds

        return () => clearInterval(intervalId); // Cleanup interval on component unmount
    }, [userId]);

    useEffect(() => {
        const fetchAndSetFriends = async () => {
            const data = await fetchFriends(userId);
            setFriends(data);
        };

        if (isCreateGroupOpen) {
            fetchAndSetFriends();
        }
    }, [isCreateGroupOpen, userId]);

    const toggleNotificationDropdown = async () => {
        const data = await fetchFriendRequests(userId);
        setNotifications(data);
        setIsNotificationOpen(!isNotificationOpen);
    };

    const handleAcceptFriendRequest = async (notification) => {
        await acceptFriendRequest(userId, notification.requestId);
        setNotifications((prevNotifications) =>
            prevNotifications.filter(n => n.requestId !== notification.requestId)
        );
        await handleFriendRequestAccept(); // Ensure fetchChats updates after acceptance
    };

    const handleRejectFriendRequest = (requestId) => {
        rejectFriendRequest(userId, requestId).then(() => {
            setNotifications((prevNotifications) => prevNotifications.filter(notification => notification.requestId !== requestId));
        });
    };

    const toggleAddFriendPopup = () => {
        setIsAddFriendOpen(!isAddFriendOpen);
    };

    const toggleCreateGroupPopup = () => {
        setIsCreateGroupOpen(!isCreateGroupOpen);
    };

    const handleFriendSelection = (friendId) => {
        setSelectedFriends((prevSelected) =>
            prevSelected.includes(friendId)
                ? prevSelected.filter(id => id !== friendId)
                : [...prevSelected, friendId]
        );
    };

    const handleCreateGroup = () => {
        selectedFriends.push(userId);
        createGroup(userId, groupName, selectedFriends).then(() => {
            setIsCreateGroupOpen(false);
            setGroupName('');
            setSelectedFriends([]);
        });
    };

    const setFriend = (e) => {
        setFriendName(e.target.value);
    }

    const handleSendFriendRequest = () => {
        axios.post(`http://localhost:1105/api/v1/friends/add/${userId}`, { email: friendName });
        setIsAddFriendOpen(false);
        setFriendName('');
    };

    return (
        <div className="flex items-center mb-2 pt-2">
            <button className="flex items-center p-2 bg-blue-500 rounded-lg mr-2" onClick={toggleAddFriendPopup}>
                <FaUserPlus className="m-1" />
            </button>
            <button className="flex items-center p-2 bg-green-500 rounded-lg" onClick={toggleCreateGroupPopup}>
                <FaUsers className="m-1" />
            </button>
            <div className="relative p-2">
                <button
                    className={`flex items-center p-2 rounded-lg ml-auto ${notifications && notifications.length > 0 ? 'bg-red-500' : 'bg-gray-200'}`}
                    onClick={toggleNotificationDropdown}
                >
                    <FaBell className="m-1" />
                </button>
                {isNotificationOpen && (
                    <div className="absolute left-0 mt-2 w-80 bg-white border rounded-lg shadow-lg">
                        <ul className="p-2">
                            {notifications && notifications.length > 0 ? (
                                notifications.map(notification => (
                                    <li key={notification.requestId} className="flex w-80 items-center p-2 border-b">
                                        <img
                                            src={notification.image || 'default-avatar.png'}
                                            alt={`${notification.username}'s avatar`}
                                            className="w-10 h-10 rounded-full mr-2"
                                        />
                                        <div className="flex flex-col">
                                            <h2 className="text-lg font-semibold">{notification.username}</h2>
                                            <div className="flex items-center">
                                                <button className="bg-blue-500 text-white p-1 rounded-lg mr-2" onClick={() => handleAcceptFriendRequest(notification)}>Accept</button>
                                                <button className="bg-gray-300 text-white p-1 rounded-lg" onClick={() => handleRejectFriendRequest(notification.requestId)}>Reject</button>
                                            </div>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li className="p-2">No notifications</li>
                            )}
                        </ul>
                    </div>
                )}
            </div>
            {isAddFriendOpen && (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded-lg shadow-lg">
                        <h2 className="text-lg font-semibold mb-2">Add Friend</h2>
                        <input type="text" placeholder="Enter friend's email" className="border p-2 mb-2 w-full" onChange={setFriend} />
                        <button className="bg-blue-500 text-white p-2 rounded-lg w-full " onClick={handleSendFriendRequest}>Send Request</button>
                        <button className="mt-2 text-gray-500" onClick={toggleAddFriendPopup}>Cancel</button>
                    </div>
                </div>
            )}
            {isCreateGroupOpen && (
                <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50">
                    <div className="bg-white p-4 rounded-lg shadow-lg w-full max-w-md mx-auto">
                        <h2 className="text-lg font-semibold mb-2">Create Group</h2>
                        <input
                            type="text"
                            placeholder="Enter group name"
                            className="border p-2 mb-2 w-full"
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                        />
                        <div className="mb-2 max-h-60 overflow-y-auto">
                            {friends.map(friend => (
                                <div key={friend.id} className="flex items-center mb-1">
                                    <img
                                        src={`http://localhost:1105/api/v1/${friend.image}`}
                                        alt={`${friend.username}'s avatar`}
                                        className="w-10 h-10 rounded-full mr-2"
                                    />
                                    <p className="flex-1">{friend.username}</p>
                                    <input
                                        type="checkbox"
                                        className="mr-2"
                                        checked={selectedFriends.includes(friend.id)}
                                        onChange={() => handleFriendSelection(friend.id)}
                                    />
                                </div>
                            ))}
                        </div>
                        <button className="bg-green-500 text-white p-2 rounded-lg w-full mb-2" onClick={handleCreateGroup}>Create Group</button>
                        <button className="text-gray-500 w-full" onClick={toggleCreateGroupPopup}>Cancel</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Nav;