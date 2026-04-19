'use client';

import { useState, useTransition } from 'react';

import { updateProfileAction } from '@/lib/actions/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProfileFormProps {
  initialName: string | null;
  initialImage: string | null;
  email: string;
}

export function ProfileForm({ initialName, initialImage, email }: ProfileFormProps): React.JSX.Element {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(initialName ?? '');
  const [image, setImage] = useState(initialImage ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>): void {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateProfileAction({
        name: name.trim() || null,
        image: image.trim() || null,
      });
      if (!result.success) {
        setError(result.error.message);
      } else {
        setSuccess(true);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-md border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-primary">
          Profile updated successfully.
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label>Email</Label>
        <Input type="email" value={email} disabled />
        <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Display name</Label>
        <Input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder="Your name"
          disabled={isPending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="image">Avatar URL</Label>
        <Input
          id="image"
          type="url"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          placeholder="https://example.com/avatar.jpg"
          disabled={isPending}
        />
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt="Avatar preview"
            className="mt-2 h-12 w-12 rounded-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save profile'}
        </Button>
      </div>
    </form>
  );
}
