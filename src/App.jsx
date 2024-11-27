import React, { useState, useEffect, createContext } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Logout from './Logout';
import Reset from './Reset';
import ResetPassword from './ResetPassword';
import MyProfile from './myprofile';
import FriendProfile from './FriendProfile';
import axios from 'axios';
import './App.css';
import menuImage from './assets/menu.png';
import unknownImage from './assets/unknown.png';
import Modal from 'react-modal';
import messageIcon from './assets/message.png';
import photoIcon from './assets/photo.png'; // Import photo icon
import videoIcon from './assets/video.png'; // Import video icon
import musicIcon from './assets/music.png'; // Import music icon
import homeIcon from './assets/home.png'; // home icon
import logoIcon from './assets/logo.png'; // logo icon
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();
Modal.setAppElement('#root');



function PrivateRoute({ children }) {
  const { isAuthenticated } = React.useContext(AuthContext);
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const [friends, setFriends] = useState([]);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState({});
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState({});
  const [friendRequestsSent, setFriendRequestsSent] = useState([]); 
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [postText, setPostText] = useState('');
  const [fileType, setFileType] = useState(null);
  const [file, setFile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [mediaModalContent, setMediaModalContent] = useState(null);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  
  const openPostModal = () => setIsPostModalOpen(true);
  const closePostModal = () => setIsPostModalOpen(false);

  //for showing media content in modal in left side media buttons
  const fetchMedia = async (mediaType) => {
    try {
      let endpoint = '';
      if (mediaType === 'music') {
        endpoint = 'http://localhost:5000/api/music';
      } else if (mediaType === 'video') {
        endpoint = 'http://localhost:5000/api/video';
      } else if (mediaType === 'photo') {
        endpoint = 'http://localhost:5000/api/photo';
      }
  
      const response = await axios.get(endpoint, {
        withCredentials: true,
      });
  
      console.log("Fetched data:", response.data);
  
      // Set the media content and type directly in the state
      setMediaModalContent({
        type: mediaType,
        data: response.data,
      });
  
      // Open the modal
      setIsMediaModalOpen(true);
    } catch (error) {
      console.error(`Error fetching ${mediaType}:`, error);
    }
  };  
  
  // Handle text input change
  const handleTextChange = (e) => {
    setPostText(e.target.value);
  };

  // Handle file type selection
  const handleFileTypeSelect = (type) => {
    setFileType(type);
    setFile(null); // Reset file when changing file type
  };

  // Handle file input change
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Handle post submission
  const handlePostSubmit = async () => {
    if (!postText && !file) {
      alert('Please add some text or a file.');
      return;
    }

    const formData = new FormData();
    formData.append('postText', postText);
    if (file) {
      formData.append('file', file);
    }

    try {
      const response = await axios.post('http://localhost:5000/api/uploadpost', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        withCredentials: true,
      });

      alert('Post uploaded successfully!');
      closePostModal();
      setPostText('');
      setFile(null);
      setFileType(null);
    } catch (error) {
      console.error('Error uploading post:', error);
      alert('Error uploading post. Please try again.');
    }
  };

  useEffect(() => {
    const container = document.querySelector('.messages-container');
    if (container) {
      container.scrollTop = container.scrollHeight; // Auto-scroll to the bottom
    }
  }, [messages]);
  
  // Fetch posts from the server
  const fetchPosts = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/posts', {
        withCredentials: true, // Ensure credentials are sent with the request if needed
      });
      setPosts(response.data); // Store posts in state
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
  };

  // UseEffect to fetch posts on mount and every 5 seconds
  useEffect(() => {
    if (isAuthenticated) {
      fetchPosts(); // Initial fetch on mount

      // Set interval to fetch posts every 5 seconds
      const intervalId = setInterval(() => {
        fetchPosts();
      }, 10000); // 5000 milliseconds = 5 seconds

      // Cleanup interval on component unmount
      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated]); // Fetch posts only when authenticated

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await axios.get('http://localhost:5000/', { withCredentials: true });
        if (response.data.isAuthenticated) {
          setIsAuthenticated(true);
          setUser(response.data.user);
          setFriends(response.data.friends);
          localStorage.setItem('friends', JSON.stringify(response.data.friends));
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setFriends([]);
          localStorage.removeItem('friends');
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        const storedFriends = localStorage.getItem('friends');
        if (storedFriends) {
          setFriends(JSON.parse(storedFriends));
        }
      }
    };
    checkSession();
  }, []);

  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      setError('Please enter a search term.');
      return;
    }
    try {
      const response = await axios.get('http://localhost:5000/api/search', {
        params: { q: searchTerm },
        withCredentials: true,
      });
      setSearchResults(response.data.results);
      setIsModalOpen(true);
      setError('');
    } catch (err) {
      console.error('Error during search:', err);
      setError('An error occurred while searching. Please try again.');
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Open the message modal and fetch the messages for that friend
  const openMessageModal = async (friendId) => {
    setIsMessageModalOpen((prev) => ({ ...prev, [friendId]: true }));

    // Fetch messages when opening the modal
    try {
      const response = await axios.get(`http://localhost:5000/api/messages`, {
        params: { friendId },
        withCredentials: true,
      });
      setMessages((prev) => ({ ...prev, [friendId]: response.data }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      alert('Failed to load messages. Please try again.');
    }
  };

  const closeMessageModal = (friendId) => {
    setIsMessageModalOpen(prev => ({ ...prev, [friendId]: false }));
  };

  const sendMessage = async (receiverId) => {
    const messageData = {
      messageDate: new Date().toISOString(),
      message: messageText,
      senderId: user.id,
      receiverId: receiverId,
    };
  
    try {
      // Send the message to the backend
      await axios.post('http://localhost:5000/api/messages', messageData, { withCredentials: true });
  
      // Update the messages state locally (without closing the modal)
      setMessages((prevMessages) => ({
        ...prevMessages,
        [receiverId]: [...(prevMessages[receiverId] || []), messageData],
      }));
  
      // Clear the message input field
      setMessageText('');
  
      // Keep the modal open or reopen it immediately
      setIsMessageModalOpen((prev) => ({ ...prev, [receiverId]: false }));
      setIsMessageModalOpen((prev) => ({ ...prev, [receiverId]: true }));
  
      // Fetch the latest messages (this will ensure the messages are up-to-date)
      openMessageModal(receiverId); // This will refetch messages for the friend
  
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const sendFriendRequest = async (friendId) => {
    try {
      console.log('Sending friend request to:', friendId);
      console.log('User ID:', user.id);  // Ensure user.id is correct
  
      const response = await axios.post('http://localhost:5000/api/addfriend', {
        id_user: user.id,
        id_friend: friendId,
      });
  
      if (response.data.success) {
        alert(response.data.message);
  
        // Check if the request was accepted or just sent
        if (response.data.accepted) {
          alert('Friend request accepted!');
        }
  
        // Update the state to track which requests have been sent
        setFriendRequestsSent((prev) => [...prev, friendId]);
  
        // Update the friends list in state
        setFriends(response.data.friends);  // Update friends from API response
      } else {
        // Check if user_request exists in the response to determine if the request was already sent
        if (response.data.user_request === 1) {
          alert('Friend request already sent.');
        } else {
          alert('Error: ' + response.data.message);
        }
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Request already sent !');
    }
  };  

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated, user, setUser, setFriends }}>
      <Router>
        <div className="App">
          <Routes>
            <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login />} />
            <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/reset" element={<Reset />} />
            <Route path="/myprofile" element={<MyProfile />} />
            <Route path="/resetpassword/:userId" element={<ResetPassword />} />
            <Route path="/friend/:id" element={<FriendProfile />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <header>
                    <table style={{ width: '100%', height: '50px' }}>
                      <tbody>
                        <tr>
                          <td style={{ height: '20%', width: '100%', backgroundColor: 'lightblue' }}>
                            <table style={{ width: '100%', textAlign: 'center' }}>
                              <tbody>
                                <tr>
                                  <td style={{ width: '10%', height: '100%' }}>
                                    <img src={logoIcon} alt="Logo" />
                                  </td>
                                  <td style={{ width: '3%', height: '100%' }}>
                                    <img
                                      className="topbar-image"
                                      src={
                                        user?.photo && user.photo.trim() !== ''
                                          ? `http://localhost:5000${user.photo}`
                                          : unknownImage
                                      }
                                      alt={`${user?.firstname} ${user?.lastname} profile picture`}
                                    />
                                  </td>
                                  <td style={{ width: '5%', height: '100%' }}>
                                    <div>
                                      {isAuthenticated ? (
                                        <span>
                                          {user?.firstname} {user?.lastname}
                                        </span>
                                      ) : (
                                        <span>Anonymous</span>
                                      )}
                                    </div>
                                  </td>
                                  <td style={{ width: '10%', height: '100%' }}>

                                  </td>
                                  <td style={{ width: '50%', height: '100%' }}>
                                    <form onSubmit={handleSearchSubmit}>
                                      <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Type here to search"
                                        className="search"
                                      />
                                      <input type="submit" value="OK" className="searchbtn" />
                                    </form>
                                    {error && <p className="error">{error}</p>}
                                  </td>
                                  <td style={{ width: '15%', height: '100%' }}>

                                  </td>
                                  <td style={{ width: '10%', height: '100%' }}>
                                    <div className="menu-container">
                                      <button className="menu-button">
                                        <img src={menuImage} alt="Menu" />
                                      </button>
                                      <div className="menu">
                                        <ul>
                                          {!isAuthenticated && (
                                            <>
                                              <a href="/login">
                                                <li>Login</li>
                                              </a>
                                              <a href="/register">
                                                <li>Register</li>
                                              </a>
                                            </>
                                          )}
                                          {isAuthenticated && (
                                            <>
                                              <li>
                                                <a href="/logout">Logout</a>
                                              </li>
                                              <li>
                                                <a href="/myprofile">Profile</a>
                                              </li>
                                            </>
                                          )}
                                        </ul>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </header>

                  {/* Scrollable Friends Section */}
                  <div className="scrollable-container">
                    <table className="homescreencontent">
                      <tbody>
                        <tr>
                          <td style={{ width: '10%' }}>
                            <div className="icon-buttons-container">
                              <br></br>
                              {/* Home Button */}
                              <button className="icon-button" onClick={() => (window.location.href = '/')}>
                                <img src={homeIcon} alt="Home" />
                              </button>
                              <br></br>                
                              {/* Music Button */}
                              <button className="icon-button" onClick={() => fetchMedia('music', 'music')}>
                                <img src={musicIcon} alt="Music" />
                              </button>
                              <br></br>            
                              {/* Video Button */}
                              <button className="icon-button" onClick={() => fetchMedia('video', 'video')}>
                                <img src={videoIcon} alt="Video" />
                              </button>
                              <br></br>            
                              {/* Photo Button */}
                              <button className="icon-button" onClick={() => fetchMedia('photo', 'photo')}>
                                <img src={photoIcon} alt="Photo" />
                              </button>
                            </div>

                            {/* Modal for displaying media */}
                            {isMediaModalOpen && mediaModalContent?.type === 'music' && (
                              <div className="media-modal">
                                <button className="close-mediamodal" onClick={() => setIsMediaModalOpen(false)}>
                                  &times; {/* This will display a "×" symbol for the close button */}
                                </button>
                                {mediaModalContent.data.map((item, index) => (
                                  <div key={index} className="media-item">
                                    {/* Display the post text before the media */}
                                    <p>{item.post}</p>  {/* This will show the post text */}

                                    {/* Display the music/audio content */}
                                    <audio controls>
                                      <source src={`http://localhost:5000${item.song}`} type="audio/mp3" />
                                    </audio>
                                  </div>
                                ))}
                              </div>
                            )}

                            {isMediaModalOpen && mediaModalContent?.type === 'video' && (
                              <div className="media-modal">
                                <button className="close-mediamodal" onClick={() => setIsMediaModalOpen(false)}>
                                  &times;
                                </button>
                                {mediaModalContent.data.map((item, index) => (
                                  <div key={index} className="media-item">
                                    {/* Display the post text before the media */}
                                    <p>{item.post}</p>  {/* This will show the post text */}

                                    {/* Display the video content */}
                                    <video controls>
                                      <source src={`http://localhost:5000${item.video}`} type="video/mp4" />
                                    </video>
                                  </div>
                                ))}
                              </div>
                            )}

                            {isMediaModalOpen && mediaModalContent?.type === 'photo' && (
                              <div className="media-modal">
                                <button className="close-mediamodal" onClick={() => setIsMediaModalOpen(false)}>
                                  &times;
                                </button>
                                {mediaModalContent.data.map((item, index) => (
                                  <div key={index} className="media-item">
                                    {/* Display the post text before the media */}
                                    <p>{item.post}</p>  {/* This will show the post text */}

                                    {/* Display the photo content */}
                                    <img src={`http://localhost:5000${item.photo}`} alt="Photo media" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </td>
                          <td style={{ width: '70%', backgroundColor: '#f8f8f8' }}>
                            <div className="scrollable-text">
                              <button onClick={openPostModal} className="open-post-modal-button">
                                + Add Post
                              </button>
                              <div className="posts-container">
                                {posts && posts.length > 0 ? (
                                  posts.map((post, index) => (
                                    <div key={index} className="post">
                                      {/* Poster photo and name */}
                                      <div className="post-header">
                                        <img
                                          src={`http://localhost:5000${post.posterPhoto}`}
                                          alt="Poster"
                                          className="poster-photo"
                                        />
                                        <h5 className="poster-name">{post.posterFirstname} {post.posterLastname}</h5>
                                      </div>

                                      <p>{post.post}<br></br><br></br></p>
                                      
                                      {/* Add other media types if they exist */}
                                      <div className="media-container">
                                        {post.song && (
                                          <audio controls>
                                            <source src={`http://localhost:5000${post.song}`} type="audio/mp3" />
                                          </audio>
                                        )}

                                        {post.video && (
                                          <video controls>
                                            <source src={`http://localhost:5000${post.video}`} type="video/mp4" />
                                          </video>
                                        )}
                                      </div>
                                      {post.photo && <img src={`http://localhost:5000${post.photo}`} alt="Post media" className="post-media-photo" />}
                                      <br></br>
                                      <small>{new Date(post.date).toLocaleString()}</small>
                                    </div>
                                  ))
                                ) : (
                                  <p>No posts to display.</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td style={{ width: '20%' }}>
                            <div className="scrollable-text">
                              <h3>Friends</h3>
                              <ul className="friend-list">
                                {friends && friends.length > 0 ? (
                                  friends.map((friend) => (
                                    <li key={friend.id} className="friend-item">
                                      <a href={`/friend/${friend.id}`} style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}>
                                        <img
                                          className="friend-image"
                                          src={friend.photo ? `http://localhost:5000${friend.photo}` : unknownImage}
                                          alt={`${friend.firstname} ${friend.lastname}`}
                                          style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px' }}
                                        />
                                        <div className="friend-info">
                                          <span>{friend.firstname} {friend.lastname}</span>
                                        </div>
                                      </a>
                                      <button
                                        onClick={() => openMessageModal(friend.id)}
                                        style={{
                                          backgroundColor: 'transparent',
                                          border: 'none',
                                          borderRadius: '50%',
                                          width: '50px', // Set width and height to the same value
                                          height: '50px',
                                          cursor: 'pointer',
                                          display: 'center',
                                          alignItems: 'center',
                                          justifyContent: 'center'
                                        }}
                                      >
                                        <img src={messageIcon} alt="Message" style={{ width: '40px', height: '40px', backgroundColor: 'transparent'}} />
                                      </button>
                                      {/* Message Modal */}
                                      {isMessageModalOpen[friend.id] && (
                                        <Modal
                                          isOpen={isMessageModalOpen[friend.id]}
                                          onRequestClose={() => closeMessageModal(friend.id)}
                                          contentLabel="Message"
                                          className="bottom-right-modal"
                                          overlayClassName="overlay"
                                        >
                                          <button onClick={() => closeMessageModal(friend.id)} className="close-button">
                                            &times;
                                          </button>
                                          <div className="modal-body">
                                            {/* Friend's Photo */}
                                            <div style={{ textAlign: 'center', marginBottom: '10px' }}>
                                              <img
                                                className="topbar-image"
                                                src={friend.photo && friend.photo.trim() !== ''
                                                  ? `http://localhost:5000${friend.photo}` // Assuming friend's photo path
                                                  : unknownImage} // Default image if no photo is available
                                                alt={`${friend.firstname} ${friend.lastname} profile`}
                                                style={{
                                                  width: '50px',
                                                  height: '50px',
                                                  borderRadius: '50%',
                                                  objectFit: 'cover',
                                                }}
                                              />
                                            </div>

                                            <h2 style={{ color: 'black' }}>Messages with {friend.firstname}</h2>

                                            {/* Messages Display */}
                                            <div
                                              className="messages-container"
                                              style={{
                                                width: '350px',
                                                maxHeight: '300px',
                                                overflowY: 'auto',
                                                marginBottom: '5px',
                                                textAlign: 'center',
                                              }}
                                            >
                                              {messages[friend.id] ? (
                                                <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black' }}>
                                                  <tbody>
                                                    {messages[friend.id].map((msg, index) => {
                                                      const senderName = msg.senderid === user.id ? `${user?.firstname}` : friend.firstname;
                                                      console.log('user.id', user.id);
                                                      console.log('msg.senderid', msg.senderid);
                                                      console.log('friend name', friend.firstname);
                                                      return (
                                                        <tr key={index}>
                                                          {/* Message Content */}
                                                          <td
                                                            style={{
                                                              textAlign: 'left',
                                                              padding: '8px',
                                                              maxWidth: '200px',
                                                              wordWrap: 'break-word',
                                                              overflowWrap: 'break-word',
                                                            }}
                                                          >
                                                            <p>
                                                              <strong>{senderName}: </strong>
                                                              {msg.message}
                                                            </p>
                                                          </td>

                                                          {/* Message Date */}
                                                          <td
                                                            style={{
                                                              textAlign: 'right',
                                                              color: 'grey',
                                                              fontSize: '10px',
                                                              padding: '8px',
                                                            }}
                                                          >
                                                            {msg.messagedate}
                                                          </td>
                                                        </tr>
                                                      );
                                                    })}
                                                  </tbody>
                                                </table>
                                              ) : (
                                                <p>No messages yet.</p>
                                              )}
                                            </div>

                                            {/* Message Input */}
                                            <input
                                              type="text"
                                              placeholder="Write your message here..."
                                              value={messageText}
                                              onChange={(e) => setMessageText(e.target.value)}
                                              className="messageinput"  /* Apply the messageinput class here */
                                            />
                                            <button onClick={() => sendMessage(friend.id)} style={{ marginTop: '10px' }}>
                                              Send
                                            </button>
                                          </div>
                                        </Modal>
                                      )}
                                    </li>
                                  ))
                                ) : (
                                  <li>No friends found.</li>
                                )}
                              </ul>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Search Results Modal */}
                  <Modal
                    isOpen={isModalOpen}
                    onRequestClose={closeModal}
                    contentLabel="Search Results"
                    className="modal"
                    overlayClassName="overlay"
                  >
                    <button onClick={closeModal} className="close-button">&times;</button>
                    {searchResults.length > 0 ? (
                      <div className="modal-body">
                        <table className="results-table">
                          <thead>
                            <tr>
                              <th>&nbsp;</th>
                              <th>First Name</th>
                              <th>Last Name</th>
                              <th>&nbsp;</th>
                            </tr>
                          </thead>
                          <tbody>
                            {searchResults.map((searchedUser) => (
                              <tr key={searchedUser.id}>
                                <td>
                                  <img
                                    className="topbar-image"
                                    src={searchedUser.photo && searchedUser.photo.trim() !== ''
                                      ? `http://localhost:5000${searchedUser.photo}`
                                      : unknownImage}
                                    alt={`${searchedUser.firstname} ${searchedUser.lastname} profile`}
                                  />
                                </td>
                                <td>{searchedUser.firstname}</td>
                                <td>{searchedUser.lastname}</td>
                                <td>
                                  {searchedUser.user_request === 1 ? (
                                    <button disabled>Request Sent</button>
                                  ) : (
                                    <button onClick={() => sendFriendRequest(searchedUser.id)}>Link</button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="modal-body">
                        <p>No results found.</p>
                      </div>
                    )}
                  </Modal>
                  {/* Modal for Add Post */}
                  <Modal
                    isOpen={isPostModalOpen}
                    onRequestClose={closePostModal}
                    contentLabel="Add Post Modal"
                    className="post-modal"
                    overlayClassName="post-modal-overlay"
                  >
                    <h2>Add a New Post</h2>

                    {/* Post Text Input */}
                    <textarea
                      value={postText}
                      onChange={handleTextChange}
                      placeholder="What's on your mind?"
                      rows="4"
                      className="post-textarea"
                    ></textarea>

                    {/* File Type Selection */}
                    <div className="file-type-selection">
                      <div onClick={() => handleFileTypeSelect('image')} className="file-type-option">
                        <img src={photoIcon} alt="Add Image" className="file-type-icon" />
                        <span>Add Image</span>
                      </div>

                      <div onClick={() => handleFileTypeSelect('video')} className="file-type-option">
                        <img src={videoIcon} alt="Add Video" className="file-type-icon" />
                        <span>Add Video</span>
                      </div>

                      <div onClick={() => handleFileTypeSelect('music')} className="file-type-option">
                        <img src={musicIcon} alt="Add Music" className="file-type-icon" />
                        <span>Add Music</span>
                      </div>
                    </div>

                    {/* File Upload Input */}
                    {fileType === 'image' && (
                      <div className="file-upload-input">
                        <label htmlFor="uploadImage">Upload Image:</label>
                        <input type="file" id="uploadImage" onChange={handleFileChange} accept="image/*" />
                      </div>
                    )}
                    {fileType === 'video' && (
                      <div className="file-upload-input">
                        <label htmlFor="uploadVideo">Upload Video:</label>
                        <input type="file" id="uploadVideo" onChange={handleFileChange} accept="video/*" />
                      </div>
                    )}
                    {fileType === 'music' && (
                      <div className="file-upload-input">
                        <label htmlFor="uploadMusic">Upload Music:</label>
                        <input type="file" id="uploadMusic" onChange={handleFileChange} accept="audio/*" />
                      </div>
                    )}

                    {/* Upload and Cancel Buttons */}
                    <div className="modal-buttons">
                      <button onClick={handlePostSubmit}>Upload</button>
                      <button onClick={closePostModal} className="cancel-button">Cancel</button>
                    </div>
                  </Modal>
                </PrivateRoute>
              }
            />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App
