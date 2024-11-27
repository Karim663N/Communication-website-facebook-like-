import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';  // Import useParams
import './Login.css';

const ResetPassword = () => {
  const { userId } = useParams();  // Get userId from the URL parameter
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const navigate = useNavigate();

  const { password, confirmPassword } = formData;

  useEffect(() => {
    if (!userId) {
      alert('Invalid user ID');
      navigate('/login');  // Redirect if userId is not in URL
    }
  }, [userId, navigate]);

  const onChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/resetpassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password, userId }),  // Send the userId from the URL
        credentials: 'include',
      });

      if (response.ok) {
        alert('Password updated successfully.');
        navigate('/login');
      } else {
        const data = await response.json();
        alert(`Failed to update password: ${data.message}`);
      }
    } catch (error) {
      console.error('Error resetting password:', error.message);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <h2>Set New Password</h2>
      <form onSubmit={handleResetPassword}>
        <input
          type="password"
          name="password"
          placeholder="New Password"
          value={password}
          onChange={onChange}
          required
        />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={onChange}
          required
        />
        <input type="hidden" name="userId" value={userId} />
        
        <button type="submit" className="login-button">Update Password</button>
      </form>
    </div>
  );
};

export default ResetPassword;
