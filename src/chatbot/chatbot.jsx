import React, { useEffect, useState } from "react";
import png from '../../src/admin/assets/chatbot.png';
import sci from '../../src/admin/assets/science (1).png';
import axios from "axios";
import { connect } from 'react-redux';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from "react-router-dom";
import { updateChatbotLink } from '../state/action';

const Chat = () => {
  // State variables
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState('');
  const [userId, setUserId] = useState('');

  // Hooks
  const { adminId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Component lifecycle methods
  useEffect(() => {
    fetchChatbotLinks();
  }, [dispatch, navigate, adminId]);

  


  const fetchChatbotLinks = async () => {
    try {
      const response = await fetch('https://chatbotserver1.onrender.com/admins', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch admins');
      }

      const resData = await response.json();
      const chatbotLinks = resData.admins.reduce((acc, admin) => {
        acc[admin._id] = admin.chatbot_link;
        return acc;
      }, {});

      dispatch(updateChatbotLink(chatbotLinks));

      const chatbotLink = chatbotLinks[adminId];
      if (!chatbotLink) {
        navigate('/error');
      } else {
        let chatbotWindow = window.open(chatbotLink, '_blank');
        if (chatbotWindow) {
          chatbotWindow.focus();
        } else {
          console.error('Unable to open chatbot window');
        }
      }
    } catch (error) {
      console.error(error);
      navigate('/error');
    }
  };

  // Send message
  const handleSendMessage = async () => {
    try {
      // Handling user name
      if (userName === '') {
        const isNameMessage = newMessage.trim().toLowerCase().includes('my name is');
        if (isNameMessage) {
          const extractedName = newMessage.trim().toLowerCase().replace('my name is', '').trim();
          setUserName(extractedName);
          setUserId(generateUserId());
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: `Nice to meet you, ${extractedName}! How can I help you?`, sender: 'bot', time: getTime() },
          ]);
          setNewMessage('');
          return;
        } else {
          setMessages((prevMessages) => [
            ...prevMessages,
            { text: "I'd love to know your name! Please tell me your name by saying 'My name is [your name]'.", sender: 'bot', time: getTime() },
          ]);
          setNewMessage('');
          return;
        }
      }

      // Send message to server
      const currentTime = getTime();
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: newMessage, sender: 'user', time: currentTime },
      ]);

      setMessages((prevMessages) => [
        ...prevMessages,
        { text: 'Typing...', sender: 'bot', time: getTime() },
      ]);
      setLoading(true);

      const response = await axios.post(
        `https://chatbotserver1.onrender.com/chat?q=${encodeURIComponent(newMessage)}&admin_id=${adminId}`,
        { message: newMessage, userId: userId, userName: userName }
      );

      if (!response.data) {
        throw new Error('Empty response');
      }

      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        { text: response.data.message, sender: 'bot', time: getTime() },
      ]);

      const chatContainer = document.getElementById('chat-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }

      setNewMessage('');
    } catch (error) {
      console.error('Error fetching chat response:', error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: 'Error fetching chat response. Please try again.', sender: 'bot', time: getTime() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Other helper functions
  const getTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const generateUserId = () => {
    return Math.random().toString(36).substring(2, 10);
  };

  const getBackgroundColor = (message) => {
    if (message && message.text) {
      if (message.text.includes('Error')) {
        return 'bg-red-300';
      } else if (message.text.includes('Recommendation')) {
        return 'bg-green-300';
      }
      return 'bg-gradient-to-tr from-blue-500 to-indigo-500 text-white';
    } else {
      return 'bg-white text-black ';
    }
  };


  // Rendering
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="p-5 gap-4 bg-gradient-to-tr from-blue-500 to-indigo-500 flex">
        <div className="w-[60px] flex justify-center items-center h-[60px]">
          <img className="w-full" src={png} alt="img" />
        </div>
        <div className="text-white">
          <h1>Hii {userName}</h1>
          <span>i'm here to help, so if you have any question, go ahead and ask me!</span>
        </div>
      </div>
      {/* Chat container */}
      {/* // Inside the Chat component's return statement */}
      <div id="chat-container" className="flex-1 overflow-y-auto bg-slate-100 p-4" style={{scrollbarWidth: 'none'}}>
        {messages.map((message, index) => (
          <div key={index} className={`mb-2 flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="w-auto flex">
              {message.sender === 'bot' && (
                <div className="flex items-center justify-center w-10 h-10">
                  <img src={sci} alt="Chatbot Logo" className="h-7 w-7" />
                </div>
              )}
              <div className={`p-2 w-full flex flex-col ml-2 rounded-lg ${message.sender === 'user' ? 'bg-white text-black' : getBackgroundColor(message)}`}>
                {/* Check if message.text is an array of objects */}
                {Array.isArray(message.text) ? (
                  // Render each product's details
                  message.text.map((product, idx) => (
                    <div className="flex" key={idx}>
                      <div>
                        {product.Number}.
                      </div>
                      <div>
                        <p><strong>Product Name:</strong> {product.ProductName}</p>
                        <p><strong>Price:</strong> {product.Price}</p>
                        <p><strong>Description:</strong> {product.Description}</p>
                        <br />
                      </div>
                    </div>
                  ))
                ) : (
                  // Render message.text as is if it's not an array
                  <span className="w-full inline-flex">{message.text}</span>
                )}
                {/* Render the time */}
                <span className="text-xs">{message.time}</span>
              </div>
            </div>
          </div>
        ))}
        {loading && <p className="text-gray-500 text-center">Loading...</p>}
      </div>

      {/* Message input */}
      <div className="p-4 flex items-center bg-slate-100">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-md mr-2"
        />
        <button onClick={handleSendMessage} className="px-4 py-2 bg-gradient-to-tr from-blue-500 to-indigo-500 text-white rounded-md">
          Send
        </button>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  adminId: state.adminId,
});

export default connect(mapStateToProps)(Chat);
