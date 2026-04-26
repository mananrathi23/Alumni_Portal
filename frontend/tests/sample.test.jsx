import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

const TestComponent = () => <div>Hello, Automated Testing!</div>;

describe('Sample Frontend Test', () => {
  it('renders the test component correctly', () => {
    render(<TestComponent />);
    expect(screen.getByText('Hello, Automated Testing!')).toBeInTheDocument();
  });
});
