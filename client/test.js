const axios = require('axios');

(async () => {
  try {
    // 1️⃣ Login request
    const loginResponse = await axios.post(
      'http://localhost:8081/auth/logIn',
      {
        username: 'mohammad',
        password: '1qaz!QAZ'
      },
      {
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json'
        }
      }
    );

    // 2️⃣ Extract cookie from login response
    const cookies = loginResponse.headers['set-cookie']; // This will be an array
    console.log(JSON.stringify(loginResponse.headers))
    
    const cookieHeader = cookies.join('; '); // Merge cookies if there are multiple

    // 3️⃣ Send task creation request with cookie
    const taskResponse = await axios.post(
      'http://localhost:8081/task/item',
      {
        itemType: 'Task',
        itemTitle: 'Design database schema',
        deadline: '2025-08-15 17:00:00',
        status: 'Backlog',
        priority: 'High',
        category: 'backend',
        shareWith: [
          {
            username: 'ali',
            accessibility: 'viewer'
          }
        ],
        backlog: [
          'Q3-backlog',
          'tech-debt',
          'feature-requests'
        ]
      },
      {
        headers: {
          'accept': '*/*',
          'Content-Type': 'application/json',
          'Cookie': cookieHeader // 👈 Attach the cookie here
        }
      }
    );

    console.log(taskResponse.data);

  } catch (error) {
    console.error(error.response?.data || error.message);
  }
})();
