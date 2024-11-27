import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './MyProfile.css';
import unknownImage from './assets/unknown.png';

const MyProfile = () => {
  const [profileData, setProfileData] = useState(null);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('No file chosen');
  const [showEditModal, setShowEditModal] = useState(false);
  const [updatedProfile, setUpdatedProfile] = useState({});

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/myprofile', { withCredentials: true });
        setProfileData(response.data);
        setUpdatedProfile(response.data.user);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };
    fetchProfileData();
  }, []);

  const upload = async () => {
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    const formData = new FormData();
    formData.append('profilePic', file);
    formData.append('id', profileData?.user?.id);

    try {
      const response = await axios.post('http://localhost:5000/api/upload-profile-pic', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true,
      });
      setProfileData((prevData) => ({
        ...prevData,
        user: { ...prevData.user, photo: response.data.photo },
      }));
      alert('Photo uploaded successfully!');
      setFileName('No file chosen');
      setFile(null);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Error uploading file. Please try again.');
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setFileName(selectedFile ? selectedFile.name : 'No file chosen');
  };

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleModalClose = () => {
    setShowEditModal(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUpdatedProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    try {
      await axios.put('http://localhost:5000/api/update-profile', updatedProfile, { withCredentials: true });
      setProfileData((prevData) => ({
        ...prevData,
        user: updatedProfile,
      }));
      alert('Profile updated successfully!');
      handleModalClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  };

  const profile = profileData?.user;

  const bodyStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    margin: '0',
    backgroundColor: 'white',
  };

  return (
    <div style={bodyStyle}>
      <div className="my-profile-container">
        {profile ? (
          <div className="profile-content">
            <img 
              className="profile-photo" 
              src={profile.photo && profile.photo.trim() !== '' ? `http://localhost:5000${profile.photo}` : unknownImage} 
              alt="Profile" 
            />
            <p style={{ color: 'black', fontSize: '16px' }}>Change profile picture</p>
            <p style={{ color: 'grey', fontSize: '12px' }}>
              <input 
                type="file" 
                id="file-input"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <button className="select-photo-button" onClick={() => document.getElementById('file-input').click()}>Select Photo</button>
              {fileName}
              <button className="select-photo-button" type="button" onClick={upload}>OK</button>
            </p>
            <p><strong>First Name:</strong> {profile.firstname}</p>
            <p><strong>Last Name:</strong> {profile.lastname}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Country:</strong> {profile.country}</p>
            <p><strong>Age:</strong> {profile.age}</p>
            <p><strong>Phone Number:</strong> {profile.phonenumber}</p>
            <button type="button" onClick={handleEditClick}>Edit Information</button>
          </div>
        ) : (
          <p>Loading profile data...</p>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="modal">
          <div className="modal-content">
            <span className="close" onClick={handleModalClose}>&times;</span>
            <h2>Edit User Information</h2>
            <table>
              <tbody>
                <tr>
                  <td><label htmlFor="firstname">First Name:</label></td>
                  <td>
                    <input
                      type="text"
                      id="firstname"
                      name="firstname"
                      value={updatedProfile.firstname || ''}
                      onChange={handleInputChange}
                      placeholder="First Name"
                    />
                  </td>
                </tr>
                <tr>
                  <td><label htmlFor="lastname">Last Name:</label></td>
                  <td>
                    <input
                      type="text"
                      id="lastname"
                      name="lastname"
                      value={updatedProfile.lastname || ''}
                      onChange={handleInputChange}
                      placeholder="Last Name"
                    />
                  </td>
                </tr>
                <tr>
                  <td><label htmlFor="age">Age:</label></td>
                  <td>
                    <input
                      type="number"
                      id="age"
                      name="age"
                      value={updatedProfile.age || ''}
                      onChange={handleInputChange}
                      placeholder="Age"
                    />
                  </td>
                </tr>
                <tr>
                  <td><label htmlFor="gender">Gender:</label></td>
                  <td>
                    <select 
                      id="gender"
                      name="gender" 
                      value={updatedProfile.gender || ''} 
                      onChange={handleInputChange}
                    >
                      <option value="" disabled>Select Gender</option>
                      <option value="1">Male</option>
                      <option value="2">Female</option>
                      <option value="3">Other</option>
                    </select>
                  </td>
                </tr>
                <tr>
                  <td><label htmlFor="phonenumber">Phone Number:</label></td>
                  <td>
                    <input
                      type="tel"
                      id="phonenumber"
                      name="phonenumber"
                      value={updatedProfile.phonenumber || ''}
                      onChange={handleInputChange}
                      placeholder="Phone Number"
                    />
                  </td>
                </tr>
                <tr>
                  <td><label htmlFor="email">Email:</label></td>
                  <td>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={updatedProfile.email || ''}
                      onChange={handleInputChange}
                      placeholder="Email"
                    />
                  </td>
                </tr>
                <tr>
                  <td><label htmlFor="country">Country:</label></td>
                  <td>
                    <input
                      type="text"
                      id="country"
                      name="country"
                      value={updatedProfile.country || ''}
                      onChange={handleInputChange}
                      placeholder="Country"
                    />
                  </td>
                </tr>
                <tr>
                  <td><label htmlFor="oldPassword">Old Password:</label></td>
                  <td>
                    <input
                      type="password"
                      id="oldPassword"
                      name="oldPassword"
                      value={updatedProfile.oldPassword || ''}
                      onChange={handleInputChange}
                      placeholder="Old Password"
                    />
                  </td>
                </tr>
                <tr>
                  <td><label htmlFor="newPassword">New Password:</label></td>
                  <td>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={updatedProfile.newPassword || ''}
                      onChange={handleInputChange}
                      placeholder="New Password"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
            <button type="button" onClick={handleSubmit}>Save Changes</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
