"use client";

import { Fragment, useState, type ReactNode } from "react";
import { motion } from "framer-motion";

import { Blossom, Sparkle } from "@/components/blossom/blossom";
import { Reveal, useStableReducedMotion } from "@/components/landing/reveal";
import { SectionHeading } from "@/components/landing/section-heading";
import { useSound } from "@/components/landing/sound";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/* ── The rater ─────────────────────────────────────────────────────────────
   Five steps up a pentatonic scale (C5 D5 E5 G5 A5, in semitones from A4) so
   dragging across the blossoms sounds like a phrase rather than five beeps. */
const SCORE_STEPS = [
  { value: 1, semitone: 3, caption: "Rough one. It happens." },
  { value: 2, semitone: 5, caption: "Distracted, but we got to the end." },
  { value: 3, semitone: 7, caption: "Solid. The scales are landing." },
  {
    value: 4,
    semitone: 10,
    caption: "Really good — she fixed bar 24 herself.",
  },
  { value: 5, semitone: 12, caption: "That was a recital-ready run." },
] as const;

/* ── The board ─────────────────────────────────────────────────────────────
   Ranks 4 and 4 are a genuine tie on an exact average, so the row after them
   is rank 6. That is the whole point of the annotation underneath. */
const PODIUM = [
  {
    rank: 2,
    name: "Priya Raman",
    initials: "PR",
    avg: "4.55",
    rated: 38,
    height: 82,
    pedestal: "bg-teal-100 border-teal-200",
  },
  {
    rank: 1,
    name: "Mai Anh",
    initials: "MA",
    avg: "4.72",
    rated: 43,
    height: 110,
    pedestal: "bg-pink-100 border-pink-200",
  },
  {
    rank: 3,
    name: "Duc Pham",
    initials: "DP",
    avg: "4.41",
    rated: 29,
    height: 64,
    pedestal: "bg-sand-100 border-sand-300",
  },
] as const;

/** Pink → teal ramp for the score spread: a 1 reads pink, a 5 reads teal. */
const SPREAD_TONES = [
  { score: 1, tone: "bg-pink-500" },
  { score: 2, tone: "bg-pink-400" },
  { score: 3, tone: "bg-bubblegum" },
  { score: 4, tone: "bg-mint" },
  { score: 5, tone: "bg-wintergreen" },
] as const;

type RankRow = {
  rank: number;
  name: string;
  initials: string;
  avg: string;
  rated: number;
  /** Counts of 1s, 2s, 3s, 4s and 5s. */
  spread: readonly number[];
  thin?: boolean;
};

const RANK_ROWS: readonly RankRow[] = [
  {
    rank: 4,
    name: "Linh Tran",
    initials: "LT",
    avg: "4.20",
    rated: 15,
    spread: [0, 1, 2, 5, 7],
  },
  {
    rank: 4,
    name: "Sam Okoye",
    initials: "SO",
    avg: "4.20",
    rated: 20,
    spread: [0, 2, 2, 6, 10],
  },
  {
    rank: 6,
    name: "Ha My",
    initials: "HM",
    avg: "3.50",
    rated: 2,
    spread: [0, 0, 1, 1, 0],
    thin: true,
  },
  {
    rank: 7,
    name: "Bao Nguyen",
    initials: "BN",
    avg: "3.39",
    rated: 18,
    spread: [1, 3, 5, 6, 3],
  },
];

/* ── The printed month ─────────────────────────────────────────────────────
   14 booked slots: 12 complete, 1 cancelled, 1 still to come — which is why
   the tuition block bills exactly 12 lessons. */
type Mark = "ok" | "no" | "wait" | "off";

const MARK: Record<Mark, { box: string; glyph: string; label: string }> = {
  ok: { box: "bg-ok-bg text-ok-fg", glyph: "✓", label: "complete" },
  no: { box: "bg-no-bg text-no-fg", glyph: "✕", label: "cancelled" },
  wait: { box: "bg-wait-bg text-wait-fg", glyph: "–", label: "to come" },
  off: { box: "bg-floss text-ink-faint", glyph: "", label: "no lesson" },
};

const REPORT_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

