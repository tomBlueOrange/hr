import { render, screen } from '@testing-library/react';
import App from './App';

// ChartsDemo renders Chart.js canvases, which jsdom can't paint.
// Stub it so this test exercises App's composition in isolation.
jest.mock('./ChartsDemo', () => () => <div data-testid="charts-demo" />);

test('renders the charts demo', () => {
  render(<App />);
  expect(screen.getByTestId('charts-demo')).toBeInTheDocument();
});
