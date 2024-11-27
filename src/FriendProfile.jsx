import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import unknownImage from './assets/unknown.png'; // Placeholder image
import './MyProfile.css'; // Ensure you import the CSS file

function FriendProfile() {
  const { id } = useParams(); // Get the friend ID from the route params
  const [friendData, setFriendData] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchFriendData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/friends/${id}`, { withCredentials: true });
        setFriendData(response.data);
      } catch (err) {
        console.error('Error fetching friend data:', err);
        setError('Could not load friend profile.');
      }
    };

    fetchFriendData();
  }, [id]);

  const handleDelete = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/deletefriend/${id}`, { withCredentials: true });
      alert('Friend deleted successfully.');
      navigate('/'); // Redirect to the friends list or another page after deletion
    } catch (err) {
      console.error('Error deleting friend:', err);
      setError('Could not delete friend.');
    }
  };

  if (error) {
    return <p>{error}</p>;
  }

  const bodyStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    margin: '0',
    backgroundColor: 'white',
  };

  const cardStyle = {
    padding: '20px',
    maxWidth: '400px', // Adjust as needed
    backgroundColor: '#e4e4e4', // Light background for the card
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
    textAlign: 'center',
  };

  return (
    <div style={bodyStyle}>
      <div style={cardStyle}>
        {friendData ? (
          <div>
            <img
              className="friend-photo" // Apply the custom class here
              src={friendData.photo ? `http://localhost:5000${friendData.photo}` : unknownImage}
              alt={`${friendData.firstname} ${friendData.lastname}`}
            />
            <h2 style={{ color: 'black' }}>{friendData.firstname} {friendData.lastname}</h2>
            <p>Email: {friendData.email}</p>
            <p><strong>Country:</strong> {friendData.country || 'N/A'}</p>
            <p><strong>Phone Number:</strong> {friendData.phonenumber || 'N/A'}</p>
            {/* Delete Button */}
            <button 
              onClick={handleDelete} 
              style={{ backgroundColor: 'red', color: 'white', padding: '10px 20px', borderRadius: '5px', marginTop: '10px', cursor: 'pointer' }}
            >
              Delete
            </button>
          </div>
        ) : (
          <p>Loading...</p>
        )}
      </div>
    </div>
  );
}

export default FriendProfile;
