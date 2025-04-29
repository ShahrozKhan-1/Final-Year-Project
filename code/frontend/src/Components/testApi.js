// testApi.js
export const fetchTestAttemptFeedback = async (attemptId) => {
  if (!attemptId) {
    throw new Error("Attempt ID is required");
  }
  
  const token = localStorage.getItem('access_token');
  const response = await axios.get(
    `http://127.0.0.1:8000/student/test-result/${attemptId}/`,  // Changed endpoint
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
  return response.data;
};  