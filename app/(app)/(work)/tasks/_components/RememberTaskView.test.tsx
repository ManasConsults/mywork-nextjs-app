import { render } from '@testing-library/react';

import { RememberTaskView } from './RememberTaskView';

afterEach(() => {
  document.cookie = 'taskView=; path=/tasks; max-age=0';
});

describe('RememberTaskView', () => {
  it('records the board view in the taskView cookie scoped to /tasks', () => {
    const cookieSetter = jest.spyOn(document, 'cookie', 'set');

    render(<RememberTaskView view="board" />);

    expect(cookieSetter).toHaveBeenCalledWith(
      'taskView=board; path=/tasks; max-age=31536000; samesite=lax',
    );
    cookieSetter.mockRestore();
  });

  it('overwrites the cookie when the view changes', () => {
    const cookieSetter = jest.spyOn(document, 'cookie', 'set');

    const { rerender } = render(<RememberTaskView view="board" />);
    rerender(<RememberTaskView view="list" />);

    expect(cookieSetter).toHaveBeenLastCalledWith(
      'taskView=list; path=/tasks; max-age=31536000; samesite=lax',
    );
    cookieSetter.mockRestore();
  });

  it('renders nothing', () => {
    const { container } = render(<RememberTaskView view="list" />);
    expect(container).toBeEmptyDOMElement();
  });
});
