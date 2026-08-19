"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutDashboard,
  ListOrdered,
  Music,
  Plus,
  UserRound,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { Blossom } from "@/components/blossom/blossom";
import { LogoMark } from "@/components/blossom/logo-mark";
import { Mochi } from "@/components/blossom/mochi";
import { Reveal, useStableReducedMotion } from "@/components/landing/reveal";
import { SectionHeading } from "@/components/landing/section-heading";
import { cn } from "@/lib/utils";

/* ── The fake studio ──────────────────────────────────────────────────────────
   Every number below is a hardcoded literal on purpose. Nothing here fetches,
   randomises or reads the clock: this section renders identically on the server
   and on the client, so it can never cause a hydration mismatch, and a visitor
   with no account still sees exactly what the app looks like at 9am. */

type Status = "COMPLETE" | "PENDING" | "CANCELLED";

/** The one true status mapping — same tokens the real lesson screens use. */
const CHIP_TONE: Record<Status, string> = {
  COMPLETE: "bg-ok-bg text-ok-fg",
  PENDING: "bg-wait-bg text-wait-fg",
  CANCELLED: "bg-no-bg text-no-fg",
};

const CHIP_DOT: Record<Status, string> = {
  COMPLETE: "bg-ok-dot",
  PENDING: "bg-wait-dot",
  CANCELLED: "bg-no-dot",
};

const NAV: readonly { label: string; icon: LucideIcon; active?: boolean }[] = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Calendar", icon: ListOrdered },
  { label: "Lessons", icon: CalendarDays },
  { label: "Students", icon: Users },
  { label: "Pieces", icon: Music },
  { label: "Reports", icon: FileText },
  { label: "Payments", icon: WalletCards },
  { label: "Profile", icon: UserRound },
];

const BADGE_TONE: Record<"ok" | "wait", string> = {
  ok: "bg-ok-bg text-ok-fg",
  wait: "bg-wait-bg text-wait-fg",
};

const KPIS: readonly {
  label: string;
  value: string;
  badge: string;
  tone: "ok" | "wait";
}[] = [
  { label: "This month", value: "₹86,400", badge: "+12.5%", tone: "ok" },
  { label: "Missed lessons", value: "3", badge: "₹2,400 lost", tone: "wait" },
  {
    label: "Collected last month",
    value: "₹74,200",
    badge: "88% paid",
    tone: "ok",
  },
  { label: "Outstanding", value: "₹9,600", badge: "2 families", tone: "wait" },
];

const TODAY_ROWS: readonly {
  initials: string;
  name: string;
  time: string;
  mins: string;
  status: Status;
  avatar: string;
}[] = [
  {
    initials: "AM",
    name: "Aarav M.",
    time: "4:00 PM",
    mins: "45 min",
    status: "COMPLETE",
    avatar: "bg-pink-100 text-pink-700",
  },
  {
    initials: "IR",
    name: "Ishita R.",
    time: "5:00 PM",
    mins: "60 min",
    status: "COMPLETE",
    avatar: "bg-teal-100 text-teal-700",
  },
  {
    initials: "MS",
    name: "Meera S.",
    time: "6:15 PM",
    mins: "45 min",
    status: "PENDING",
    avatar: "bg-pink-100 text-pink-700",
  },
  {
    initials: "KT",
    name: "Kabir T.",
    time: "7:30 PM",
    mins: "30 min",
    status: "CANCELLED",
    avatar: "bg-teal-100 text-teal-700",
  },
];

/* Six months of earnings, plotted by hand in a 240×96 box. The curve is drawn
   as cubics whose control points sit on the segment midpoints, which is what
   gives it the soft "reporting chart" bend without a charting library. */
