import React from 'react';
import { Button, Icons, Input, Label, ToggleGroup, ToggleGroupItem } from '@ohif/ui-next';

/**
 * Spectra: makes a share link for the study open in the viewer. It works until the time chosen
 * and, when a password is set, asks for it before opening. The gateway behind `endpoint` turns
 * this visit into the person who opened it, so the link reaches only what they can see.
 */

type Mode = 'days' | 'hours' | 'date';

type CreatedLink = { url: string; expires_at: string; has_password: boolean };

/** The study in the active viewport when Share was pressed. */
export type StudyOnScreen = {
  studyUID: string;
  accessionNumber: string;
  patientName: string;
  description: string;
  date: string;
};

const HOUR_MS = 60 * 60 * 1000;
const MIN_PASSWORD = 6;
const MAX_PASSWORD = 72;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function toDateInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatExpiry(value: Date | string) {
  return new Date(value).toLocaleString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function workOutExpiry(
  mode: Mode,
  amount: string,
  date: string,
  time: string,
  maxDays: number
): { at: Date; body: Record<string, unknown> } | { error: string } {
  const now = Date.now();
  const maxHours = maxDays * 24;
  if (mode === 'date') {
    const at = new Date(`${date}T${time || '23:59'}`);
    if (!date || Number.isNaN(at.getTime())) {
      return { error: 'Pick a date.' };
    }
    if (at.getTime() < now + HOUR_MS) {
      return { error: 'Pick a time at least 1 hour from now.' };
    }
    if (at.getTime() > now + maxHours * HOUR_MS) {
      return { error: `Pick a time within ${maxDays} days.` };
    }
    return { at, body: { expires_at: at.toISOString() } };
  }

  const value = Number(amount);
  const max = mode === 'days' ? maxDays : maxHours;
  if (!Number.isInteger(value) || value < 1 || value > max) {
    return { error: `Choose 1 to ${max} ${mode}.` };
  }
  const hours = mode === 'days' ? value * 24 : value;
  return { at: new Date(now + hours * HOUR_MS), body: { expires_in_hours: hours } };
}

export default function ShareImagesModal({
  endpoint,
  maxDays = 30,
  study,
  hide,
}: {
  endpoint: string;
  maxDays?: number;
  study: StudyOnScreen | null;
  hide: () => void;
}) {
  const [mode, setMode] = React.useState<Mode>('days');
  const [amount, setAmount] = React.useState('1');
  const [date, setDate] = React.useState('');
  const [time, setTime] = React.useState('23:59');
  const [password, setPassword] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showErrors, setShowErrors] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [link, setLink] = React.useState<CreatedLink | null>(null);
  const [copied, setCopied] = React.useState(false);

  const expiry = workOutExpiry(mode, amount, date, time, maxDays);
  const passwordError =
    password && password.length < MIN_PASSWORD
      ? `Use at least ${MIN_PASSWORD} characters, or leave it empty.`
      : '';

  const today = new Date();
  const lastDay = new Date(today.getTime() + maxDays * 24 * HOUR_MS);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setShowErrors(true);
    setError('');
    if (!study || 'error' in expiry || passwordError) {
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          // A header a page on another site can't send, so it can't share on this visit's behalf.
          'X-Requested-With': 'spectra-viewer',
        },
        body: JSON.stringify({
          ...expiry.body,
          password,
          study_uid: study.studyUID,
          accession_number: study.accessionNumber,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.data?.url) {
        setError(payload?.message || "We couldn't make the link. Please try again.");
        return;
      }
      setLink(payload.data);
    } catch {
      setError("We couldn't reach Spectra. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const copy = async () => {
    if (!link) {
      return;
    }
    try {
      await navigator.clipboard.writeText(link.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Copying was blocked. Select the link and copy it instead.');
    }
  };

  if (link) {
    const message = `Here are the scan images: ${link.url}\n\nThe link works until ${formatExpiry(link.expires_at)}.${
      link.has_password ? ' You will need the password I send you separately.' : ''
    }`;
    return (
      <div className="text-foreground flex flex-col gap-4">
        <p className="text-sm">
          Link to {study?.patientName || 'this study'}
          {study?.description ? ` · ${study.description}` : ''}
        </p>
        <p className="text-muted-foreground text-sm">
          Works until {formatExpiry(link.expires_at)}. This is the only time it's shown, so copy or
          send it now.
        </p>
        <div className="border-input bg-background rounded border px-3 py-2">
          <p className="break-all text-sm">{link.url}</p>
        </div>
        {link.has_password && (
          <div className="border-input flex gap-2 rounded border p-3 text-sm">
            <Icons.Lock className="text-primary mt-0.5 h-4 w-4 shrink-0" />
            <span>
              Protected with the password you set. It isn't in the link, so send it another way.
            </span>
          </div>
        )}
        {error && <p className="text-destructive text-sm">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={copy}
          >
            <Icons.Copy className="mr-1 h-4 w-4" />
            {copied ? 'Copied' : 'Copy link'}
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
          >
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp
            </a>
          </Button>
          <Button
            variant="outline"
            size="lg"
            asChild
          >
            <a
              href={`mailto:?subject=${encodeURIComponent('Scan images')}&body=${encodeURIComponent(message)}`}
            >
              Email
            </a>
          </Button>
          <Button
            size="lg"
            className="ml-auto"
            onClick={hide}
          >
            Done
          </Button>
        </div>
      </div>
    );
  }

  if (!study) {
    return (
      <div className="text-foreground flex flex-col gap-4">
        <p className="text-sm">
          Click on the images you want to share, so their viewport is the active one, then press
          Share again.
        </p>
        <div className="flex justify-end">
          <Button
            size="lg"
            onClick={hide}
          >
            Close
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      className="text-foreground flex flex-col gap-5"
      onSubmit={submit}
      noValidate
    >
      <div className="border-input rounded border p-3">
        <p className="text-muted-foreground text-xs">Sharing the study in the active viewport</p>
        <p className="mt-1 text-base">{study.patientName || 'Unnamed patient'}</p>
        <p className="text-muted-foreground text-sm">
          {[study.description, study.date].filter(Boolean).join(' · ') || study.studyUID}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Link expires</Label>
        <p className="text-muted-foreground text-sm">Anything from 1 hour to {maxDays} days.</p>
        <ToggleGroup
          type="single"
          value={mode}
          onValueChange={value => {
            if (!value) {
              return;
            }
            setMode(value as Mode);
            if (value !== 'date') {
              setAmount('1');
            }
          }}
          size="sm"
          className="gap-1 self-start p-1"
        >
          {(['days', 'hours', 'date'] as Mode[]).map(value => (
            <ToggleGroupItem
              key={value}
              value={value}
              className="data-[state=on]:bg-primary/25 data-[state=on]:text-primary min-w-16 rounded px-3 capitalize"
            >
              {value}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {mode === 'date' ? (
          <div className="flex gap-2">
            <Input
              type="date"
              aria-label="Date"
              value={date}
              min={toDateInput(today)}
              max={toDateInput(lastDay)}
              onChange={e => setDate(e.target.value)}
              className="w-44 [color-scheme:dark]"
            />
            <Input
              type="time"
              aria-label="Time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="w-32 [color-scheme:dark]"
            />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              aria-label={`Number of ${mode}`}
              min={1}
              max={mode === 'days' ? maxDays : maxDays * 24}
              step={1}
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-28"
            />
            <span className="text-sm">
              {mode === 'days'
                ? amount === '1'
                  ? 'day'
                  : 'days'
                : amount === '1'
                  ? 'hour'
                  : 'hours'}
            </span>
          </div>
        )}
        {'error' in expiry ? (
          showErrors && <p className="text-destructive text-sm">{expiry.error}</p>
        ) : (
          <p className="text-muted-foreground text-sm">
            Stops working on <span className="text-foreground">{formatExpiry(expiry.at)}</span>
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="share-images-password">
          Password <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <p className="text-muted-foreground text-sm">
          Whoever opens the link will have to enter it. Send it separately from the link.
        </p>
        <div className="flex gap-2">
          <Input
            id="share-images-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Leave empty for no password"
            maxLength={MAX_PASSWORD}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={() => setShowPassword(shown => !shown)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </Button>
        </div>
        {showErrors && passwordError && <p className="text-destructive text-sm">{passwordError}</p>}
      </div>

      {error && <p className="text-destructive text-sm">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={hide}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          size="lg"
          disabled={submitting}
        >
          {submitting ? 'Making link...' : 'Create link'}
        </Button>
      </div>
    </form>
  );
}
