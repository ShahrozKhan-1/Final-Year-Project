import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function AttemptedTestDetail() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem("access_token");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `http://127.0.0.1:8000/student/test-result/${attemptId}/`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        
        if (!data || !data.attempt_id) {
          throw new Error("Invalid test attempt data received");
        }

        console.log("Test attempt data:", data);
        setDetails(data);
        setError(null);
      } catch (error) {
        console.error("Fetch error:", error);
        setError(error.message || "Failed to load test details");
        setDetails(null);
      } finally {
        setLoading(false);
      }
    };

    if (attemptId) {
      fetchDetail();
    } else {
      setError("No attempt ID provided");
      setLoading(false);
    }
  }, [attemptId, token, navigate]);

  const handleBack = () => {
    navigate("/student/attempted-tests");
  };

  const formatFeedback = (feedback) => {
    if (!feedback) return null;
    return feedback.replace(/^Here is a [\w\s-]+ feedback based on the provided test result:\n\n/, "");
  };

  const renderQuestion = (question, index) => {
    if (question.question_type === 'MCQ') {
      return (
        <div key={index} className="border-b pb-4 last:border-b-0">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-medium text-gray-800">
              Q{index + 1}: {question.content}
            </h4>
            <span className={`px-2 py-1 text-xs rounded-full ${
              question.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {question.is_correct ? 'Correct' : 'Incorrect'}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            {['A', 'B', 'C', 'D'].map((option) => (
              <div 
                key={option}
                className={`p-3 rounded-lg border ${
                  question.correct_option === option 
                    ? 'bg-green-50 border-green-300' 
                    : question.student_answer === option 
                      ? 'bg-yellow-50 border-yellow-300' 
                      : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center">
                  <span className={`font-bold mr-2 ${
                    question.correct_option === option 
                      ? 'text-green-600' 
                      : question.student_answer === option 
                        ? 'text-yellow-600' 
                        : 'text-gray-500'
                  }`}>
                    {option})
                  </span>
                  <span>{question.options[option]}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
              <p className="font-medium text-yellow-700">Your Answer</p>
              <p>{question.student_answer || 'No answer provided'}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <p className="font-medium text-green-700">Correct Answer</p>
              <p>{question.correct_option}</p>
            </div>
          </div>

          {question.feedback && (
            <div className="mt-3 bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">{question.feedback}</p>
            </div>
          )}
        </div>
      );
    } else {
      // QNA Format
      return (
        <div key={index} className="border-b pb-4 last:border-b-0">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-medium text-gray-800">
              Q{index + 1}: {question.content}
            </h4>
            <span className={`px-2 py-1 text-xs rounded-full ${
              question.is_correct ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {question.is_correct ? 'Correct' : 'Incorrect'}
            </span>
          </div>

          <div className="space-y-3 mb-3">
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="font-medium text-yellow-700 mb-1">Your Answer</p>
              <p className="text-gray-800 whitespace-pre-line">
                {question.student_answer || 'No answer provided'}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="font-medium text-green-700 mb-1">Model Answer</p>
              <p className="text-gray-800 whitespace-pre-line">
                {question.model_answer}
              </p>
            </div>
          </div>

          {question.feedback && (
            <div className="mt-3 bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-700">{question.feedback}</p>
            </div>
          )}
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-500">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <button
          onClick={handleBack}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Attempted Tests
        </button>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <p className="text-gray-500">No test details available.</p>
        <button
          onClick={handleBack}
          className="mt-4 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Back to Attempted Tests
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <button
        onClick={handleBack}
        className="mb-6 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 flex items-center"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
            clipRule="evenodd"
          />
        </svg>
        Back to Attempts
      </button>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Test Attempt #{details.attempt_id}
            </h2>
            <p className="text-gray-600">Student: {details.student}</p>
          </div>
          <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-bold">
            Score: {details.score}%
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Test Information</h3>
            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-medium">Test ID:</span> {details.test_id || "N/A"}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Correct Answers:</span> {details.correct_answers}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Submitted At:</span>{" "}
                {details.submitted_at
                  ? new Date(details.submitted_at).toLocaleString()
                  : "N/A"}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">Performance Summary</h3>
            <div className="space-y-2">
              <p className="text-gray-600">
                <span className="font-medium">Marks Obtained:</span>{" "}
                {details.marks?.obtained || "N/A"} / {details.marks?.total || "N/A"}
              </p>
              <p className="text-gray-600">
                <span className="font-medium">Total Questions:</span>{" "}
                {details.questions?.length || "N/A"}
              </p>
              {details.weak_topics && details.weak_topics.length > 0 && (
                <div>
                  <p className="font-medium text-gray-600">Areas to Improve:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {details.weak_topics.map((topic, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {details.feedback && (
          <div className="mt-6 bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Overall Feedback</h3>
            <p className="text-gray-700 whitespace-pre-line">
              {formatFeedback(details.feedback)}
            </p>
          </div>
        )}

        {details.questions && details.questions.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Question Breakdown</h3>
            <div className="space-y-6">
              {details.questions.map((question, index) => renderQuestion(question, index))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}