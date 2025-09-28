"use client";

import { useCallback, useRef, useContext } from "react";
import { trainingContext } from "../contexts/TrainingContext";

export function useResizePanel() {
    const trainingCtx = useContext(trainingContext);
    const resizeRef = useRef<HTMLDivElement>(null);

    const panelWidth = trainingCtx.panelWidth;
    const isResizing = trainingCtx.isResizing;
    const setPanelWidth = trainingCtx.setPanelWidth;
    const setIsResizing = trainingCtx.setIsResizing;

    const handleMouseDown = useCallback(
        (e: React.MouseEvent) => {
            e.preventDefault();
            setIsResizing(true);
        },
        [setIsResizing]
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent) => {
            if (!isResizing) return;

            const containerRect =
                resizeRef.current?.parentElement?.getBoundingClientRect();
            if (!containerRect) return;

            const newWidth = containerRect.right - e.clientX;
            const minWidth = 280; // Minimum panel width
            const maxWidth = Math.min(600, containerRect.width * 0.6); // Maximum 60% of container width

            setPanelWidth(Math.max(minWidth, Math.min(maxWidth, newWidth)));
        },
        [isResizing, setPanelWidth]
    );

    const handleMouseUp = useCallback(() => {
        setIsResizing(false);
    }, [setIsResizing]);

    return {
        resizeRef,
        panelWidth,
        isResizing,
        handleMouseDown,
        handleMouseMove,
        handleMouseUp,
    };
}