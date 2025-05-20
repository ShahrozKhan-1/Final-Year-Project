import { useState } from "react";
import axios from "axios";
import { X } from "lucide-react";

const CreateSession = ({ onClose, onSuccess }) => {  // Receive props
  const [sessionName, setSessionName] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [message, setMessage] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");

    try {
      await axios.post(
        "http://127.0.0.1:8000/sessions/create/",
        {
          session_name: sessionName,
          description: description,
          start_time: startTime,
          end_time: endTime,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage("✅ Session created successfully.");
      setTimeout(() => {
        onSuccess();  // Use onSuccess instead of local state
      }, 1500);
    } catch (error) {
      setMessage("❌ Error creating session.");
      console.error(error.response?.data || error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative bg-white rounded-xl shadow-lg p-6 w-full max-w-md">
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-red-600"
          onClick={onClose} 
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold mb-4 text-blue-700 text-center">
          Create Session
        </h2>

        <form onSubmit={handleCreate} className="space-y-4">
          <input
            type="text"
            placeholder="Session Name"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border rounded px-3 py-2"
          ></textarea>
          <input
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          <input
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full border rounded px-3 py-2"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
          >
            Create Session
          </button>
        </form>

        {message && (
          <p className="mt-4 text-sm text-center text-gray-700">{message}</p>
        )}
      </div>
    </div>
  );
};

export default CreateSession;
