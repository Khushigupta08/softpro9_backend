const axios = require('axios');
const baseURL = 'http://localhost:5000';

const testCourse = {
  title: 'Test Web Development Course',
  subtitle: 'Learn Web Development',
  category: 'web',
  description: 'A comprehensive web development course',
  duration: '3 months',
  instructor: 'John Doe',
  price: 999,
  discountPercent: 10,
  gstPercent: 18,
  mode: ['Online'],
  syllabus: [{
    module: 'HTML',
    topics: ['Basic HTML', 'Forms']
  }],
  features: ['Live Classes', '24/7 Support']
};

async function loginAndAddCourse() {
  try {
    // First login to get token
    const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
      username: 'Raghu',  // Using the existing admin user we saw in the logs
      password: '123456'  // Default password we saw being used
    });

    const token = loginResponse.data.token;
    console.log('Got auth token:', token);

    // Then use token to add course
    const courseResponse = await axios.post(`${baseURL}/api/courses`, testCourse, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Course added successfully:', courseResponse.data);
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response error:', error.response.data);
      console.error('Status code:', error.response.status);
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Request error - no response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
    }
  }
}

loginAndAddCourse();