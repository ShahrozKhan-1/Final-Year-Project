import { useState } from "react";
import axios from "axios";

const CreateSession = ({ onClose, onSuccess }) => {
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
          description,
          start_time: startTime,
          end_time: endTime,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessage("✅ Session created successfully.");
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (error) {
      setMessage("❌ Error creating session.");
      console.error(error.response?.data || error);
    }
  };

  return (
    <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content shadow-lg rounded-4 border-0">

          {/* Modal Header with gradient */}
          <div
            className="modal-header text-white"
            style={{
              background: "linear-gradient(135deg, #0ea5e9, #14b8a6)",
              borderTopLeftRadius: "1rem",
              borderTopRightRadius: "1rem",
            }}
          >
            <h5 className="modal-title fw-bold">Create Session</h5>
            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
          </div>

          <form onSubmit={handleCreate}>
            <div className="modal-body bg-light">
              <div className="mb-3">
                <label className="form-label fw-semibold">Session Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter session name"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Description</label>
                <textarea
                  className="form-control"
                  placeholder="Describe the session"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">Start Time</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label fw-semibold">End Time</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>

              {message && (
                <div className="alert alert-info text-center py-2">{message}</div>
              )}
            </div>

            {/* Gradient Submit Button */}
            <div className="modal-footer border-0">
              <button
                type="submit"
                className="btn w-100 text-white fw-semibold"
                style={{
                  background: "linear-gradient(135deg, #0ea5e9, #14b8a6)",
                }}
              >
                Create Session
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default CreateSession;