const REPORT_WEEKS: readonly { label: string; days: readonly Mark[] }[] = [
  { label: "W1", days: ["off", "ok", "off", "ok", "off", "ok", "off"] },
  { label: "W2", days: ["ok", "ok", "off", "ok", "off", "ok", "off"] },
  { label: "W3", days: ["off", "ok", "off", "no", "off", "ok", "off"] },
  { label: "W4", days: ["off", "ok", "off", "ok", "off", "ok", "wait"] },
];

/* ── The ledger ────────────────────────────────────────────────────────── */
type LedgerStatus = "paid" | "partial" | "unpaid";

const LEDGER_STATUS: Record<LedgerStatus, { chip: string; label: string }> = {
  paid: { chip: "bg-ok-bg text-ok-fg", label: "Paid" },
  partial: { chip: "bg-wait-bg text-wait-fg", label: "Partial" },
  unpaid: { chip: "bg-no-bg text-no-fg", label: "Unpaid" },
};

const LEDGER_ROWS = [
  { name: "Mai Anh", expected: 7200, received: 7200, status: "paid" },
  { name: "Priya Raman", expected: 6000, received: 3500, status: "partial" },
  { name: "Duc Pham", expected: 4800, received: 4800, status: "paid" },
  { name: "Linh Tran", expected: 5400, received: 0, status: "unpaid" },
  { name: "Sam Okoye", expected: 6600, received: 6600, status: "paid" },
] as const satisfies readonly {
  name: string;
  expected: number;
  received: number;
  status: LedgerStatus;
}[];

const LEDGER_TXNS = [
  { date: "4 Jul", method: "Cash", amount: 2000 },
  { date: "11 Jul", method: "Bank transfer", amount: 1500 },
] as const;

const money = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/* ── Shared shell ──────────────────────────────────────────────────────── */

/** Every showcase panel is the same white card so the four read as one set. */
function ShowcaseCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col rounded-3xl border border-(--line) bg-white p-5 shadow-(--sh) sm:p-6",
        className,
      )}
    >
      <h3 className="text-ink flex items-center gap-2 font-serif text-lg font-bold sm:text-xl">
        <Blossom size={16} className="text-bubblegum" />
        {title}
      </h3>
      {children}
    </div>
  );
}

/**
 * A podium pedestal that grows out of the floor on entry. Height is the
 * animated property rather than scaleY so the rank numeral inside is never
 * squashed on the way up; overflow-hidden keeps it out of sight at height 0.
 */
function Pedestal({
  height,
  delay,
  className,
  children,
}: {
  height: number;
  delay: number;
  className: string;
  children: ReactNode;
}) {
  const reduced = useStableReducedMotion();
  const shell = cn(
    "mt-2 flex w-full items-center justify-center overflow-hidden rounded-t-xl border border-b-0",
    className,
  );

  if (reduced) {
    return (
      <div className={shell} style={{ height }}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={shell}
      initial={{ height: 0 }}
      whileInView={{ height }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Fills left-to-right on entry — the visual answer to "how much came in?". */
function ReceivedBar({ pct, delay }: { pct: number; delay: number }) {
  const reduced = useStableReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-pink-100"
    >
      {reduced ? (
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: "var(--grad-brand)" }}
        />
      ) : (
        <motion.div
          className="h-full rounded-full"
          style={{ background: "var(--grad-brand)" }}
          initial={{ width: 0 }}
          whileInView={{ width: `${pct}%` }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.9, delay, ease: EASE }}
        />
      )}
    </div>
  );
}

/** Initials on the brand gradient — mint-ink is the only ink these fills take. */
function Initials({
  initials,
  className,
}: {
  initials: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "text-mint-ink inline-flex items-center justify-center rounded-full text-xs font-bold",
        className,
      )}
      style={{ background: "var(--grad-brand)" }}
    >
      {initials}
    </span>
  );
}

/* ── The four panels ───────────────────────────────────────────────────── */

/**
 * The rater is the one genuinely interactive thing in this section: the
 * visitor scores a lesson exactly the way the teacher does, and the notes
 * climb as the score does. Unrated is modelled as null, not zero — which is
 * the single product point this panel exists to make.
 */
