import React, { useState } from 'react';
import axios from 'axios';

const PracticeTest = () => {
  const [topic, setTopic] = useState('');
  const [file, setFile] = useState(null);
  const [mcqCount, setMcqCount] = useState(2);
  const [qnaCount, setQnaCount] = useState(2);
  const [difficulty, setDifficulty] = useState('easy');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('access_token');

  const handleGenerate = async () => {
    setLoading(true);
    const formData = new FormData();

    if (topic) formData.append('prompt_text', topic);
    if (file) formData.append('file', file);
    formData.append('mcq_count', parseInt(mcqCount));
    formData.append('qna_count', parseInt(qnaCount));
    formData.append('difficulty', difficulty);

    try {
      const res = await axios.post(
        'http://127.0.0.1:8000/practice/generate-questions/',
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setQuestions(res.data.questions || []);
      setAnswers({});
      setResult(null);
      setSubmitted(false);
    } catch (err) {
      console.error('❌ Error:', err.response?.data || err.message);
      alert('Something went wrong while generating questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionIndex, value) => {
    setAnswers((prev) => ({ ...prev, [questionIndex]: value }));
  };

  const handleSubmit = async () => {
    const payload = {
      questions: questions.map((q, index) => ({
        ...q,
        question_type: q.option_a ? "MCQ" : "QNA",
        student_answer: answers[index] || "",
        correct_answer: q.answer || q.correct_option,
        content: q.question || q.content,
      })),
    };

    try {
      const res = await axios.post(
        'http://127.0.0.1:8000/practice/check/',
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setResult(res.data);
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting answers:", error);
      alert('Failed to submit answers.');
    }
  };

  const renderResultItem = (item, index) => {
    const isCorrect = item.is_correct;
    return (
      <div key={index} className={`mb-6 p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-start">
          <span className={`mr-2 mt-1 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
            {isCorrect ? '✓' : '✗'}
          </span>
          <div className="flex-1">
            <h3 className="font-medium text-gray-800">{item.question}</h3>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-semibold">Your answer:</span> 
                <span className={`ml-1 ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                  {item.student_answer || 'No answer provided'}
                </span>
              </div>
              {!isCorrect && (
                <div>
                  <span className="font-semibold">Correct answer:</span> 
                  <span className="ml-1 text-green-600">{item.correct_answer}</span>
                </div>
              )}
            </div>
            {item.feedback && (
              <div className="mt-2 text-sm text-gray-600">
                <span className="font-semibold">Feedback:</span> {item.feedback}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-700">Practice Test</h1>

      {!questions.length && (
        <div className="bg-white shadow-md rounded-lg p-6 space-y-4 border">
          <input
            type="text"
            placeholder="Enter a topic (or upload file)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:ring-blue-300"
          />
          <input
            type="file"
            onChange={(e) => setFile(e.target.files[0])}
            className="w-full file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:bg-blue-600 file:text-white rounded-md"
          />
          <div className="flex gap-4">
            <input
              type="number"
              value={mcqCount}
              onChange={(e) => setMcqCount(Number(e.target.value))}
              placeholder="MCQs"
              className="w-1/2 p-3 border rounded-lg focus:outline-none"
            />
            <input
              type="number"
              value={qnaCount}
              onChange={(e) => setQnaCount(Number(e.target.value))}
              placeholder="QnAs"
              className="w-1/2 p-3 border rounded-lg focus:outline-none"
            />
          </div>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
          <button
            onClick={handleGenerate}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Questions'}
          </button>
        </div>
      )}

      {questions.length > 0 && !submitted && (
        <div className="mt-8 space-y-6">
          {questions.map((q, idx) => (
            <div key={idx} className="bg-white border shadow-sm rounded-xl p-6 space-y-3">
              <p className="font-medium text-lg text-gray-800">
                {idx + 1}. {q.question || q.content}
              </p>

              {q.option_a ? (
                <div className="space-y-2">
                  {['a', 'b', 'c', 'd'].map((opt, i) => {
                    const key = `option_${opt}`;
                    return (
                      q[key] && (
                        <label
                          key={key}
                          className="flex items-center p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="radio"
                            name={`question-${idx}`}
                            value={q[key]}
                            onChange={(e) => handleAnswerChange(idx, opt)}
                            className="mr-2"
                          />
                          <span className="font-medium">
                            {String.fromCharCode(65 + i)}. {q[key]}
                          </span>
                        </label>
                      )
                    );
                  })}
                </div>
              ) : (
                <textarea
                  rows={4}
                  onChange={(e) => handleAnswerChange(idx, e.target.value)}
                  className="w-full border rounded-lg p-3 focus:outline-none focus:ring focus:ring-blue-300"
                  placeholder="Write your answer here..."
                />
              )}
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={Object.keys(answers).length !== questions.length}
            className={`w-full text-white font-semibold py-3 rounded-lg ${
              Object.keys(answers).length === questions.length 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Submit Answers
          </button>
        </div>
      )}

      {result && (
        <div className="mt-10 space-y-6">
          <div className="bg-white shadow-md rounded-xl p-6 border border-blue-200">
            <h2 className="text-2xl font-bold text-blue-700 mb-4">Test Results</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-blue-700">
                  {result.score_breakdown?.mcq?.correct || 0}/{result.score_breakdown?.mcq?.total || 0}
                </div>
                <div className="text-sm text-blue-600">MCQ Score</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-700">
                  {result.score_breakdown?.mcq?.percentage ? `${result.score_breakdown.mcq.percentage}%` : 'N/A'}
                </div>
                <div className="text-sm text-green-600">Percentage</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg text-center">
                <div className="text-3xl font-bold text-purple-700">
                  {result.suggested_topics?.length || 0}
                </div>
                <div className="text-sm text-purple-600">Areas to Improve</div>
              </div>
            </div>

            {result.overall_feedback && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0 text-yellow-500">💡</div>
                  <div className="ml-3 whitespace-pre-line">{result.overall_feedback}</div>
                </div>
              </div>
            )}

            <h3 className="text-xl font-semibold mb-4 text-gray-800">Question Breakdown</h3>
            <div className="space-y-4">
              {result.results?.map(renderResultItem)}
            </div>

            {result.suggested_topics?.length > 0 && (
              <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-gray-800">Suggested Study Topics</h3>
                <div className="flex flex-wrap gap-2">
                  {result.suggested_topics.map((topic, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setQuestions([]);
              setResult(null);
              setSubmitted(false);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg"
          >
            Start New Test
          </button>
        </div>
      )}
    </div>
  );
};

export default PracticeTest;