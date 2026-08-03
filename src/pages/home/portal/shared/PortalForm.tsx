import { useState, type ReactNode } from "react";

/** Schema-driven form for the portal's request panels.
 *
 *  Currently only Book a walkthrough mounts it; the handoff's Support panel
 *  used the identical shape — same 2-column grid, same required-field
 *  validation, same "We still need X, Y." message, same swap-to-confirmation —
 *  which is why fields and copy are data and this is the mechanism.
 *
 *  One deliberate addition: a **failure state**. The static build had no path
 *  for a rejected submission (IMPLEMENTATION.md §3 lists it as missing), which
 *  was survivable only because it never actually sent anything. Now that these
 *  post for real, a network error has to be visible — otherwise a dropped lead
 *  looks identical to a delivered one. */

export type PortalFieldKind = "text" | "email" | "tel" | "select" | "textarea";

export interface PortalField {
  id: string;
  label: string;
  kind: PortalFieldKind;
  placeholder?: string;
  required?: boolean;
  /** First entry is the inert "Select one" prompt. */
  options?: string[];
  /** Spans both grid columns. */
  wide?: boolean;
  /** How this field is named in the validation message, e.g. "your name",
   *  "a valid work email". Falls back to the lowercased label. */
  missLabel?: string;
}

export type PortalFormValues = Record<string, string>;

interface Props {
  intro: string;
  fields: PortalField[];
  submitLabel: string;
  /** Resolves on success, throws on failure. */
  onSubmit: (values: PortalFormValues) => Promise<void>;
  /** Success screen. Receives what was entered so it can recap. */
  renderConfirmation: (values: PortalFormValues) => ReactNode;
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const FIELD_CLASS =
  "w-full px-3 py-2.5 font-body text-[14px] text-brand_navy bg-custom-white border rounded-lg outline-none transition-colors placeholder:text-brand_placeholder focus:border-brand_green focus:shadow-[0_0_0_3.5px_rgba(30,158,82,0.15)]";

const PortalForm = ({
  intro,
  fields,
  submitLabel,
  onSubmit,
  renderConfirmation,
}: Props) => {
  const [values, setValues] = useState<PortalFormValues>({});
  const [bad, setBad] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const set = (id: string, v: string) => setValues((p) => ({ ...p, [id]: v }));

  const handleSubmit = async () => {
    const missing: string[] = [];
    const badIds: string[] = [];

    for (const f of fields) {
      if (!f.required) continue;
      const v = (values[f.id] ?? "").trim();
      const isEmail = f.kind === "email";
      const ok = isEmail ? EMAIL_RE.test(v) : v.length > 0;
      // Selects lead with "Select one", which is not a real answer.
      const chosen = f.kind !== "select" || (v !== "" && v !== f.options?.[0]);
      if (!ok || !chosen) {
        badIds.push(f.id);
        missing.push(f.missLabel ?? f.label.toLowerCase());
      }
    }

    setBad(badIds);
    if (missing.length) {
      setError(`We still need ${missing.join(", ")}.`);
      return;
    }

    setError(null);
    setSending(true);
    try {
      await onSubmit(values);
      setSent(true);
    } catch {
      setError(
        "That didn't send — something went wrong on our end. Try again, or email us directly.",
      );
    } finally {
      setSending(false);
    }
  };

  if (sent) return <>{renderConfirmation(values)}</>;

  return (
    <div className="px-8 pt-[26px] pb-9">
      <p className="text-[14.5px] leading-[1.65] text-brand_slate mb-6">{intro}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[15px]">
        {fields.map((f) => {
          const invalid = bad.includes(f.id);
          const border = invalid ? "border-brand_danger" : "border-brand_line_2";
          return (
            <div
              key={f.id}
              className={`flex flex-col min-w-0 ${f.wide ? "sm:col-span-2" : ""}`}
            >
              <label
                htmlFor={f.id}
                className="text-[12.5px] font-semibold text-brand_navy mb-[7px]"
              >
                {f.label}
                {f.required && <span className="text-brand_green"> *</span>}
              </label>

              {f.kind === "select" ? (
                <select
                  id={f.id}
                  value={values[f.id] ?? ""}
                  onChange={(e) => set(f.id, e.target.value)}
                  className={`${FIELD_CLASS} ${border} h-[42px]`}
                >
                  {f.options?.map((o, i) => (
                    <option key={o} value={i === 0 ? "" : o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : f.kind === "textarea" ? (
                <textarea
                  id={f.id}
                  rows={4}
                  placeholder={f.placeholder}
                  value={values[f.id] ?? ""}
                  onChange={(e) => set(f.id, e.target.value)}
                  className={`${FIELD_CLASS} ${border} resize-y leading-[1.6]`}
                />
              ) : (
                <input
                  id={f.id}
                  type={f.kind}
                  placeholder={f.placeholder}
                  value={values[f.id] ?? ""}
                  onChange={(e) => set(f.id, e.target.value)}
                  className={`${FIELD_CLASS} ${border}`}
                />
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 text-[13px] leading-[1.55] text-brand_danger bg-brand_danger_bg border border-brand_danger_line rounded-lg px-3.5 py-2.5"
        >
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={sending}
        className="w-full mt-5 font-display font-semibold text-[15px] text-custom-white bg-brand_navy rounded-lg px-[18px] py-3 transition-colors hover:bg-brand_navy_hover disabled:opacity-50 cursor-pointer"
      >
        {sending ? "Sending…" : submitLabel}
      </button>
    </div>
  );
};

export default PortalForm;