const TREND_MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"] as const;
const TREND_DOTS = [
  { x: 10, y: 68 },
  { x: 54, y: 55.2 },
  { x: 98, y: 59.5 },
  { x: 142, y: 42.4 },
  { x: 186, y: 29.6 },
] as const;
const TREND_LINE =
  "M10 68 C32 68 32 55.2 54 55.2 C76 55.2 76 59.5 98 59.5 " +
  "C120 59.5 120 42.4 142 42.4 C164 42.4 164 29.6 186 29.6 " +
  "C208 29.6 208 19.1 226 19.1";
const TREND_AREA = `${TREND_LINE} L226 86 L10 86 Z`;

/* March 2026 starts on a Sunday, so a Sunday-first grid holds the whole month
   plus four April days in exactly five rows — no sixth row to squeeze in. */
const CAL_CELLS = Array.from({ length: 35 }, (_, i) => i);
const CAL_WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const TODAY_DAY = 17;
const DRAG_FROM = 19;
const DRAG_TO = 24;

const MARCH: Record<
  number,
  { chips: readonly { name: string; status: Status }[]; more?: number }
> = {
  2: { chips: [{ name: "Aarav", status: "COMPLETE" }] },
  3: {
    chips: [
      { name: "Meera", status: "COMPLETE" },
      { name: "Ishita", status: "COMPLETE" },
    ],
  },
  5: { chips: [{ name: "Kabir", status: "CANCELLED" }] },
  6: {
    chips: [
      { name: "Riya", status: "COMPLETE" },
      { name: "Dev", status: "COMPLETE" },
    ],
    more: 2,
  },
  9: { chips: [{ name: "Aarav", status: "COMPLETE" }] },
  10: {
    chips: [
      { name: "Meera", status: "COMPLETE" },
      { name: "Nila", status: "COMPLETE" },
    ],
  },
  12: { chips: [{ name: "Kabir", status: "CANCELLED" }] },
  13: {
    chips: [
      { name: "Riya", status: "COMPLETE" },
      { name: "Dev", status: "COMPLETE" },
    ],
  },
  16: { chips: [{ name: "Aarav", status: "COMPLETE" }] },
  17: {
    chips: [
      { name: "Ishita", status: "COMPLETE" },
      { name: "Meera", status: "PENDING" },
    ],
    more: 2,
  },
  18: { chips: [{ name: "Kabir", status: "PENDING" }] },
  20: {
    chips: [
      { name: "Riya", status: "PENDING" },
      { name: "Dev", status: "PENDING" },
    ],
  },
  23: { chips: [{ name: "Aarav", status: "PENDING" }] },
  25: { chips: [{ name: "Meera", status: "PENDING" }], more: 1 },
  26: { chips: [{ name: "Nila", status: "PENDING" }] },
  27: {
    chips: [
      { name: "Riya", status: "PENDING" },
      { name: "Dev", status: "PENDING" },
    ],
  },
};

const ANNOTATIONS: readonly { title: string; body: string }[] = [
  {
    title: "Rates are frozen per lesson",
    body: "Every lesson stores the rate it was booked at. Raise a student's rate in March and only April re-prices — February stays exactly as you billed it.",
  },
  {
    title: "The calendar only fetches the month you are on",
    body: "Move to April and it asks for April. Jumping back to January does not re-download the year, so a studio with two years of history still opens instantly.",
  },
  {
    title: "One timezone, everywhere",
    body: "Times are stored as UTC and bucketed by your IANA zone on the server, so a 9pm lesson dragged to Thursday never quietly lands on Wednesday.",
  },
];

/**
 * A browser window around a mockup. Screenshots of an app read as "this is
 * real" in a way a bare card never does, and the chrome also draws an honest
 * line around what is a picture and what is the page.
 *
 * Accessibility: the mockup is hundreds of decorative divs describing one
 * screen, so the frame is a single `role="img"` with a written-out sentence and
 * everything inside is hidden. Nothing inside is a button or a link — a
 * focusable control inside aria-hidden content is a trap.
 */