function ScoringWidget() {
  const { playNote } = useSound();
  const [value, setValue] = useState<number | null>(4);
  const [hover, setHover] = useState<number | null>(null);

  const shown = hover ?? value ?? 0;
  const caption = SCORE_STEPS.find((step) => step.value === shown)?.caption;

  return (
    <ShowcaseCard title="How did that lesson go?">
      <p className="text-ink-soft mt-1 text-sm">
        Tuesday, 4:30pm · Mai Anh · Clementi, Op. 36 No. 1
      </p>

      <div
        className="mt-4 flex items-center gap-0.5 sm:gap-1"
        onMouseLeave={() => setHover(null)}
      >
        {SCORE_STEPS.map((step) => (
          <button
            key={step.value}
            type="button"
            aria-label={`Score this lesson ${step.value} out of 5 blossoms`}
            aria-pressed={value === step.value}
            onMouseEnter={() => {
              setHover(step.value);
              playNote(step.semitone);
            }}
            onFocus={() => {
              setHover(step.value);
              playNote(step.semitone);
            }}
            onBlur={() => setHover(null)}
            onClick={() => {
              setValue(step.value);
              playNote(step.semitone);
            }}
            className="focus-visible:ring-ring/50 inline-flex size-11 cursor-pointer items-center justify-center rounded-full transition-transform duration-200 outline-none hover:scale-110 focus-visible:ring-3 motion-reduce:transition-none motion-reduce:hover:scale-100"
          >
            <Blossom
              size={30}
              className={cn(
                "transition-colors duration-200",
                step.value <= shown ? "text-bubblegum" : "text-pink-100",
              )}
            />
          </button>
        ))}
      </div>

      {/* The visible caption follows the pointer, so it must NOT be the live
          region: sweeping across five blossoms would queue five announcements
          on top of each button's own label. The committed score gets its own
          quiet one below, and only changes when you actually choose. */}
      <p className="mt-3 min-h-11 text-sm">
        {value === null && hover === null ? (
          <span className="text-ink-soft italic">
            Not scored. It will sit out of the ranking until you say so.
          </span>
        ) : (
          <>
            <span className="text-ink text-base font-bold tabular-nums">
              {shown} of 5
            </span>{" "}
            <span className="text-ink-soft">— {caption}</span>
          </>
        )}
      </p>

      <p aria-live="polite" className="sr-only">
        {value === null
          ? "Not scored."
          : `Scored ${value} out of 5 blossoms. Counted in the ranking.`}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {value === null ? (
          <span className="bg-wait-bg text-wait-fg inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
            <span className="bg-wait-dot size-1.5 rounded-full" /> Not rated yet
          </span>
        ) : (
          <span className="bg-ok-bg text-ok-fg inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
            <span className="bg-ok-dot size-1.5 rounded-full" /> Counted in the
            ranking
          </span>
        )}
        <button
          type="button"
          onClick={() => {
            setValue(null);
            setHover(null);
          }}
          className="focus-visible:ring-ring/50 text-ink-soft hover:text-ink inline-flex h-11 cursor-pointer items-center rounded-full px-3 text-xs font-semibold underline underline-offset-4 outline-none focus-visible:ring-3"
        >
          Skip this one
        </button>
      </div>

      <p className="text-ink-soft mt-auto border-t border-(--line) pt-4 text-[13px] leading-relaxed">
        <span className="font-semibold text-pink-700">
          An unrated lesson is null, not zero.
        </span>{" "}
        It is excluded from the average and from every ranking. A lesson you
        forgot to score should never look like a lesson that went badly.
      </p>
    </ShowcaseCard>
  );
}

/**
 * The board. Everything here is keyed on rank rather than row position,
 * because the tie rule is the interesting part: two students on 4.20 both
 * hold rank 4 and the next student is rank 6.
 */
