import axios from 'axios';

async function testColorEndpoint() {
  try {
    const response = await axios.get('http://localhost:3000/color', {
      params: { url: 'https://example.com' }
    });
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
  }
}

testColorEndpoint();
