"use client";

import React, { useContext, useEffect } from "react";
import { ChatPage } from "./components/ChatPage";
import { ChatPageErrorBoundary } from "./components/ChatPageErrorBoundary";
import {
  CoreAppDataContext,
  CoreAppDataProvider,
} from "./contexts/CoreAppDataContext";
import { GroupFeedbackExample } from "./components/examples/GroupFeedbackExample";

function ChatPageWrapper() {
  return <ChatPage />;
}
export default function RootLayout() {
  return (
    <CoreAppDataProvider>
      <div className="min-h-screen">
        <ChatPageWrapper />
      </div>
    </CoreAppDataProvider>
  );
}
