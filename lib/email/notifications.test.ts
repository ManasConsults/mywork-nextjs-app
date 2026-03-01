import {
  sendRegistrationPendingEmail,
  sendAccountApprovedEmail,
  sendAccountRejectedEmail,
} from './notifications';

jest.mock('./resend', () => ({
  resend: { emails: { send: jest.fn() } },
}));

import { resend } from './resend';

const mockSend = (resend.emails as jest.Mocked<typeof resend.emails>).send;

const TO = 'user@example.com';
const NAME = 'Jane Doe';

beforeEach(() => {
  jest.clearAllMocks();
  mockSend.mockResolvedValue({ data: { id: 'email-id' }, error: null, headers: null } as never);
});

describe('sendRegistrationPendingEmail', () => {
  it('sends to the correct address with the correct subject', async () => {
    await sendRegistrationPendingEmail(TO, NAME);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: TO,
        subject: 'Your MyWork registration is under review',
      }),
    );
  });

  it('includes the user name in the email body', async () => {
    await sendRegistrationPendingEmail(TO, NAME);
    const call = mockSend.mock.calls[0][0] as { html: string };
    expect(call.html).toContain(NAME);
  });

  it('uses fallback greeting when name is null', async () => {
    await sendRegistrationPendingEmail(TO, null);
    const call = mockSend.mock.calls[0][0] as { html: string };
    expect(call.html).toContain('Hi there');
  });

  it('does not throw when send fails', async () => {
    mockSend.mockRejectedValue(new Error('Network error'));
    await expect(sendRegistrationPendingEmail(TO, NAME)).resolves.toBeUndefined();
  });
});

describe('sendAccountApprovedEmail', () => {
  it('sends to the correct address with the correct subject', async () => {
    await sendAccountApprovedEmail(TO, NAME);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: TO,
        subject: 'Your MyWork account has been approved',
      }),
    );
  });

  it('includes a sign-in link in the email body', async () => {
    await sendAccountApprovedEmail(TO, NAME);
    const call = mockSend.mock.calls[0][0] as { html: string };
    expect(call.html).toContain('/login');
  });

  it('does not throw when send fails', async () => {
    mockSend.mockRejectedValue(new Error('Network error'));
    await expect(sendAccountApprovedEmail(TO, NAME)).resolves.toBeUndefined();
  });
});

describe('sendAccountRejectedEmail', () => {
  it('sends to the correct address with the correct subject', async () => {
    await sendAccountRejectedEmail(TO, NAME);
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        to: TO,
        subject: 'Your MyWork registration was not approved',
      }),
    );
  });

  it('does not throw when send fails', async () => {
    mockSend.mockRejectedValue(new Error('Network error'));
    await expect(sendAccountRejectedEmail(TO, NAME)).resolves.toBeUndefined();
  });
});
