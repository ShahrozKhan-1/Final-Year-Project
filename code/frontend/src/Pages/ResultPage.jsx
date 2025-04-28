// src/pages/ResultPage.jsx

import React, { useEffect, useState } from 'react';
import { fetchTestAttemptFeedback } from '../Components/testApi' // Adjust the import path as necessary

function ResultPage({ testAttemptId }) {
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    async function loadFeedback() {
      const data = await fetchTestAttemptFeedback(testAttemptId);
      setFeedback(data.ai_feedback);
    }
    loadFeedback();
  }, [testAttemptId]);

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Test Analysis</h1>

      {feedback ? (
        <div className="bg-white shadow-md rounded-lg p-6">
          <pre className="whitespace-pre-wrap">{feedback}</pre>
        </div>
      ) : (
        <p>Loading analysis...</p>
      )}
    </div>
  );
}

export default ResultPage;
