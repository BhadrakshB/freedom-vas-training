"use client";

import { useState, useCallback } from "react";
import type { SessionConfiguration } from "../components/BulkSessionCreation";

const BULK_SESSION_CONSTANTS = {
    DEFAULT_SESSION_COUNT: 1,
    DEFAULT_GROUP_NAME_PREFIX: 'Training Group',
    MAX_SESSIONS: 20,
    MIN_SESSIONS: 1,
} as const;

// Type for better type safety
type BulkSessionState = {
    showBulkCreation: boolean;
    sessionCount: number;
    sessionConfigurations: SessionConfiguration[];
    groupName: string;
    isCreatingBulkSessions: boolean;
};

const createDefaultSessionConfig = (id: string, index: number): SessionConfiguration => ({
    id,
    title: `Session ${index}`,
    scenario: "",
    persona: ""
});

export function useBulkSessionCreation() {
    const [showBulkCreation, setShowBulkCreation] = useState(false);
    const [sessionCount, setSessionCount] = useState<number>(BULK_SESSION_CONSTANTS.DEFAULT_SESSION_COUNT);
    const [sessionConfigurations, setSessionConfigurations] = useState<SessionConfiguration[]>([
        createDefaultSessionConfig("1", 1)
    ]);
    const [groupName, setGroupName] = useState("");
    const [isCreatingBulkSessions, setIsCreatingBulkSessions] = useState(false);

    const handleSessionCountChange = useCallback((count: number) => {
        const validCount = Math.max(
            BULK_SESSION_CONSTANTS.MIN_SESSIONS,
            Math.min(BULK_SESSION_CONSTANTS.MAX_SESSIONS, count)
        );

        setSessionCount(validCount);

        const newConfigurations: SessionConfiguration[] = [];
        for (let i = 1; i <= validCount; i++) {
            const existingConfig = sessionConfigurations.find(
                (config) => config.id === i.toString()
            );
            newConfigurations.push(
                existingConfig || createDefaultSessionConfig(i.toString(), i)
            );
        }

        setSessionConfigurations(newConfigurations);
    }, [sessionConfigurations]);

    const handleConfigurationChange = useCallback((
        id: string,
        field: keyof SessionConfiguration,
        value: string
    ) => {
        setSessionConfigurations(prev =>
            prev.map(config =>
                config.id === id ? { ...config, [field]: value } : config
            )
        );
    }, []);

    const handleRemoveConfiguration = useCallback((id: string) => {
        setSessionConfigurations(prev => {
            if (prev.length <= 1) return prev;

            const newConfigs = prev.filter(config => config.id !== id);
            setSessionCount(newConfigs.length);
            return newConfigs;
        });
    }, []);

    const handleAddConfiguration = useCallback(() => {
        const newId = (sessionConfigurations.length + 1).toString();
        const newConfig = createDefaultSessionConfig(newId, sessionConfigurations.length + 1);

        setSessionConfigurations(prev => [...prev, newConfig]);
        setSessionCount(sessionConfigurations.length + 1);
    }, [sessionConfigurations.length]);

    const handleGroupNameChange = useCallback((name: string) => {
        setGroupName(name);
    }, []);

    const handleShowBulkCreation = useCallback(() => {
        setShowBulkCreation(true);
        // Set default group name if empty
        if (!groupName) {
            const defaultName = `${BULK_SESSION_CONSTANTS.DEFAULT_GROUP_NAME_PREFIX} - ${new Date().toLocaleDateString()}`;
            setGroupName(defaultName);
        }
    }, [groupName]);

    const handleCloseBulkCreation = useCallback(() => {
        setShowBulkCreation(false);
    }, []);

    const resetBulkSessionState = useCallback(() => {
        setShowBulkCreation(false);
        setSessionCount(BULK_SESSION_CONSTANTS.DEFAULT_SESSION_COUNT);
        setSessionConfigurations([createDefaultSessionConfig("1", 1)]);
        setGroupName("");
        setIsCreatingBulkSessions(false);
    }, []);

    return {
        // State
        showBulkCreation,
        sessionCount,
        sessionConfigurations,
        groupName,
        isCreatingBulkSessions,

        // Actions
        setIsCreatingBulkSessions,
        handleSessionCountChange,
        handleConfigurationChange,
        handleRemoveConfiguration,
        handleAddConfiguration,
        handleGroupNameChange,
        handleShowBulkCreation,
        handleCloseBulkCreation,
        resetBulkSessionState,
    };
}