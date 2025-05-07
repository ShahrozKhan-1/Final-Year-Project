import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const TeacherTest = () => {
  const [testData, setTestData] = useState(null);
  const [updatedQuestions, setUpdatedQuestions] = useState([]);
  const [newQuestions, setNewQuestions] = useState([]);
  const [deleteQuestionIds, setDeleteQuestionIds] = useState([]);
  const [newQuestionInput, setNewQuestionInput] = useState({
    content: '',
    question_type: 'MCQ',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: '',
    marks: 1,
  });
  const [activeTab, setActiveTab] = useState('existing');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { testId } = useParams();

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`http://127.0.0.1:8000/api/tests/${testId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTestData(response.data);
        setUpdatedQuestions(response.data.questions || []);
      } catch (error) {
        console.error('Error fetching test:', error);
      }
    };
    fetchTest();
  }, [testId]);

  const handleQuestionUpdate = (questionId, field, value) => {
    setUpdatedQuestions(prev =>
      prev.map(q => (q.id === questionId ? { ...q, [field]: value } : q))
    );
  };

  const handleNewQuestionInputChange = (field, value) => {
    setNewQuestionInput(prev => ({ ...prev, [field]: value }));
  };

  const addNewQuestion = () => {
    if (!newQuestionInput.content.trim()) return;
    
    setNewQuestions(prev => [...prev, newQuestionInput]);
    setNewQuestionInput({
      content: '',
      question_type: 'MCQ',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: '',
      marks: 1,
    });
  };

  const handleDeleteQuestion = (questionId) => {
    setDeleteQuestionIds(prev => [...prev, questionId]);
    setUpdatedQuestions(prev => prev.filter(q => q.id !== questionId));
  };

  const handleSaveTest = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const data = {
        questions: updatedQuestions,
        delete_questions: deleteQuestionIds,
        new_questions: newQuestions,
      };

      await axios.patch(`http://127.0.0.1:8000/api/tests/${testId}/`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Error updating test:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!testData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-blue-400 h-12 w-12"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-blue-400 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-blue-400 rounded"></div>
              <div className="h-4 bg-blue-400 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 mb-8 border border-blue-100"
      >
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-1">{testData.title}</h1>
            <p className="text-lg text-gray-600 mb-4">{testData.description}</p>
            <div className="flex items-center text-sm text-gray-500">
              <span className="mr-4">Time Limit: {testData.time_limit_minutes} mins</span>
              <span>Total Marks: {updatedQuestions.reduce((sum, q) => sum + q.marks, 0)}</span>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setActiveTab('existing')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                activeTab === 'existing'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Existing Questions
            </button>
            <button
              onClick={() => setActiveTab('new')}
              className={`px-4 py-2 rounded-lg transition-all duration-300 ${
                activeTab === 'new'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Add Questions
            </button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {activeTab === 'existing' && (
          <motion.div
            key="existing"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {updatedQuestions.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="text-gray-400 mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-16 w-16 mx-auto"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-500">No questions available</h3>
                <p className="text-gray-400">Click "Add Questions" to create new ones</p>
              </motion.div>
            ) : (
              updatedQuestions.map((q, index) => (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-300"
                >
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center mb-3">
                        <span className="bg-blue-100 text-blue-800 text-sm font-medium mr-2 px-2.5 py-0.5 rounded-full">
                          {q.question_type === 'MCQ' ? 'MCQ' : 'Q&A'}
                        </span>
                        <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
                          {q.marks} mark{q.marks !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-red-400 hover:text-red-600 transition-colors duration-200 p-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>

                    <textarea
                      value={q.content}
                      onChange={(e) => handleQuestionUpdate(q.id, 'content', e.target.value)}
                      placeholder="Question content"
                      className="w-full p-3 border border-gray-200 rounded-lg mb-4 focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-200"
                      rows={2}
                    />

                    {q.question_type === 'MCQ' ? (
                      <div className="space-y-3 ml-2">
                        {['A', 'B', 'C', 'D'].map((option) => (
                          <div key={option} className="flex items-center">
                            <label className="flex items-center w-full group">
                              <input
                                type="radio"
                                name={`correct-${q.id}`}
                                checked={q.correct_option === option}
                                onChange={() => handleQuestionUpdate(q.id, 'correct_option', option)}
                                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-full transition-all duration-200"
                              />
                              <input
                                type="text"
                                value={q[`option_${option.toLowerCase()}`]}
                                onChange={(e) =>
                                  handleQuestionUpdate(q.id, `option_${option.toLowerCase()}`, e.target.value)
                                }
                                placeholder={`Option ${option}`}
                                className={`ml-3 flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-200 ${
                                  q.correct_option === option
                                    ? 'border-green-400 bg-green-50'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                              />
                            </label>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="ml-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expected Answer
                        </label>
                        <textarea
                          value={q.correct_option}
                          onChange={(e) => handleQuestionUpdate(q.id, 'correct_option', e.target.value)}
                          placeholder="Expected answer"
                          className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-200"
                          rows={3}
                        />
                      </div>
                    )}

                    <div className="flex items-center mt-4">
                      <label className="block text-sm font-medium text-gray-700 mr-3">Marks:</label>
                      <input
                        type="number"
                        min="1"
                        value={q.marks}
                        onChange={(e) => handleQuestionUpdate(q.id, 'marks', parseInt(e.target.value))}
                        className="w-20 p-2 border border-gray-200 rounded-lg focus:ring-blue-300 focus:border-blue-500 transition-all duration-200"
                      />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'new' && (
          <motion.div
            key="new"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-5">Create New Question</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                  <select
                    value={newQuestionInput.question_type}
                    onChange={(e) => handleNewQuestionInputChange('question_type', e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="MCQ">Multiple Choice (MCQ)</option>
                    <option value="Q&A">Question & Answer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marks</label>
                  <input
                    type="number"
                    min="1"
                    value={newQuestionInput.marks}
                    onChange={(e) => handleNewQuestionInputChange('marks', parseInt(e.target.value))}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-200"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Content</label>
                <textarea
                  value={newQuestionInput.content}
                  onChange={(e) => handleNewQuestionInputChange('content', e.target.value)}
                  placeholder="Enter your question here..."
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-200 min-h-[100px]"
                  rows={3}
                />
              </div>

              {newQuestionInput.question_type === 'MCQ' ? (
                <div className="mt-4 space-y-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                  {['A', 'B', 'C', 'D'].map((option) => (
                    <div key={option} className="flex items-center">
                      <label className="flex items-center w-full group">
                        <input
                          type="radio"
                          name="new-correct"
                          checked={newQuestionInput.correct_option === option}
                          onChange={() => handleNewQuestionInputChange('correct_option', option)}
                          className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded-full transition-all duration-200"
                        />
                        <input
                          type="text"
                          value={newQuestionInput[`option_${option.toLowerCase()}`]}
                          onChange={(e) =>
                            handleNewQuestionInputChange(`option_${option.toLowerCase()}`, e.target.value)
                          }
                          placeholder={`Option ${option}`}
                          className={`ml-3 flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-200 ${
                            newQuestionInput.correct_option === option
                              ? 'border-green-400 bg-green-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expected Answer</label>
                  <textarea
                    value={newQuestionInput.correct_option}
                    onChange={(e) => handleNewQuestionInputChange('correct_option', e.target.value)}
                    placeholder="Enter the expected answer..."
                    className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-500 transition-all duration-200 min-h-[100px]"
                    rows={3}
                  />
                </div>
              )}

              <button
                onClick={addNewQuestion}
                disabled={!newQuestionInput.content.trim()}
                className={`mt-6 w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                  newQuestionInput.content.trim()
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
                    : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                }`}
              >
                Add Question
              </button>
            </div>

            {newQuestions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-green-500 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Questions Ready to Add ({newQuestions.length})
                </h4>
                <div className="space-y-3">
                  {newQuestions.map((q, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                    >
                      <div>
                        <p className="font-medium text-gray-800 line-clamp-1">{q.content}</p>
                        <p className="text-sm text-gray-500">
                          {q.question_type} • {q.marks} mark{q.marks !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => setNewQuestions(prev => prev.filter((_, i) => i !== index))}
                        className="text-red-400 hover:text-red-600 transition-colors duration-200 p-1"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 flex justify-end"
      >
        <button
          onClick={handleSaveTest}
          disabled={isSaving}
          className={`relative overflow-hidden px-6 py-3 rounded-lg font-medium text-white shadow-lg transition-all duration-300 ${
            isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-xl'
          }`}
        >
          {isSaving ? (
            <>
              <span className="inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            </>
          ) : (
            'Save All Changes'
          )}
        </button>

        <AnimatePresence>
          {saveSuccess && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="ml-4 flex items-center bg-green-100 border border-green-200 text-green-700 px-4 py-2 rounded-lg"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-2"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Changes saved successfully!
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default TeacherTest;