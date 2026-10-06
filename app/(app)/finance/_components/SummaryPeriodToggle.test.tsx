import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { SummaryPeriodToggle } from './SummaryPeriodToggle';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPush = jest.fn();
let mockSearch = '';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(mockSearch),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockSearch = '';
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SummaryPeriodToggle', () => {
  it('marks only the current period as pressed', () => {
    render(<SummaryPeriodToggle current="month" />);
    expect(screen.getByRole('button', { name: 'Month' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Day' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'FY' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('pushes the selected period to the URL without scrolling', async () => {
    const user = userEvent.setup();
    render(<SummaryPeriodToggle current="month" />);

    await user.click(screen.getByRole('button', { name: 'FY' }));

    expect(mockPush).toHaveBeenCalledWith('?period=fy', { scroll: false });
  });

  it('preserves other search params', async () => {
    mockSearch = 'foo=bar&period=month';
    const user = userEvent.setup();
    render(<SummaryPeriodToggle current="month" />);

    await user.click(screen.getByRole('button', { name: 'Day' }));

    expect(mockPush).toHaveBeenCalledWith('?foo=bar&period=day', { scroll: false });
  });
});
