import { describe, it, expect } from 'vitest';
import { renderWithProviders } from '../../utils';
import Instructions from '../../../pages/forecast/controls/Instructions';
import { screen } from '@testing-library/react';

describe("Instrucions Component", () => {
  it("should render Instructions component correctly", () => {
    renderWithProviders(<Instructions />);
    const dateRange = screen.getByText("1. Select date range")
    expect(dateRange).toBeInTheDocument();
  });
});