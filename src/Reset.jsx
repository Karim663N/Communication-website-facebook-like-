import React, { useState } from 'react';
import './Login.css';
import './ResetPassword';

const Reset = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false); // For handling loading state

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true); // Set loading to true when the request starts

    try {
      const response = await fetch('http://localhost:5000/api/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username }),
      });

      const data = await response.json(); // Always parse the response as JSON

      if (response.ok) {
        alert('Reset link has been sent to your email.');
      } else {
        alert(`Reset failed: ${data.message}`);
      }
    } catch (error) {
      console.error('Error during reset request:', error.message);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false); // Set loading to false after the request completes
    }
  };

  return (
    <div className="login-container">
      <h2>Reset Password</h2>
      <form onSubmit={handleReset}>
        <table className="login-table">
          <tbody>
            <tr>
              <td><label>Email/Phone number: </label></td>
              <td>
                <input
                  type="text"
                  name="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="login-input"
                />
              </td>
              <td>&nbsp;</td>
              <td className="button-row">
                <button type="submit" className="login-button" disabled={loading}>
                  {loading ? 'Sending...' : 'Reset'}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  );
};

export default Reset;
