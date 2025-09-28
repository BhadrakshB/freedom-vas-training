"use client";

import React, { useContext, useEffect } from "react";
import { ChatPage } from "./components/ChatPage";
import { TrainingProvider, trainingContext } from "./contexts/TrainingContext";

function ChatPageWrapper() {
  const trainingCtx = useContext(trainingContext);

  // Get or create active training session
  useEffect(() => {
    if (!trainingCtx.activeTrainingId) {
      const newId = trainingCtx.createTrainingState();
      trainingCtx.setActiveTrainingId(newId);
    }
  }, [trainingCtx]);

  return <ChatPage />;
}

export default function RootLayout() {
  return (
    <TrainingProvider>
      <div className="min-h-screen">
        <ChatPageWrapper />
      </div>
    </TrainingProvider>
  );
}
