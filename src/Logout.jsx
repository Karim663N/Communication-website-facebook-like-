// src/Logout.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Perform the logout request when the component mounts
    fetch('http://localhost:5000/api/logout', {
      method: 'POST',
      credentials: 'include', // Include session cookie
    })
      .then((response) => {
        if (response.ok) {
          // Redirect to the login page after successful logout
          navigate('/login');  // Navigate to the login page
        } else {
          console.error('Failed to log out');
          // Optionally handle errors
        }
      })
      .catch((error) => {
        console.error('Error during logout:', error);
      });
  }, [navigate]);

  return (
    <div>
      <h1>Logging Out...</h1>
      <p>You are being logged out. Please wait a moment...</p>
    </div>
  );
};

export default Logout;