function BrowserFrame({
  label,
  alt,
  children,
}: {
  label: string;
  alt: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="img"
      aria-label={alt}
      className="overflow-hidden rounded-2xl border border-(--line) bg-white shadow-(--sh-xl)"
    >
      <div
        aria-hidden="true"
        className="bg-floss relative flex h-9 items-center gap-1.5 border-b border-(--line) px-3"
      >
        <span className="bg-bubblegum size-2.5 rounded-full" />
        <span className="bg-sand-300 size-2.5 rounded-full" />
        <span className="bg-wintergreen size-2.5 rounded-full" />
        <span className="text-ink-faint absolute left-1/2 max-w-[62%] -translate-x-1/2 truncate rounded-full border border-(--line) bg-white px-3 py-0.5 text-[11px]">
          {label}
        </span>
      </div>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

/** One lesson status pill. Used in the day table and in every calendar chip. */
function StatusChip({
  status,
  label,
  className,
}: {
  status: Status;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
        CHIP_TONE[status],
        className,
      )}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", CHIP_DOT[status])}
      />
      <span className="truncate">{label}</span>
    </span>
  );
}

/**
 * The section that has to sell the thing: two hand-built miniatures of the real
 * dashboard and calendar, sized down with type scale rather than a CSS
 * transform so they stay crisp and keep reflowing at every breakpoint.
 *
 * The looping drag-and-drop is a shared-layout animation (one chip, two homes)
 * rather than hard-coded pixel offsets, so the lesson lands dead centre in its
 * new cell at 360px and at 1920px alike.
 */
