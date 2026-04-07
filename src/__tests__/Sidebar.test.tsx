import { render, screen, fireEvent } from "@testing-library/react";
import Sidebar from "@/components/Sidebar";

describe("Sidebar", () => {
  const mockSetActiveTab = jest.fn();

  test("renders menu items correctly", () => {
    render(<Sidebar activeTab="translator" setActiveTab={mockSetActiveTab} />);
    expect(screen.getByText("Translator")).toBeInTheDocument();
    expect(screen.getByText("OCR Scanner")).toBeInTheDocument();
    expect(screen.getByText("History")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
  });

  test("calls setActiveTab when a menu item is clicked", () => {
    render(<Sidebar activeTab="translator" setActiveTab={mockSetActiveTab} />);
    const scannerButton = screen.getByText("OCR Scanner").closest("button");
    if (scannerButton) {
      fireEvent.click(scannerButton);
      expect(mockSetActiveTab).toHaveBeenCalledWith("scanner");
    }
  });

  test("collapses when the collapse button is clicked", () => {
    render(<Sidebar activeTab="translator" setActiveTab={mockSetActiveTab} />);
    const collapseButton = screen.getByText("Collapse").closest("button");
    if (collapseButton) {
      fireEvent.click(collapseButton);
      // Wait for re-render if necessary, but here we check for the absence of labels
      expect(screen.queryByText("Collapse")).not.toBeInTheDocument();
    }
  });
});
