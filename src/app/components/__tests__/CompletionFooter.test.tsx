import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CompletionFooter } from "../CompletionFooter";

describe("CompletionFooter", () => {
  const mockOnStartNewSession = vi.fn();
  const mockOnRetry = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when status is not completed or error", () => {
    const { container } = render(
      <CompletionFooter
        status="ongoing"
        onStartNewSession={mockOnStartNewSession}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders completion state correctly", () => {
    render(
      <CompletionFooter
        status="completed"
        onStartNewSession={mockOnStartNewSession}
      />
    );

    expect(
      screen.getByText("Training session completed successfully!")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start new training session/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /retry/i })
    ).not.toBeInTheDocument();
  });

  it("renders error state correctly", () => {
    render(
      <CompletionFooter
        status="error"
        onStartNewSession={mockOnStartNewSession}
        onRetry={mockOnRetry}
      />
    );

    expect(
      screen.getByText("Training session encountered an error")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start new training session/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument();
  });

  it("renders error state without retry button when onRetry is not provided", () => {
    render(
      <CompletionFooter
        status="error"
        onStartNewSession={mockOnStartNewSession}
      />
    );

    expect(
      screen.getByText("Training session encountered an error")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /start new training session/i })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /retry/i })
    ).not.toBeInTheDocument();
  });

  it("calls onStartNewSession when start new session button is clicked", () => {
    render(
      <CompletionFooter
        status="completed"
        onStartNewSession={mockOnStartNewSession}
      />
    );

    fireEvent.click(
      screen.getByRole("button", { name: /start new training session/i })
    );
    expect(mockOnStartNewSession).toHaveBeenCalledTimes(1);
  });

  it("calls onRetry when retry button is clicked", () => {
    render(
      <CompletionFooter
        status="error"
        onStartNewSession={mockOnStartNewSession}
        onRetry={mockOnRetry}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
  });

  it("applies custom className", () => {
    const { container } = render(
      <CompletionFooter
        status="completed"
        onStartNewSession={mockOnStartNewSession}
        className="custom-class"
      />
    );

    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("shows correct button variants for different states", () => {
    const { rerender } = render(
      <CompletionFooter
        status="completed"
        onStartNewSession={mockOnStartNewSession}
      />
    );

    // Completed state should have default variant button
    let button = screen.getByRole("button", {
      name: /start new training session/i,
    });
    expect(button).toHaveClass("bg-primary"); // Default variant class

    rerender(
      <CompletionFooter
        status="error"
        onStartNewSession={mockOnStartNewSession}
        onRetry={mockOnRetry}
      />
    );

    // Error state should have secondary variant button
    button = screen.getByRole("button", {
      name: /start new training session/i,
    });
    expect(button).toHaveClass("bg-secondary"); // Secondary variant class
  });
});
