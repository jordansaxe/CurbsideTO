"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  type FormState,
  addComment,
  chooseHandle,
  openHome,
  requestLogin,
  saveRating,
} from "@/app/actions";
import { COMMENT_TAGS, MAX_COMMENT_LENGTH, RATING_FIELDS } from "@/lib/constants";
import type { RatingValues } from "@/lib/data";

const inputClass =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20";

function SubmitButton({ children, pendingLabel }: { children: React.ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="cursor-pointer rounded-lg bg-brand px-4 py-2 text-sm font-medium whitespace-nowrap text-white hover:bg-brand-dark disabled:cursor-default disabled:opacity-60"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

function Feedback({ state }: { state: FormState }) {
  if (state?.error) {
    return (
      <p role="alert" className="text-sm text-red-700">
        {state.error}
      </p>
    );
  }
  if (state?.message) {
    return (
      <p role="status" className="text-sm text-brand-dark">
        {state.message}
      </p>
    );
  }
  return null;
}

export function LoginForm() {
  const [state, action] = useActionState(requestLogin, null);
  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1 text-sm font-medium">
        <span>Email</span>
        <input name="email" type="email" defaultValue={state?.values?.email} required autoComplete="email" placeholder="you@example.com" className={inputClass} />
      </label>
      <label className="block space-y-1 text-sm font-medium">
        <span>
          Invite code <span className="font-normal text-muted">(first time only)</span>
        </span>
        <input name="invite" defaultValue={state?.values?.invite} autoComplete="off" className={inputClass} />
      </label>
      <SubmitButton pendingLabel="Sending…">Email me a sign-in link</SubmitButton>
      <Feedback state={state} />
    </form>
  );
}

export function HandleForm() {
  const [state, action] = useActionState(chooseHandle, null);
  return (
    <form action={action} className="space-y-4">
      <label className="block space-y-1 text-sm font-medium">
        <span>Handle</span>
        <input name="handle" defaultValue={state?.values?.handle} required minLength={3} maxLength={20} autoComplete="off" placeholder="junction_hunter" className={inputClass} />
      </label>
      <SubmitButton pendingLabel="Saving…">Continue</SubmitButton>
      <Feedback state={state} />
    </form>
  );
}

export function PasteLinkForm() {
  const [state, action] = useActionState(openHome, null);
  return (
    <form action={action} className="space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          name="url"
          defaultValue={state?.values?.url}
          required
          aria-label="HouseSigma listing link"
          placeholder="https://housesigma.com/on/toronto-real-estate/…"
          className={inputClass}
        />
        <SubmitButton pendingLabel="Opening…">Open home</SubmitButton>
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function RatingForm({ homeId, mine }: { homeId: string; mine: RatingValues | null }) {
  const [state, action] = useActionState(saveRating.bind(null, homeId), null);
  return (
    <form action={action} className="space-y-3">
      {RATING_FIELDS.map(({ key, label }) => (
        <fieldset key={key} className="flex items-center justify-between gap-3">
          <legend className="float-left text-sm">{label}</legend>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((score) => (
              <label key={score} className="cursor-pointer">
                <input
                  type="radio"
                  name={key}
                  value={score}
                  required
                  defaultChecked={mine?.[key] === score}
                  className="peer sr-only"
                />
                <span className="flex h-8 w-8 items-center justify-center rounded-md border border-line bg-white text-sm peer-checked:border-brand peer-checked:bg-brand peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-brand/40">
                  {score}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <p className="text-xs text-muted">1 = poor, 5 = great</p>
      <SubmitButton pendingLabel="Saving…">{mine ? "Update my rating" : "Save my rating"}</SubmitButton>
      <Feedback state={state} />
    </form>
  );
}

export function CommentForm({ homeId, parentId }: { homeId: string; parentId?: string }) {
  const [state, action] = useActionState(addComment.bind(null, homeId), null);
  return (
    <form action={action} className="space-y-3">
      {parentId && <input type="hidden" name="parentId" value={parentId} />}
      <textarea
        name="body"
        defaultValue={state?.values?.body}
        required
        maxLength={MAX_COMMENT_LENGTH}
        rows={parentId ? 2 : 4}
        aria-label={parentId ? "Your reply" : "Your comment"}
        placeholder={parentId ? "Write a reply…" : "What did you notice? Layout, light, street, renos, red flags…"}
        className={inputClass}
      />
      {!parentId && (
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          {COMMENT_TAGS.map((tag) => (
            <label key={tag.key} className="flex cursor-pointer items-center gap-1.5 text-sm">
              <input type="checkbox" name="tags" value={tag.key} className="accent-brand" />
              {tag.label}
            </label>
          ))}
        </div>
      )}
      <SubmitButton pendingLabel="Posting…">{parentId ? "Reply" : "Post comment"}</SubmitButton>
      <Feedback state={state} />
    </form>
  );
}
