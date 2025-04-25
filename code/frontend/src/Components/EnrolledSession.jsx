// EnrolledSession.jsx
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const EnrolledSession = ({ session }) => {
  const [tests, setTests] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTests = async () => {
      const token = localStorage.getItem('access_token');
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/sessions/${session.id}/tests/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setTests(response.data);
      } catch (error) {
        console.error('Error fetching tests:', error);
      }
    };

    fetchTests();
  }, [session.id]);

  const handleAttemptClick = (testId) => {
    navigate(`/student/attempt-test/${testId}`);
  };

  return (
    <div className="bg-white shadow-md rounded-xl p-4">
      <h2 className="text-xl font-semibold">{session.session_name}</h2>
      <p>{session.description}</p>
      <h3 className="mt-4 font-medium">Available Tests:</h3>
      <ul className="mt-2 space-y-2">
        {tests.length === 0 ? (
          <li>No tests available yet.</li>
        ) : (
          tests.map((test) => (
            <li key={test.id} className="border p-2 rounded">
              <div className="flex justify-between items-center">
                <span className="font-medium">{test.title}</span>
                <button
                  onClick={() => handleAttemptClick(test.id)}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Attempt Test
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default EnrolledSession;
