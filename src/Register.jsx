import React, { useState } from 'react';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    age: '',
    gender: '',
    phonenumber: '',
    email: '',
    password: '',
    confirmPassword: '',
    country: ''
  });

  const { firstname, lastname, age, gender, phonenumber, email, password, confirmPassword, country } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          firstname,
          lastname,
          age,
          gender,
          phonenumber,
          email,
          password,
          country
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert("Registration successful!");
        console.log("Registration successful:", data);
      } else if (response.status === 409) {
        alert("Registration failed: Email already exists");
      } else {
        console.error(`Registration failed with status ${response.status}: ${data.message}`);
        alert(`Registration failed: ${data.message}`);
      }
    } catch (error) {
      console.error("Error occurred during registration:", error.message);
      alert("An error occurred during registration. Please try again.");
    }
  };

  return (
    <div className="register-container">
      <h2>Register Page</h2>
      <form onSubmit={onSubmit}>
        <table className="register-table">
          <tbody>
            <tr>
              <td><label>Firstname: </label></td>
              <td>
                <input
                  type="text"
                  name="firstname"
                  value={firstname}
                  onChange={onChange}
                  maxLength="10"
                  required
                  className="register-input"
                />
              </td>
            </tr>
            <tr>
              <td><label>Lastname: </label></td>
              <td>
                <input
                  type="text"
                  name="lastname"
                  value={lastname}
                  onChange={onChange}
                  maxLength="10"
                  required
                  className="register-input"
                />
              </td>
            </tr>
            <tr>
              <td><label>Age: </label></td>
              <td>
                <input
                  type="number"
                  name="age"
                  value={age}
                  onChange={onChange}
                  max="999"
                  required
                  className="register-input"
                />
              </td>
            </tr>
            <tr>
              <td><label>Gender: </label></td>
              <td>
                <select name="gender" value={gender} onChange={onChange} required className="register-input">
                  <option value="" disabled>Select Gender</option>
                  <option value="1">Male</option>
                  <option value="2">Female</option>
                  <option value="3">Other</option>
                </select>
              </td>
            </tr>
            <tr>
              <td><label>Phone Number: </label></td>
              <td>
                <input
                  type="tel"
                  name="phonenumber"
                  value={phonenumber}
                  onChange={onChange}
                  maxLength="15"
                  required
                  className="register-input"
                />
              </td>
            </tr>
            <tr>
              <td><label>Email: </label></td>
              <td>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={onChange}
                  maxLength="100"
                  required
                  className="register-input"
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
                  maxLength="255"
                  required
                  className="register-input"
                />
              </td>
            </tr>
            <tr>
              <td><label>Confirm Password: </label></td>
              <td>
                <input
                  type="password"
                  name="confirmPassword"
                  value={confirmPassword}
                  onChange={onChange}
                  maxLength="255"
                  required
                  className="register-input"
                />
              </td>
            </tr>
            <tr>
              <td><label>Country: </label></td>
              <td>
                <input
                  type="text"
                  name="country"
                  value={country}
                  onChange={onChange}
                  maxLength="50"
                  required
                  className="register-input"
                />
              </td>
            </tr>
            <tr>
              <td colSpan="2" className="button-row">
                <button type="submit" className="register-button">Register</button>
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  );
}

export default Register;
