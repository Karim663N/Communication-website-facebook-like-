import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from './App';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const { username, password } = formData;
  const { setIsAuthenticated, setUser, setFriends } = useContext(AuthContext);
  const navigate = useNavigate();

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        alert('Login successful!');
        setIsAuthenticated(true);
        setUser(data.user);
        setFriends(data.friends);
        navigate('/');
      } else {
        alert(`Login failed: ${data.message}`);
        console.error('Login failed:', data.message);
      }
    } catch (error) {
      console.error('Error occurred during login:', error.message);
      alert('An error occurred during login. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <h2>Login Page</h2>
      <form onSubmit={handleLogin}>
        <table className="login-table">
          <tbody>
            <tr>
              <td><label>Email/Phone number: </label></td>
              <td>
                <input
                  type="text"
                  name="username"
                  value={username}
                  onChange={onChange}
                  required
                  className="login-input"
                />
              </td>
            </tr>
            <tr>
              <td><label>Password: </label></td>
              <td>
                <input
                  type="password"
                  name="password"
                  value={password}
                  onChange={onChange}
                  required
                  className="login-input"
                />
              </td>
            </tr>
            <tr>
              <td></td>
              <td className="button-row">
                <button type="submit" className="login-button">Login</button>
              </td>
            </tr>
            <tr>
              <td colSpan="2" style={{ textAlign: 'center' }}>
                Forgot your account?
                <br />Click <a href="/reset">here</a> to reset
                <br />Or <Link to="/register">create</Link> a new account
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  );
};

export default Login;
