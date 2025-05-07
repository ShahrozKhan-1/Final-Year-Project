// src/pages/SessionResultPage.jsx
import React from "react";
import { useParams } from "react-router-dom";
import SessionResultChart from "../Components/SessionResultChart";

const SessionResultPage = () => {
  const { sessionId } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Session Results</h1>
      <SessionResultChart sessionId={sessionId} />
    </div>
  );
};

export default SessionResultPage;
