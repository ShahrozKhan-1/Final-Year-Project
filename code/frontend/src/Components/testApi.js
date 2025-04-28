// src/api/testApi.js

import axios from 'axios';

export async function fetchTestAttemptFeedback(testAttemptId) {
  const response = await axios.get(`http://127.0.0.1:8000/student/submit-test/${testAttemptId}/`);
  return response.data;
}
