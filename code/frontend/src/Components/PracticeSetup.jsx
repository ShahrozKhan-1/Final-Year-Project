import React, { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

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

  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

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
      console.log("Result:", res.data);
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
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.3, delay: index * 0.1 }}
        key={index}
        className={`mb-6 p-4 rounded-lg border ${isCorrect ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
      >
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
      </motion.div>
    );
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={fadeUp}
      transition={{ duration: 0.6 }}
      className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8"
    >
      <h1 className="text-3xl font-bold text-center mb-8 text-blue-700">Practice Test</h1>

      {!questions.length && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.5 }}
          className="bg-white shadow-md rounded-lg p-6 space-y-4 border"
        >
          <input
            type="text"
            placeholder="Enter a topic or leave blank to upload file"
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
              placeholder="Number of MCQs"
              className="w-1/2 p-3 border rounded-lg focus:outline-none"
            />
            <input
              type="number"
              value={qnaCount}
              onChange={(e) => setQnaCount(Number(e.target.value))}
              placeholder="Number of QnAs"
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
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-all"
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate Questions'}
          </button>
        </motion.div>
      )}

      {questions.length > 0 && !submitted && (
        <div className="mt-8 space-y-6">
          {questions.map((q, idx) => (
            <motion.div
              key={idx}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.3, delay: idx * 0.1 }}
              className="bg-white border shadow-sm rounded-xl p-6 space-y-3"
            >
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
                            onChange={() => handleAnswerChange(idx, opt)}
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
            </motion.div>
          ))}

          <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={handleSubmit}
            disabled={Object.keys(answers).length !== questions.length}
            className={`w-full text-white font-semibold py-3 rounded-lg transition-all ${
              Object.keys(answers).length === questions.length 
                ? 'bg-green-600 hover:bg-green-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Submit Answers
          </motion.button>
        </div>
      )}

            {submitted && result && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          transition={{ duration: 0.5 }}
          className="mt-10 bg-white border rounded-xl p-6 shadow-sm"
        >
          <h2 className="text-2xl font-bold mb-4 text-green-700">Test Results</h2>
          
          <p className="text-md mb-6 text-gray-700">
            <strong>Feedback:</strong> {result.overall_feedback}
          </p>
          

          {result.results.map((item, index) => (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.3, delay: index * 0.1 }}
              key={index}
              className={`mb-6 p-4 rounded-lg border ${
                item.is_correct ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-start">
                <span
                  className={`mr-2 mt-1 ${
                    item.is_correct ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {item.is_correct ? '✓' : '✗'}
                </span>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">{item.question}</h3>

                  {item.question_type === 'MCQ' ? (
                    <div className="mt-2 text-sm space-y-1">
                      <div>
                        <strong>Your answer:</strong>{' '}
                        <span
                          className={
                            item.is_correct ? 'text-green-600' : 'text-red-600'
                          }
                        >
                          {item.student_answer}
                        </span>
                      </div>
                      {!item.is_correct && (
                        <div>
                          <strong>Correct answer:</strong>{' '}
                          <span className="text-green-600">{item.correct_option}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-2 text-sm space-y-1">
                      <div>
                        <strong>Your answer:</strong>{' '}
                        <span className="text-gray-700">{item.student_answer}</span>
                      </div>
                      <div>
                        <strong>Expected answer:</strong>{' '}
                        <span className="text-green-600">{item.correct_answer}</span>
                      </div>
                    </div>
                  )}

                  {item.feedback && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Feedback:</strong> {item.feedback}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          <div className="mt-6">
            <h3 className="font-semibold text-gray-700 mb-2">Suggested Topics for Improvement:</h3>
            <ul className="list-disc list-inside text-sm text-gray-600">
              {result.suggested_topics.map((topic, i) => (
                <li key={i}>{topic}</li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default PracticeTest;