export function ShowcaseStudio() {
  const reduced = useStableReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  // No `once`: the loop has to stop again on the way out, not just start late.
  const inView = useInView(sectionRef, { amount: 0.3 });
  const [moved, setMoved] = useState(false);
  const [lifted, setLifted] = useState(false);

  // Gated on visibility. Each cycle re-renders the mockup and drives a
  // shared-layout animation, which forces a layout read — not something to pay
  // for every 3.4 seconds while the visitor is parked in the footer.
  useEffect(() => {
    if (reduced || !inView) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const cycle = () => {
      // Lift, then move a beat later, then set down — the same three moments a
      // real drag has.
      setLifted(true);
      timers.push(setTimeout(() => setMoved((m) => !m), 260));
      timers.push(setTimeout(() => setLifted(false), 1050));
    };
    const id = setInterval(cycle, 3400);
    return () => {
      clearInterval(id);
      timers.forEach(clearTimeout);
    };
  }, [reduced, inView]);

  return (
    <section
      id="studio"
      ref={sectionRef}
      aria-labelledby="studio-title"
      className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <SectionHeading
        id="studio-title"
        tone="mint"
        eyebrow="Your morning, in one look"
        title="Open it and you already know your day"
        lead="Who is coming this evening, who still owes you for February, and how the month is tracking — all on one screen."
      />

      <div className="mx-auto mt-12 grid max-w-6xl gap-8 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start lg:gap-10">
        <div className="min-w-0 space-y-8">
          {/* ── Mockup 1: the dashboard ─────────────────────────────────── */}
          <Reveal>
            <BrowserFrame
              label="mypianodiary.app/dashboard"
              alt="A mockup of the My Piano Diary dashboard: a greeting band reading four lessons today and ₹4,800 expected, four figure cards for this month's earnings, missed lessons, money collected last month and what is still outstanding, a table of today's four lessons with complete, pending and cancelled statuses, and a six-month earnings trend chart."
            >
              <div className="flex">
                {/* Sidebar rail — the real shell hides it below 1024px too. */}
                <div className="hidden w-36 shrink-0 flex-col gap-2 border-r border-(--line) bg-white p-2.5 md:flex lg:w-40">
                  <div className="flex items-center gap-1.5 px-1 pb-1">
                    <LogoMark size={20} />
                    <span className="text-ink text-[11px] font-semibold">
                      My Piano Diary
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    {NAV.map((item) => (
                      <span
                        key={item.label}
                        className={cn(
                          "flex items-center gap-2 rounded-lg px-2 py-1.5 text-[11px] font-medium",
                          item.active
                            ? "bg-pink-100 text-pink-700"
                            : "text-ink-soft",
                        )}
                      >
                        <item.icon className="size-3.5 shrink-0" />
                        {item.label}
                      </span>
                    ))}
                  </div>
                </div>

                {/* The app-shell wash, applied inline rather than via .bg-app:
                    that helper pins the gradient to the viewport, which inside a
                    120mm-tall mockup samples one flat slice of it. */}
                <div
                  className="min-w-0 flex-1 space-y-2.5 p-2.5 sm:p-3"
                  style={{ background: "var(--app-bg)" }}
                >
                  {/* Mini hero — the one scallop in this whole section. */}
                  <div className="hero-band scallop-b relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl px-3 py-3 sm:px-4">
                    <div className="min-w-0">
                      <p className="text-ink font-serif text-[15px] leading-tight font-bold sm:text-base">
                        Good morning, Soham ✨
                      </p>
                      <p className="mt-1 text-[10px] font-medium text-pink-700 italic">
                        Tuesday, March 17th
                      </p>
                      <p className="text-ink-soft mt-1 flex items-center gap-1 text-[10px] sm:text-[11px]">
                        <Blossom className="text-bubblegum" size={10} />4
                        lessons today · ₹4,800 expected
                      </p>
                    </div>
                    <Mochi
                      size={64}
                      bob
                      mood="content"
                      className="pointer-events-none hidden shrink-0 sm:block"
                    />
                  </div>

                  {/* KPI row */}
                  <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                    {KPIS.map((kpi) => (
                      <div
                        key={kpi.label}
                        className="rounded-xl border border-(--line) bg-white p-2 shadow-(--sh-xs)"
                      >
                        <p className="text-ink-soft truncate text-[9px] font-medium">
                          {kpi.label}
                        </p>
                        <p className="text-ink mt-0.5 text-sm font-bold tabular-nums">
                          {kpi.value}
                        </p>
                        <span
                          className={cn(
                            "mt-1 inline-block rounded-full px-1.5 py-0.5 text-[8px] font-semibold",
                            BADGE_TONE[kpi.tone],
                          )}
                        >
                          {kpi.badge}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-2 lg:grid-cols-5">
                    {/* Today's lessons */}
                    <div className="rounded-xl border border-(--line) bg-white p-2.5 shadow-(--sh-xs) lg:col-span-3">
                      <div className="flex items-center justify-between">
                        <p className="text-ink text-[11px] font-semibold">
                          Today&apos;s lessons
                        </p>
                        <span className="text-ink-faint text-[9px]">
                          4 booked
                        </span>
                      </div>
                      <div className="mt-2 divide-y divide-(--line)">
                        {TODAY_ROWS.map((row) => (
                          <div
                            key={row.name}
                            className="flex items-center gap-2 py-1.5"
                          >
                            <span
                              className={cn(
                                "flex size-6 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold",
                                row.avatar,
                              )}
                            >
                              {row.initials}
                            </span>
                            <span className="text-ink min-w-0 flex-1 truncate text-[10px] font-medium">
                              {row.name}
                            </span>
                            <span className="text-ink-soft shrink-0 text-[10px] tabular-nums">
                              {row.time}
                            </span>
                            <span className="text-ink-faint hidden shrink-0 text-[10px] tabular-nums sm:inline">
                              {row.mins}
                            </span>
                            <StatusChip
                              status={row.status}
                              label={row.status.toLowerCase()}
                              className="shrink-0 capitalize"
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Earnings trend */}
                    <div className="rounded-xl border border-(--line) bg-white p-2.5 shadow-(--sh-xs) lg:col-span-2">
                      <p className="text-ink text-[11px] font-semibold">
                        Earnings trend
                      </p>
                      <p className="text-ink-faint text-[9px]">
                        Last 6 months · ₹86,400 in March
                      </p>
                      <svg
                        viewBox="0 0 240 96"
                        className="mt-1.5 h-auto w-full"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <defs>
                          {/* An SVG restatement of --grad-pink: a CSS gradient
                              cannot be an SVG fill, so the stops borrow the same
                              tokens the utility does. */}
                          <linearGradient
                            id="mpd-studio-trend"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="0%"
                              stopColor="var(--pink-600)"
                              stopOpacity="0.28"
                            />
                            <stop
                              offset="100%"
                              stopColor="var(--pink-600)"
                              stopOpacity="0.02"
                            />
                          </linearGradient>
                        </defs>
                        <g
                          stroke="var(--line-strong)"
                          strokeWidth="1"
                          strokeDasharray="3 5"
                        >
                          <line x1="10" y1="30" x2="226" y2="30" />
                          <line x1="10" y1="58" x2="226" y2="58" />
                        </g>
                        <path d={TREND_AREA} fill="url(#mpd-studio-trend)" />
                        <motion.path
                          d={TREND_LINE}
                          fill="none"
                          // pink-500 rather than raw bubblegum: a chart line is
                          // a graphical object and has to clear 3:1 on white.
                          stroke="var(--pink-500)"
                          strokeWidth="2.4"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={reduced ? undefined : { pathLength: 0 }}
                          whileInView={reduced ? undefined : { pathLength: 1 }}
                          viewport={{ once: true, amount: 0.4 }}
                          transition={{ duration: 1.3, ease: "easeOut" }}
                        />
                        {TREND_DOTS.map((dot) => (
                          <circle
                            key={dot.x}
                            cx={dot.x}
                            cy={dot.y}
                            r="2.6"
                            fill="#ffffff"
                            stroke="var(--pink-500)"
                            strokeWidth="1.6"
                          />
                        ))}
                        {/* The peak month gets a blossom instead of a dot. */}
                        <Blossom
                          x={218}
                          y={11}
                          size={16}
                          className="text-bubblegum"
                        />
                      </svg>
                      <div className="text-ink-faint mt-1 flex justify-between px-1 text-[8px]">
                        {TREND_MONTHS.map((m) => (
                          <span key={m}>{m}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </BrowserFrame>
          </Reveal>

          {/* ── Mockup 2: the calendar ──────────────────────────────────── */}
          <Reveal>
            <div>
              <BrowserFrame
                label="mypianodiary.app/calendar"
                alt="A mockup of the calendar: March 2026 in month view, with colour-coded lesson chips spread across the weeks, two chips and a plus-two-more on the seventeenth, and one lesson being dragged from Thursday the nineteenth to Tuesday the twenty-fourth."
              >
                {/* Same inline wash as the dashboard frame above, and for the
                    same reason: .bg-app pins the gradient to the viewport, so
                    inside a short mockup it paints one flat slice that slides
                    as you scroll — and the two frames would disagree about what
                    the app's background looks like. */}
                <div
                  className="p-2.5 sm:p-3"
                  style={{ background: "var(--app-bg)" }}
                >
                  {/* Toolbar */}
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="flex size-5 items-center justify-center rounded-full border border-(--line) bg-white text-teal-700">
                        <ChevronLeft className="size-3" />
                      </span>
                      <span className="text-ink font-serif text-xs font-bold sm:text-sm">
                        March 2026
                      </span>
                      <span className="flex size-5 items-center justify-center rounded-full border border-(--line) bg-white text-teal-700">
                        <ChevronRight className="size-3" />
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="bg-floss flex items-center gap-0.5 rounded-full border border-(--line) p-0.5">
                        {["Month", "Week", "Day"].map((view) => (
                          <span
                            key={view}
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[9px] font-semibold",
                              view === "Month"
                                ? "bg-white text-pink-700 shadow-(--sh-xs)"
                                : "text-ink-soft",
                            )}
                          >
                            {view}
                          </span>
                        ))}
                      </div>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-semibold text-white shadow-(--sh-pink)"
                        style={{ background: "var(--grad-pink)" }}
                      >
                        <Plus className="size-2.5" />
                        New lesson
                      </span>
                    </div>
                  </div>

                  {/* Weekday headers */}
                  <div className="mb-1 grid grid-cols-7 gap-0.5 sm:gap-1">
                    {CAL_WEEKDAYS.map((d) => (
                      <span
                        key={d}
                        className="text-ink-soft truncate text-center text-[8px] font-semibold sm:text-[9px]"
                      >
                        {d}
                      </span>
                    ))}
                  </div>

                  {/* Month grid */}
                  <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                    {CAL_CELLS.map((i) => {
                      const cellNumber = i + 1;
                      const outside = cellNumber > 31;
                      const day = outside ? cellNumber - 31 : cellNumber;
                      const entry = outside ? undefined : MARCH[day];
                      const isToday = !outside && day === TODAY_DAY;
                      const holdsDrag =
                        !outside &&
                        ((day === DRAG_FROM && !moved) ||
                          (day === DRAG_TO && moved));

                      return (
                        <div
                          key={i}
                          className={cn(
                            "flex min-h-9.5 flex-col gap-0.5 rounded-lg border border-(--line) p-1 sm:min-h-14",
                            outside ? "bg-floss/70" : "bg-white",
                            isToday && "ring-bubblegum bg-pink-50 ring-2",
                          )}
                        >
                          <span
                            className={cn(
                              "text-[8px] font-semibold tabular-nums sm:text-[9px]",
                              outside
                                ? "text-ink-faint"
                                : isToday
                                  ? "text-pink-700"
                                  : "text-ink-soft",
                            )}
                          >
                            {day}
                          </span>

                          {entry?.chips.map((chip) => (
                            <StatusChip
                              key={chip.name}
                              status={chip.status}
                              label={chip.name}
                              className="w-full rounded-md px-1 py-0 text-[8px] sm:text-[9px]"
                            />
                          ))}

                          {holdsDrag ? (
                            <motion.span
                              layoutId="mpd-studio-drag-chip"
                              transition={{
                                layout: {
                                  duration: 0.72,
                                  ease: [0.22, 1, 0.36, 1],
                                },
                              }}
                              animate={{ scale: lifted ? 1.09 : 1 }}
                              className={cn(
                                "flex w-full items-center gap-1 rounded-md px-1 py-0 text-[8px] font-medium sm:text-[9px]",
                                CHIP_TONE.PENDING,
                                lifted &&
                                  "relative z-10 shadow-(--sh-pink) ring-1 ring-pink-400",
                              )}
                            >
                              <span
                                className={cn(
                                  "size-1.5 shrink-0 rounded-full",
                                  CHIP_DOT.PENDING,
                                )}
                              />
                              <span className="truncate">Tara</span>
                            </motion.span>
                          ) : null}

                          {entry?.more ? (
                            <span className="text-ink-faint text-[7px] font-medium sm:text-[8px]">
                              +{entry.more} more
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </BrowserFrame>
              <p className="text-ink-soft mt-3 text-center text-sm">
                Drag a lesson to reschedule it — the new time is written back in
                your timezone, not the server&apos;s.
              </p>
            </div>
          </Reveal>
        </div>

        {/* Annotations: a rail beside the frames on lg, a three-up row under
            them on tablets, one per line on a phone. */}
        <div className="grid gap-4 sm:grid-cols-3 lg:sticky lg:top-24 lg:grid-cols-1">
          {ANNOTATIONS.map((note) => (
            <Reveal key={note.title}>
              <div className="h-full rounded-2xl border border-(--line) bg-white p-4 shadow-(--sh-sm)">
                <p className="text-ink flex items-start gap-2 text-sm font-semibold">
                  <Blossom
                    size={13}
                    className="text-bubblegum mt-0.5 shrink-0"
                  />
                  {note.title}
                </p>
                <p className="text-ink-soft mt-2 text-[13px] leading-relaxed">
                  {note.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
