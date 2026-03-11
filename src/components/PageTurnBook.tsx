import {
  startTransition,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
  type PointerEvent,
} from "react";
import type { BookScreen } from "../lib/book";

type Props = {
  screens: BookScreen[];
  initialScreen?: number;
};

const baseUrl = import.meta.env.BASE_URL;

function withBase(pathname: string) {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;

  if (!normalizedBase) {
    return normalizedPath;
  }

  if (normalizedBase === "/") {
    return normalizedPath;
  }

  return `${normalizedBase}${normalizedPath}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function splitBody(body: string) {
  return body.split(/\n\s*\n/).filter(Boolean);
}

function ProgressDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Progress ${current} of ${total}`}>
      {Array.from({ length: total }).map((_, index) => {
        const active = index + 1 === current;
        const near = Math.abs(index + 1 - current) <= 1;

        return (
          <span
            key={index}
            className={[
              "block h-1.5 rounded-full transition-all duration-300",
              active ? "w-7 bg-[var(--accent)]" : near ? "w-4 bg-[rgba(154,79,43,0.42)]" : "w-2 bg-[rgba(108,90,77,0.24)]",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}

function ExtrasList({
  screen,
  expanded,
  onToggle,
}: {
  screen: BookScreen;
  expanded: Record<string, boolean>;
  onToggle: (label: string) => void;
}) {
  if (!screen.extras?.length) {
    return null;
  }

  return (
    <div className="mt-5 space-y-2.5">
      {screen.extras.map((extra) => {
        const open = Boolean(expanded[extra.label]);

        return (
          <button
            key={extra.label}
            type="button"
            data-stop-tap
            onClick={() => onToggle(extra.label)}
            className="w-full rounded-[22px] border border-[rgba(118,85,57,0.18)] bg-[rgba(255,255,255,0.4)] px-4 py-3 text-left transition hover:border-[rgba(154,79,43,0.32)] hover:bg-[rgba(255,255,255,0.55)]"
          >
            <span className="block text-[0.98rem] font-semibold text-[var(--ink-soft)]">
              {extra.label}
            </span>
            <span className="mt-1 block text-[0.74rem] uppercase tracking-[0.22em] text-[var(--accent)]">
              {open ? "Try again" : "Tap to unpack"}
            </span>
            {open ? (
              <span className="mt-2 block text-[0.92rem] leading-6 text-[var(--ink-muted)]">
                {extra.value}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

function TopMeta({ screen }: { screen: BookScreen }) {
  const chapterTypeLabel =
    screen.chapterType === "frontmatter"
      ? "Front note"
      : screen.chapterType === "explainer"
        ? "Language note"
        : screen.chapterType === "profile"
          ? "Profile"
          : screen.chapterType === "poem"
            ? "Poem"
            : screen.chapterType === "place"
              ? "Place"
              : screen.chapterType === "extras"
                ? "Extras"
                : "Story";
  const sectionLabel =
    screen.kind === "cover"
      ? "Opening"
      : screen.chapterType === "story"
        ? `Tenali tale · ${screen.pageNumber} of ${screen.pageCount}`
        : `${chapterTypeLabel} · ${screen.chapterIndex} of ${screen.chapterCount}`;

  return (
    <div className="flex items-center justify-between gap-4 px-2">
      <div>
        <p className="storybook-kicker text-[var(--accent)]">{sectionLabel}</p>
        <p className="mt-1 text-[0.82rem] text-[var(--ink-muted)]">
          {String(screen.screenNumber).padStart(2, "0")} / {String(screen.totalScreens).padStart(2, "0")}
        </p>
      </div>
      <ProgressDots total={screen.totalScreens} current={screen.screenNumber} />
    </div>
  );
}

function BodyParagraphs({ body, className = "" }: { body: string; className?: string }) {
  return (
    <div className={["readable-copy", className].join(" ").trim()}>
      {splitBody(body).map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </div>
  );
}

function ImageBlock({
  screen,
  heightClass,
  overlay = true,
}: {
  screen: BookScreen;
  heightClass: string;
  overlay?: boolean;
}) {
  if (!screen.image || !screen.imageAlt) {
    return null;
  }

  return (
    <div data-testid="screen-image" className={["relative overflow-hidden", heightClass].join(" ")}>
      <img
        src={screen.image.asset.src}
        width={screen.image.asset.width}
        height={screen.image.asset.height}
        alt={screen.imageAlt}
        className="h-full w-full object-cover"
        draggable={false}
      />
      {overlay ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[rgba(32,21,14,0.28)] to-transparent" />
      ) : null}
    </div>
  );
}

function Takeaway({ screen }: { screen: BookScreen }) {
  if (!screen.takeaway) {
    return null;
  }

  return (
    <p className="mt-5 rounded-[20px] border border-[rgba(154,79,43,0.18)] bg-[rgba(154,79,43,0.07)] px-4 py-3 text-[0.94rem] italic leading-6 text-[var(--ink-soft)]">
      {screen.takeaway}
    </p>
  );
}

function CoverView({ screen }: { screen: BookScreen }) {
  return (
    <div className="mt-4 flex h-full flex-col overflow-hidden rounded-[28px] border border-[rgba(118,85,57,0.14)] bg-[rgba(255,252,246,0.34)]">
      <ImageBlock screen={screen} heightClass="h-[56%]" />
      <div className="flex h-full flex-col justify-between px-5 pb-5 pt-4">
        <div>
          <p className="storybook-kicker text-[var(--accent)]">Ugadi Pocket Book</p>
          <h1 className="storybook-title mt-3 text-[2.55rem] leading-[0.92] text-[var(--ink-soft)]">
            {screen.chapterTitle}
          </h1>
          {screen.chapterSubtitle ? (
            <p className="mt-2 max-w-[20rem] text-[1.02rem] leading-6 text-[var(--ink-muted)]">
              {screen.chapterSubtitle}
            </p>
          ) : null}
          <p className="mt-4 max-w-[19rem] text-[1rem] italic leading-6 text-[var(--ink-muted)]">
            {screen.hook}
          </p>
        </div>

        <div>
          <BodyParagraphs body={screen.body} className="space-y-3 text-[1rem] leading-7 text-[var(--ink-soft)]" />
          <p className="mt-5 text-[0.82rem] uppercase tracking-[0.18em] text-[var(--accent)]">
            Tap or swipe to begin
          </p>
        </div>
      </div>
    </div>
  );
}

function FrontNoteView({ screen }: { screen: BookScreen }) {
  return (
    <div className="mt-4 flex h-full flex-col rounded-[28px] border border-[rgba(118,85,57,0.14)] bg-[rgba(255,252,246,0.42)] px-6 pb-6 pt-8">
      <div className="my-auto">
        <p className="storybook-kicker text-[var(--accent)]">{screen.chapterSubtitle}</p>
        <h1 className="storybook-title mt-4 text-[2.5rem] leading-[0.94] text-[var(--ink-soft)]">
          {screen.heading}
        </h1>
        <p className="mt-4 max-w-[18rem] text-[1.04rem] italic leading-7 text-[var(--ink-muted)]">
          {screen.hook}
        </p>
        <div className="mt-6 h-px w-16 bg-[rgba(154,79,43,0.36)]" />
        <BodyParagraphs body={screen.body} className="mt-6 space-y-4 text-[1.05rem] leading-8 text-[var(--ink-soft)]" />
        <Takeaway screen={screen} />
      </div>
    </div>
  );
}

function StoryOpeningView({ screen }: { screen: BookScreen }) {
  return (
    <div className="mt-4 flex h-full flex-col overflow-hidden rounded-[28px] border border-[rgba(118,85,57,0.14)] bg-[rgba(255,252,246,0.42)]">
      <ImageBlock screen={screen} heightClass="h-[50%]" />
      <div className="flex h-full flex-col px-5 pb-5 pt-4">
        <p className="storybook-kicker text-[var(--accent)]">{screen.chapterTitle}</p>
        <h1 data-testid="screen-heading" className="storybook-title mt-3 text-[2.2rem] leading-[0.95] text-[var(--ink-soft)]">
          {screen.heading}
        </h1>
        <p className="mt-3 max-w-[20rem] text-[1rem] italic leading-6 text-[var(--ink-muted)]">
          {screen.hook}
        </p>
        <BodyParagraphs body={screen.body} className="mt-4 space-y-3 text-[1rem] leading-7 text-[var(--ink-soft)]" />
      </div>
    </div>
  );
}

function StoryTextView({ screen }: { screen: BookScreen }) {
  return (
    <div className="mt-4 flex h-full flex-col rounded-[28px] border border-[rgba(118,85,57,0.14)] bg-[rgba(255,252,246,0.42)] px-6 pb-6 pt-7">
      <p className="storybook-kicker text-[var(--accent)]">{screen.chapterTitle}</p>
      <div className="my-auto">
        <h1 data-testid="screen-heading" className="storybook-title text-[2.4rem] leading-[0.94] text-[var(--ink-soft)]">
          {screen.heading}
        </h1>
        <BodyParagraphs body={screen.body} className="mt-5 space-y-4 text-[1.08rem] leading-8 text-[var(--ink-soft)]" />
        <Takeaway screen={screen} />
      </div>
    </div>
  );
}

function InfoPageView({ screen }: { screen: BookScreen }) {
  return (
    <div className="mt-4 flex h-full flex-col overflow-hidden rounded-[28px] border border-[rgba(118,85,57,0.14)] bg-[rgba(255,252,246,0.42)]">
      <ImageBlock screen={screen} heightClass="h-[42%]" />
      <div className="flex h-full flex-col px-5 pb-5 pt-4">
        <p className="storybook-kicker text-[var(--accent)]">{screen.chapterTitle}</p>
        {screen.chapterSubtitle ? (
          <p className="mt-1 text-[0.95rem] text-[var(--ink-muted)]">{screen.chapterSubtitle}</p>
        ) : null}
        <h1 data-testid="screen-heading" className="storybook-title mt-3 text-[2.18rem] leading-[0.95] text-[var(--ink-soft)]">
          {screen.heading}
        </h1>
        <p className="mt-3 max-w-[20rem] text-[1rem] italic leading-6 text-[var(--ink-muted)]">
          {screen.hook}
        </p>
        <BodyParagraphs body={screen.body} className="mt-4 space-y-3 text-[1rem] leading-7 text-[var(--ink-soft)]" />
        <Takeaway screen={screen} />
      </div>
    </div>
  );
}

function PlacePageView({ screen }: { screen: BookScreen }) {
  return (
    <div className="mt-4 flex h-full flex-col overflow-hidden rounded-[28px] border border-[rgba(118,85,57,0.14)] bg-[rgba(255,252,246,0.42)]">
      <ImageBlock screen={screen} heightClass="h-[44%]" />
      <div className="flex h-full flex-col px-5 pb-5 pt-4">
        <p className="storybook-kicker text-[var(--accent)]">{screen.chapterTitle}</p>
        {screen.chapterSubtitle ? (
          <p className="mt-1 text-[0.95rem] text-[var(--ink-muted)]">{screen.chapterSubtitle}</p>
        ) : null}
        <h1 data-testid="screen-heading" className="storybook-title mt-3 text-[2.2rem] leading-[0.95] text-[var(--ink-soft)]">
          {screen.heading}
        </h1>
        <p className="mt-3 max-w-[20rem] text-[1rem] italic leading-6 text-[var(--ink-muted)]">
          {screen.hook}
        </p>
        <BodyParagraphs body={screen.body} className="mt-4 space-y-3 text-[1rem] leading-7 text-[var(--ink-soft)]" />
        <Takeaway screen={screen} />
      </div>
    </div>
  );
}

function PoemPageView({ screen }: { screen: BookScreen }) {
  return (
    <div className="mt-4 flex h-full flex-col overflow-hidden rounded-[28px] border border-[rgba(118,85,57,0.14)] bg-[rgba(255,252,246,0.42)]">
      <ImageBlock screen={screen} heightClass="h-[28%]" overlay={false} />
      <div className="flex h-full flex-col px-5 pb-5 pt-4">
        <p className="storybook-kicker text-[var(--accent)]">{screen.chapterTitle}</p>
        {screen.chapterSubtitle ? (
          <p className="mt-1 text-[0.95rem] text-[var(--ink-muted)]">{screen.chapterSubtitle}</p>
        ) : null}
        <h1 data-testid="screen-heading" className="storybook-title mt-3 text-[2rem] leading-[0.95] text-[var(--ink-soft)]">
          {screen.heading}
        </h1>

        {screen.displayLines?.length ? (
          <div className="mt-4 rounded-[24px] border border-[rgba(118,85,57,0.14)] bg-[rgba(255,255,255,0.34)] px-4 py-4 text-center text-[1rem] leading-7 text-[var(--ink-soft)]">
            {screen.displayLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}

        {screen.translationLines?.length ? (
          <div className="mt-4 rounded-[24px] border border-[rgba(154,79,43,0.16)] bg-[rgba(154,79,43,0.06)] px-4 py-4 text-center text-[0.98rem] italic leading-7 text-[var(--ink-soft)]">
            {screen.translationLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        ) : null}

        <BodyParagraphs body={screen.body} className="mt-4 space-y-3 text-[0.98rem] leading-7 text-[var(--ink-soft)]" />
        <Takeaway screen={screen} />
      </div>
    </div>
  );
}

function ExtrasPageView({
  screen,
  expanded,
  onToggleExtra,
}: {
  screen: BookScreen;
  expanded: Record<string, boolean>;
  onToggleExtra: (label: string) => void;
}) {
  return (
    <div className="mt-4 flex h-full flex-col overflow-hidden rounded-[28px] border border-[rgba(118,85,57,0.14)] bg-[rgba(255,252,246,0.42)]">
      <ImageBlock screen={screen} heightClass="h-[34%]" />
      <div className="flex h-full flex-col px-5 pb-5 pt-4">
        <p className="storybook-kicker text-[var(--accent)]">{screen.chapterTitle}</p>
        {screen.chapterSubtitle ? (
          <p className="mt-1 text-[0.95rem] text-[var(--ink-muted)]">{screen.chapterSubtitle}</p>
        ) : null}
        <h1 data-testid="screen-heading" className="storybook-title mt-3 text-[2.05rem] leading-[0.95] text-[var(--ink-soft)]">
          {screen.heading}
        </h1>
        <p className="mt-3 max-w-[20rem] text-[1rem] italic leading-6 text-[var(--ink-muted)]">
          {screen.hook}
        </p>
        <BodyParagraphs body={screen.body} className="mt-4 space-y-3 text-[0.98rem] leading-7 text-[var(--ink-soft)]" />
        <ExtrasList screen={screen} expanded={expanded} onToggle={onToggleExtra} />
        <Takeaway screen={screen} />
      </div>
    </div>
  );
}

function ScreenCard({
  screen,
  expanded,
  onToggleExtra,
  direction,
  reducedMotion,
}: {
  screen: BookScreen;
  expanded: Record<string, boolean>;
  onToggleExtra: (label: string) => void;
  direction: number;
  reducedMotion: boolean;
}) {
  return (
    <article
      key={screen.id}
      className={[
        "paper-sheet page-turn-shadow touch-highlight flex h-full flex-col rounded-[32px] px-5 pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-[calc(env(safe-area-inset-top)+1rem)]",
        reducedMotion ? "" : direction >= 0 ? "animate-page-forward" : "animate-page-backward",
      ].join(" ")}
    >
      <TopMeta screen={screen} />

      {screen.variant === "cover" ? <CoverView screen={screen} /> : null}
      {screen.variant === "front-note" ? <FrontNoteView screen={screen} /> : null}
      {screen.variant === "story-opening" ? <StoryOpeningView screen={screen} /> : null}
      {screen.variant === "story-text" ? <StoryTextView screen={screen} /> : null}
      {screen.variant === "info-page" ? <InfoPageView screen={screen} /> : null}
      {screen.variant === "poem-page" ? <PoemPageView screen={screen} /> : null}
      {screen.variant === "place-page" ? <PlacePageView screen={screen} /> : null}
      {screen.variant === "extras-page" ? (
        <ExtrasPageView
          screen={screen}
          expanded={expanded}
          onToggleExtra={onToggleExtra}
        />
      ) : null}
    </article>
  );
}

export default function PageTurnBook({ screens, initialScreen = 0 }: Props) {
  const [currentIndex, setCurrentIndex] = useState(clamp(initialScreen, 0, screens.length - 1));
  const [direction, setDirection] = useState(1);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [expandedTwisters, setExpandedTwisters] = useState<Record<string, boolean>>({});
  const dragStartX = useRef<number | null>(null);

  const screen = screens[currentIndex];

  const setIndex = (nextIndex: number) => {
    const clamped = clamp(nextIndex, 0, screens.length - 1);
    if (clamped === currentIndex) {
      return;
    }

    setDirection(clamped > currentIndex ? 1 : -1);
    startTransition(() => setCurrentIndex(clamped));
  };

  const syncUrl = useEffectEvent((nextScreen: BookScreen) => {
    const query = new URLSearchParams();
    const isReadPath = window.location.pathname.includes("/read/");

    if (nextScreen.kind === "cover") {
      window.history.replaceState({}, "", withBase("/"));
      return;
    }

    query.set("page", String(nextScreen.pageNumber));

    const path = isReadPath
      ? withBase(`/read/${nextScreen.slug}?${query.toString()}`)
      : withBase(`/?chapter=${nextScreen.slug}&${query.toString()}`);

    window.history.replaceState({}, "", path);
  });

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);

    update();
    media.addEventListener("change", update);

    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    syncUrl(screen);
  }, [screen, syncUrl]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        setIndex(currentIndex + 1);
      }

      if (event.key === "ArrowLeft") {
        setIndex(currentIndex - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [currentIndex]);

  const chapterLabel = useMemo(() => {
    if (screen.kind === "cover") {
      return "Cover";
    }

    return `${screen.chapterTitle} · page ${screen.pageNumber} of ${screen.pageCount}`;
  }, [screen]);

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    dragStartX.current = event.clientX;
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.target instanceof HTMLElement && event.target.closest("[data-stop-tap]")) {
      dragStartX.current = null;
      return;
    }

    const startX = dragStartX.current;
    dragStartX.current = null;

    if (startX == null) {
      return;
    }

    const deltaX = event.clientX - startX;
    if (Math.abs(deltaX) > 48) {
      if (deltaX < 0) {
        setIndex(currentIndex + 1);
      } else {
        setIndex(currentIndex - 1);
      }

      return;
    }

    const bounds = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - bounds.left;

    if (relativeX > bounds.width * 0.52) {
      setIndex(currentIndex + 1);
    } else if (relativeX < bounds.width * 0.48) {
      setIndex(currentIndex - 1);
    }
  };

  const toggleExtra = (label: string) => {
    setExpandedTwisters((state) => ({
      ...state,
      [label]: !state[label],
    }));
  };

  return (
    <main className="paper-stage min-h-screen px-3 py-4">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] max-w-[460px] flex-col">
        <div className="mb-3 flex items-center justify-between px-1 text-[0.8rem] text-[rgba(255,241,226,0.8)]">
          <p>Little book</p>
          <p>{chapterLabel}</p>
        </div>

        <div
          data-testid="book-surface"
          className="relative flex-1"
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
        >
          <div className="absolute inset-0 translate-y-2 rounded-[32px] border border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.04)]" />
          <ScreenCard
            screen={screen}
            expanded={expandedTwisters}
            onToggleExtra={toggleExtra}
            direction={direction}
            reducedMotion={reducedMotion}
          />
        </div>

        <nav className="mt-3 grid grid-cols-[auto,1fr,auto] items-center gap-3">
          <button
            type="button"
            data-testid="nav-cover"
            data-stop-tap
            onClick={() => setIndex(0)}
            className="rounded-full border border-[rgba(255,255,255,0.14)] px-4 py-2 text-[0.84rem] text-[rgba(255,241,226,0.9)] transition hover:border-[rgba(255,255,255,0.26)]"
          >
            Cover
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              data-testid="nav-prev"
              data-stop-tap
              onClick={() => setIndex(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="rounded-full border border-[rgba(255,255,255,0.14)] px-4 py-2 text-[0.84rem] text-[rgba(255,241,226,0.9)] transition enabled:hover:border-[rgba(255,255,255,0.26)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Previous
            </button>
            <button
              type="button"
              data-testid="nav-next"
              data-stop-tap
              onClick={() => setIndex(currentIndex + 1)}
              disabled={currentIndex === screens.length - 1}
              className="rounded-full border border-[rgba(255,255,255,0.14)] bg-[rgba(255,255,255,0.08)] px-4 py-2 text-[0.84rem] text-[rgba(255,241,226,0.95)] transition enabled:hover:border-[rgba(255,255,255,0.26)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              Next
            </button>
          </div>

          <p
            data-testid="progress-text"
            className="text-right text-[0.78rem] tracking-[0.16em] text-[rgba(255,241,226,0.66)]"
          >
            {String(currentIndex + 1).padStart(2, "0")} / {String(screens.length).padStart(2, "0")}
          </p>
        </nav>
      </div>
    </main>
  );
}