function Leaderboard() {
  return (
    <ShowcaseCard title="The all-time board">
      <p className="text-ink-soft mt-1 text-sm">
        Averages over every rated lesson, since the studio opened.
      </p>

      <ol className="mt-5 flex items-end justify-center gap-2 sm:gap-3">
        {PODIUM.map((entry, index) => (
          <li
            key={entry.rank}
            className="relative flex min-w-0 flex-1 flex-col items-center text-center"
          >
            {entry.rank === 1 && (
              <>
                <Sparkle
                  className="text-bubblegum absolute top-0 left-1"
                  size={11}
                />
                <Sparkle
                  className="text-bubblegum absolute top-3 right-0"
                  size={9}
                />
              </>
            )}
            <Blossom
              size={16}
              className={cn(
                "text-bubblegum mb-1",
                entry.rank !== 1 && "invisible",
              )}
            />
            <Initials
              initials={entry.initials}
              className="size-10 text-sm sm:size-12 sm:text-base"
            />
            <p className="text-ink mt-1.5 w-full truncate text-xs font-semibold sm:text-sm">
              {entry.name}
            </p>
            <p className="text-ink text-base font-bold tabular-nums sm:text-lg">
              {entry.avg}
            </p>
            <p className="text-ink-soft text-[11px]">{entry.rated} rated</p>
            <Pedestal
              height={entry.height}
              delay={0.08 * index}
              className={entry.pedestal}
            >
              <span className="text-ink/70 text-2xl font-bold tabular-nums sm:text-3xl">
                {entry.rank}
              </span>
            </Pedestal>
          </li>
        ))}
      </ol>

      {/* Focusable, named scroll region: below ~640px the rows genuinely
          overflow, and a plain overflow-x div with nothing focusable inside it
          cannot be scrolled by keyboard in Firefox or Safari at all. */}
      <div
        tabIndex={0}
        role="region"
        aria-label="Score spread by student"
        className="focus-visible:ring-ring/50 -mx-1 mt-4 overflow-x-auto rounded-lg outline-none focus-visible:ring-3"
      >
        <ul className="min-w-105 px-1">
          {RANK_ROWS.map((row) => {
            const total = row.spread.reduce((sum, n) => sum + n, 0);
            return (
              <li
                key={row.name}
                className="flex items-center gap-3 border-t border-(--line) py-2.5"
              >
                <span className="text-ink-soft w-5 shrink-0 text-right text-sm font-bold tabular-nums">
                  {row.rank}
                </span>
                <Initials initials={row.initials} className="size-8 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-ink flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold">
                    {row.name}
                    {row.thin && (
                      <span className="bg-wait-bg text-wait-fg rounded-full px-2 py-0.5 text-[10px] font-semibold">
                        Thin evidence · {row.rated} rated
                      </span>
                    )}
                  </p>
                  <div
                    aria-hidden="true"
                    className="mt-1 flex h-1.5 w-full overflow-hidden rounded-full bg-pink-50"
                  >
                    {SPREAD_TONES.map((tone, i) => {
                      const count = row.spread[i] ?? 0;
                      if (count === 0) return null;
                      return (
                        <span
                          key={tone.score}
                          className={tone.tone}
                          style={{ width: `${(count / total) * 100}%` }}
                        />
                      );
                    })}
                  </div>
                  <span className="sr-only">
                    Score spread:{" "}
                    {SPREAD_TONES.map(
                      (tone, i) => `${row.spread[i] ?? 0} × ${tone.score}`,
                    ).join(", ")}
                    .
                  </span>
                </div>
                <span className="text-ink shrink-0 text-sm font-bold tabular-nums">
                  {row.avg}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <p className="text-ink-soft mt-4 rounded-2xl bg-pink-50 p-3 text-[13px] leading-relaxed">
        <span className="font-semibold text-pink-700">Two fours, no five.</span>{" "}
        Ties are decided by the exact average via integer cross-multiplication,
        so a real tie shares a rank (1, 1, 3) instead of being broken by luck.
      </p>
    </ShowcaseCard>
  );
}

/**
 * The report sheet is drawn as paper — ruled lines, a serif hand and a small
 * tilt — because that is what actually leaves the studio. The tilt is dropped
 * below md so the sheet does not fight the phone viewport.
 */
function ReportSheet() {
  return (
    <ShowcaseCard title="The month, on paper">
      <p className="text-ink-soft mt-1 text-sm">
        One student, one month, printed straight from the browser.
      </p>

      <div className="bg-floss mt-4 rounded-2xl p-4 sm:p-6">
        <div className="relative overflow-hidden rounded-xl bg-white p-4 shadow-(--sh-xl) sm:p-5 md:rotate-[-0.6deg]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              backgroundImage:
                "repeating-linear-gradient(to bottom, transparent 0 27px, var(--line) 27px 28px)",
            }}
          />

          <div className="relative flex flex-wrap items-start justify-between gap-2">
            <div>
              <h4 className="text-ink font-serif text-lg font-bold sm:text-xl">
                Mai Anh
              </h4>
              <p className="text-sm font-medium text-pink-700 italic">
                July 2026 · monthly report
              </p>
            </div>
            <span className="text-ink-soft rounded-full border border-(--line) bg-white px-3 py-1 text-xs font-semibold">
              <span aria-hidden="true">🖨</span> Print
            </span>
          </div>

          <div
            tabIndex={0}
            role="region"
            aria-label="Attendance for July 2026"
            className="focus-visible:ring-ring/50 relative -mx-1 mt-4 overflow-x-auto rounded-lg px-1 outline-none focus-visible:ring-3"
          >
            <table className="min-w-75 border-separate border-spacing-1">
              <caption className="sr-only">
                Attendance for July 2026, by week and weekday.
              </caption>
              <thead>
                <tr>
                  <th scope="col">
                    <span className="sr-only">Week</span>
                  </th>
                  {REPORT_DAYS.map((day) => (
                    <th
                      key={day}
                      scope="col"
                      className="text-ink-soft w-8 text-[10px] font-semibold"
                    >
                      {day.slice(0, 1)}
                      <span className="sr-only">{day.slice(1)}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {REPORT_WEEKS.map((week) => (
                  <tr key={week.label}>
                    <th
                      scope="row"
                      className="text-ink-soft pr-1 text-[10px] font-semibold"
                    >
                      {week.label}
                    </th>
                    {week.days.map((mark, i) => (
                      <td key={`${week.label}-${REPORT_DAYS[i] ?? i}`}>
                        <span
                          className={cn(
                            "flex size-7 items-center justify-center rounded-md text-[11px] font-bold",
                            MARK[mark].box,
                          )}
                        >
                          <span aria-hidden="true">{MARK[mark].glyph}</span>
                          <span className="sr-only">{MARK[mark].label}</span>
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-ink-soft relative mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
            <span>
              <span aria-hidden="true" className="text-ok-fg font-bold">
                ✓
              </span>{" "}
              12 complete
            </span>
            <span>
              <span aria-hidden="true" className="text-no-fg font-bold">
                ✕
              </span>{" "}
              1 cancelled
            </span>
            <span>
              <span aria-hidden="true" className="text-wait-fg font-bold">
                –
              </span>{" "}
              1 to come
            </span>
          </p>

          <div className="relative mt-4 space-y-3">
            <div>
              <p className="text-ink text-[11px] font-bold tracking-wide uppercase">
                Summary
              </p>
              <p className="text-ink-soft font-serif text-sm leading-relaxed italic">
                The sonatina is under her hands now — bars 1 to 24 from memory,
                tempo steady. The left hand still rushes the repeat, so we took
                it down to 76.
              </p>
            </div>
            <div>
              <p className="text-ink text-[11px] font-bold tracking-wide uppercase">
                Next month
              </p>
              <p className="text-ink-soft font-serif text-sm leading-relaxed italic">
                Finish the second movement and add five minutes of sight-reading
                a lesson. Recital piece chosen by the 20th.
              </p>
            </div>
          </div>

          <dl className="relative mt-4 space-y-1 border-t border-(--line) pt-3 text-sm">
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-soft">12 lessons × ₹600</dt>
              <dd className="text-ink font-semibold tabular-nums">₹7,200</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="text-ink-soft">Paid</dt>
              <dd className="text-ink font-semibold tabular-nums">₹5,000</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3">
              <dt className="font-semibold text-pink-700">Outstanding</dt>
              {/* font-num: the report paper is set in a serif hand, and this is
                  the figure globals.css defines that token to break back out of
                  it — exactly as report-view.tsx renders the real one. */}
              <dd className="font-num text-base font-bold text-pink-700 tabular-nums">
                ₹2,200
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <p className="text-ink-soft mt-4 text-[13px] leading-relaxed">
        One family, one sheet — siblings print together and the maths comes from
        the same code path, so the numbers can never disagree.
      </p>
    </ShowcaseCard>
  );
}

/** Expected against received, per student per month, partial payments and all. */
function PaymentLedger() {
  const totalExpected = LEDGER_ROWS.reduce((sum, r) => sum + r.expected, 0);
  const totalReceived = LEDGER_ROWS.reduce((sum, r) => sum + r.received, 0);
  const shortfall = totalExpected - totalReceived;

  return (
    <ShowcaseCard title="Who has paid">
      <p className="text-ink-soft mt-1 text-sm">July 2026 · 5 students</p>

      <div
        tabIndex={0}
        role="region"
        aria-label="Expected against received tuition"
        className="focus-visible:ring-ring/50 -mx-1 mt-4 overflow-x-auto rounded-lg px-1 outline-none focus-visible:ring-3"
      >
        <table className="w-full min-w-95 text-left text-sm">
          <caption className="sr-only">
            Expected against received tuition for July 2026.
          </caption>
          <thead>
            <tr className="text-ink-soft text-[11px] font-semibold tracking-wide uppercase">
              <th scope="col" className="pb-2">
                Student
              </th>
              <th scope="col" className="pb-2 text-right">
                Expected
              </th>
              <th scope="col" className="pb-2 text-right">
                Received
              </th>
              <th scope="col" className="pb-2 text-right">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {LEDGER_ROWS.map((row, index) => {
              const pct = Math.round((row.received / row.expected) * 100);
              const status = LEDGER_STATUS[row.status];
              return (
                <Fragment key={row.name}>
                  <tr className="border-t border-(--line) align-top">
                    <th
                      scope="row"
                      className="text-ink py-2.5 pr-3 font-semibold whitespace-nowrap"
                    >
                      {row.status === "partial" && (
                        <span
                          aria-hidden="true"
                          className="text-ink-faint mr-1 inline-block"
                        >
                          ▾
                        </span>
                      )}
                      {row.name}
                    </th>
                    <td className="text-ink-soft py-2.5 text-right tabular-nums">
                      {money(row.expected)}
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      <span className="text-ink font-semibold tabular-nums">
                        {money(row.received)}
                      </span>
                      <ReceivedBar pct={pct} delay={0.06 * index} />
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      <span
                        className={cn(
                          "inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
                          status.chip,
                        )}
                      >
                        {status.label}
                      </span>
                    </td>
                  </tr>

                  {row.status === "partial" && (
                    <tr className="bg-floss/70">
                      <td colSpan={4} className="px-2 py-2">
                        <p className="text-ink-soft text-[11px] font-semibold tracking-wide uppercase">
                          2 transactions
                        </p>
                        <ul className="mt-1 space-y-1">
                          {LEDGER_TXNS.map((txn) => (
                            <li
                              key={txn.date}
                              className="text-ink-soft flex items-baseline justify-between gap-3 text-[13px]"
                            >
                              <span>
                                {txn.date} · {txn.method}
                              </span>
                              <span className="text-ink font-semibold tabular-nums">
                                {money(txn.amount)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-(--line-strong)">
              <th scope="row" className="text-ink py-2.5 font-serif font-bold">
                Total
              </th>
              <td className="text-ink py-2.5 text-right font-semibold tabular-nums">
                {money(totalExpected)}
              </td>
              <td className="text-ink py-2.5 pl-3 text-right font-semibold tabular-nums">
                {money(totalReceived)}
              </td>
              <td className="py-2.5 pl-3 text-right font-semibold text-pink-700 tabular-nums">
                {money(shortfall)} short
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <p className="text-ink-soft mt-auto pt-4 text-[13px] leading-relaxed">
        Partial payments are the normal case, not an edge case. Two transfers
        and a bit of cash still add up to one honest outstanding figure.
      </p>
    </ShowcaseCard>
  );
}

/**
 * The scoring showcase: four hand-built panels that walk one lesson from a gut
 * feeling to a printed sheet — rate it, rank it, print it, chase the balance.
 * Nothing here fetches; every figure is a literal, so the section renders
 * identically on the server and the client.
 */
export function ShowcaseScoring() {
  return (
    <section
      id="scoring"
      aria-labelledby="scoring-title"
      className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading
          id="scoring-title"
          // The one mid-page squiggle. This is the section the page is built
          // around, and it answers the hero's mark and the closing CTA's.
          squiggle
          eyebrow="Progress you can prove"
          title="Rate the lesson. Rank the room. Print the month."
          lead="The feeling that a student has finally turned a corner lives in your head — this turns it into a score, a rank and a sheet of paper you can hand a parent."
        />

        <div className="mt-10 grid grid-cols-1 gap-5 sm:mt-12 sm:gap-6 lg:grid-cols-12">
          <Reveal delay={0.05} className="lg:col-span-5">
            <ScoringWidget />
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-7">
            <Leaderboard />
          </Reveal>
          <Reveal delay={0.05} className="lg:col-span-7">
            <ReportSheet />
          </Reveal>
          <Reveal delay={0.1} className="lg:col-span-5">
            <PaymentLedger />
          </Reveal>
        </div>
      </div>
    </section>
  );
}
