import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import ErrorBoundary from './ErrorBoundary';

function Broken() {
  throw new Error('drawing failed');
}

afterEach(() => {
  vi.restoreAllMocks();
});

test('a failure anywhere leaves a way out, not a blank page', () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  render(<ErrorBoundary isFullPage><Broken /></ErrorBoundary>);
  expect(screen.getByRole('alert')).toHaveClass('page-error--full');
  expect(screen.getByRole('heading', { name: "Sorry — this page didn't load properly" })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Reload the page' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/');
});

test('with nothing wrong, it shows the page itself', () => {
  render(<ErrorBoundary><p>The puppies</p></ErrorBoundary>);
  expect(screen.getByText('The puppies')).toBeInTheDocument();
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
