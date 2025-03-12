import { useState } from "react";
import axios from "axios";

const CreateSession = () => {
  const [sessionName, setSessionName] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [message, setMessage] = useState("");

  const handleCreate = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("access_token");
    try {
      const response = await axios.post(
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
      setMessage("Session created successfully.");
    } catch (error) {
      setMessage("Error creating session.");
      console.error(error.response?.data || error);
    }
  };

  return (
    <div>
      <h2>Create Session</h2>
      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Session Name"
          value={sessionName}
          onChange={(e) => setSessionName(e.target.value)}
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        ></textarea>
        <input
          type="datetime-local"
          placeholder="Start Time"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          required
        />
        <input
          type="datetime-local"
          placeholder="End Time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          required
        />
        <button type="submit">Create Session</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};

export default CreateSession;
