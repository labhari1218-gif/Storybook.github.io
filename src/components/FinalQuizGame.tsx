import { useEffect, useMemo, useState } from "react";
import type { BookScreen, ScoreLabel } from "../lib/book";

type Props = {
  screen: BookScreen;
};

type QuizPhase = "intro" | "question" | "feedback" | "complete";
type AnswerResult = "correct" | "wrong" | "timeout" | null;

function getScoreBand(score: number, scoreLabels: ScoreLabel[]) {
  return scoreLabels.find((band) => score >= band.min && score <= band.max) ?? scoreLabels[0];
}

export default function FinalQuizGame({ screen }: Props) {
  const questions = screen.questions ?? [];
  const scoreLabels = screen.scoreLabels ?? [];
  const [phase, setPhase] = useState<QuizPhase>("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(questions[0]?.timerSeconds ?? 10);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<AnswerResult>(null);
  const [totalScore, setTotalScore] = useState(0);

  const currentQuestion = questions[currentQuestionIndex];
  const scoreBand = useMemo(() => {
    if (!scoreLabels.length) {
      return undefined;
    }

    return getScoreBand(totalScore, scoreLabels);
  }, [scoreLabels, totalScore]);

  useEffect(() => {
    if (phase !== "question" || !currentQuestion) {
      return;
    }

    if (remainingSeconds <= 0) {
      setAnswerResult("timeout");
      setPhase("feedback");
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setRemainingSeconds((seconds) => seconds - 1);
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [currentQuestion, phase, remainingSeconds]);

  useEffect(() => {
    if (phase !== "feedback" || !currentQuestion) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      if (currentQuestionIndex === questions.length - 1) {
        setPhase("complete");
        return;
      }

      const nextQuestion = questions[currentQuestionIndex + 1];
      setCurrentQuestionIndex((index) => index + 1);
      setSelectedIndex(null);
      setAnswerResult(null);
      setRemainingSeconds(nextQuestion?.timerSeconds ?? 10);
      setPhase("question");
    }, 1200);

    return () => window.clearTimeout(timeoutId);
  }, [currentQuestion, currentQuestionIndex, phase, questions]);

  const startQuiz = () => {
    setPhase("question");
    setCurrentQuestionIndex(0);
    setSelectedIndex(null);
    setAnswerResult(null);
    setTotalScore(0);
    setRemainingSeconds(questions[0]?.timerSeconds ?? 10);
  };

  const replayQuiz = () => {
    startQuiz();
  };

  const handleAnswer = (optionIndex: number) => {
    if (!currentQuestion || phase !== "question" || selectedIndex !== null) {
      return;
    }

    setSelectedIndex(optionIndex);
    const isCorrect = optionIndex === currentQuestion.correctIndex;

    if (isCorrect) {
      setTotalScore((score) => score + 100 + remainingSeconds * 5);
    }

    setAnswerResult(isCorrect ? "correct" : "wrong");
    setPhase("feedback");
  };

  const handleContinue = () => {
    if (!currentQuestion) {
      return;
    }

    if (currentQuestionIndex === questions.length - 1) {
      setPhase("complete");
      return;
    }

    const nextQuestion = questions[currentQuestionIndex + 1];
    setCurrentQuestionIndex((index) => index + 1);
    setSelectedIndex(null);
    setAnswerResult(null);
    setRemainingSeconds(nextQuestion?.timerSeconds ?? 10);
    setPhase("question");
  };

  if (!currentQuestion || !scoreLabels.length) {
    return (
      <div data-stop-tap className="mt-4 rounded-[28px] border border-[rgba(118,85,57,0.14)] bg-[rgba(255,252,246,0.42)] px-6 py-8">
        <p className="storybook-kicker text-[var(--accent)]">{screen.chapterTitle}</p>
        <h1 className="storybook-title mt-3 text-[2.1rem] leading-[0.95] text-[var(--ink-soft)]">
          Quiz content is missing
        </h1>
      </div>
    );
  }

  const questionNumber = currentQuestionIndex + 1;
  const progress = phase === "intro" ? 0 : Math.max(0, Math.min(100, (remainingSeconds / currentQuestion.timerSeconds) * 100));
  const correctIndex = currentQuestion.correctIndex;
  const visualIsPhoto = currentQuestion.imageMeta?.presentation === "photo";

  return (
    <div
      data-stop-tap
      className="mt-4 flex h-full flex-col rounded-[28px] border border-[rgba(118,85,57,0.14)] bg-[rgba(255,252,246,0.42)] px-5 pb-5 pt-4"
    >
      {phase === "intro" ? (
        <div className="my-auto">
          <p className="storybook-kicker text-[var(--accent)]">{screen.chapterTitle}</p>
          <h1 className="storybook-title mt-3 text-[2.15rem] leading-[0.94] text-[var(--ink-soft)]">
            {screen.quizTitle ?? screen.heading}
          </h1>
          <p className="mt-3 max-w-[20rem] text-[1rem] italic leading-6 text-[var(--ink-muted)]">
            {screen.hook}
          </p>
          <p className="mt-5 rounded-[22px] border border-[rgba(154,79,43,0.14)] bg-[rgba(154,79,43,0.06)] px-4 py-4 text-[1rem] leading-7 text-[var(--ink-soft)]">
            {screen.quizIntro ?? screen.body}
          </p>
          <div className="mt-5 grid gap-2 text-[0.92rem] text-[var(--ink-muted)]">
            <p>One phone. One round. Five questions.</p>
            <p>Play together and beat the clock before the book closes.</p>
          </div>
          <button
            type="button"
            data-stop-tap
            data-testid="quiz-start"
            onClick={startQuiz}
            className="mt-6 w-full rounded-[22px] bg-[var(--accent)] px-4 py-3 text-[0.98rem] font-semibold text-[rgba(255,248,241,0.98)] transition hover:bg-[var(--accent-soft)]"
          >
            Start quiz
          </button>
        </div>
      ) : null}

      {phase === "question" || phase === "feedback" ? (
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="storybook-kicker text-[var(--accent)]">Baahubali quiz</p>
              <p className="mt-1 text-[0.82rem] text-[var(--ink-muted)]">
                Question {questionNumber} / {questions.length}
              </p>
            </div>
            <p
              data-testid="quiz-score-running"
              className="rounded-full border border-[rgba(118,85,57,0.14)] px-3 py-1 text-[0.82rem] text-[var(--ink-soft)]"
            >
              Score {totalScore}
            </p>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-[0.82rem] text-[var(--ink-muted)]">
              <span>Beat the clock</span>
              <span data-testid="quiz-timer">{String(remainingSeconds).padStart(2, "0")}s left</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-[rgba(118,85,57,0.12)]">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-700 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div
            data-testid="quiz-clue-card"
            className="mt-5 rounded-[24px] border border-[rgba(118,85,57,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.36),rgba(248,239,226,0.92))] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="storybook-kicker text-[var(--accent)]">Guess this character</p>
                <h2 className="mt-2 text-[1.35rem] font-semibold leading-7 text-[var(--ink-soft)]">
                  {currentQuestion.clueTitle}
                </h2>
              </div>
              {currentQuestion.imageMeta ? (
                <div
                  data-testid="quiz-visual"
                  className={[
                    "overflow-hidden border border-[rgba(154,79,43,0.18)] bg-[rgba(154,79,43,0.08)]",
                    visualIsPhoto
                      ? "h-20 w-20 shrink-0 rounded-[20px] p-0"
                      : "flex h-16 w-16 items-center justify-center rounded-[18px] p-2",
                  ].join(" ")}
                >
                  <img
                    src={currentQuestion.imageMeta.asset.src}
                    width={currentQuestion.imageMeta.asset.width}
                    height={currentQuestion.imageMeta.asset.height}
                    alt={currentQuestion.imageAlt ?? currentQuestion.clueTitle ?? "Quiz visual"}
                    className={visualIsPhoto ? "h-full w-full object-cover object-top" : "h-full w-full object-contain"}
                    draggable={false}
                  />
                </div>
              ) : null}
            </div>
            <p className="mt-3 text-[0.96rem] leading-7 text-[var(--ink-muted)]">{currentQuestion.clueText}</p>
          </div>

          <div className="mt-5">
            <h3
              data-testid="quiz-prompt"
              className="storybook-title text-[1.8rem] leading-[1] text-[var(--ink-soft)]"
            >
              {currentQuestion.prompt}
            </h3>
          </div>

          <div className="mt-5 grid gap-2.5">
            {currentQuestion.options.map((option, optionIndex) => {
              const isSelected = selectedIndex === optionIndex;
              const isCorrect = optionIndex === correctIndex;
              const showFeedback = phase === "feedback";

              return (
                <button
                  key={option}
                  type="button"
                  data-stop-tap
                  data-testid={`quiz-option-${optionIndex}`}
                  onClick={() => handleAnswer(optionIndex)}
                  disabled={phase !== "question"}
                  className={[
                    "rounded-[20px] border px-4 py-3 text-left text-[0.98rem] leading-6 transition",
                    showFeedback && isCorrect
                      ? "border-[rgba(69,122,86,0.35)] bg-[rgba(69,122,86,0.12)] text-[var(--ink-soft)]"
                      : showFeedback && isSelected && !isCorrect
                        ? "border-[rgba(154,79,43,0.3)] bg-[rgba(154,79,43,0.1)] text-[var(--ink-soft)]"
                        : "border-[rgba(118,85,57,0.14)] bg-[rgba(255,255,255,0.34)] text-[var(--ink-soft)] hover:border-[rgba(154,79,43,0.24)]",
                  ].join(" ")}
                >
                  {option}
                </button>
              );
            })}
          </div>

          {phase === "feedback" ? (
            <div className="mt-4 rounded-[20px] border border-[rgba(118,85,57,0.14)] bg-[rgba(255,252,246,0.72)] px-4 py-3">
              <p
                data-testid="quiz-feedback"
                className={[
                  "text-[0.84rem] uppercase tracking-[0.18em]",
                  answerResult === "correct"
                    ? "text-[rgb(69,122,86)]"
                    : answerResult === "timeout"
                      ? "text-[var(--ink-muted)]"
                      : "text-[var(--accent)]",
                ].join(" ")}
              >
                {answerResult === "correct"
                  ? "Correct"
                  : answerResult === "timeout"
                    ? "Time up"
                    : "Not this one"}
              </p>
              <p className="mt-2 text-[0.95rem] leading-6 text-[var(--ink-soft)]">{currentQuestion.explanation}</p>
              <button
                type="button"
                data-stop-tap
                data-testid="quiz-next"
                onClick={handleContinue}
                className="mt-3 rounded-full border border-[rgba(118,85,57,0.16)] px-3 py-1.5 text-[0.78rem] uppercase tracking-[0.16em] text-[var(--ink-soft)]"
              >
                {questionNumber === questions.length ? "See score" : "Next"}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}

      {phase === "complete" ? (
        <div className="my-auto">
          <p className="storybook-kicker text-[var(--accent)]">Final score</p>
          <h1
            data-testid="quiz-total-score"
            className="storybook-title mt-3 text-[2.5rem] leading-[0.9] text-[var(--ink-soft)]"
          >
            {totalScore}
          </h1>
          <p className="mt-3 text-[1.08rem] font-semibold text-[var(--ink-soft)]">{scoreBand?.label}</p>
          <p className="mt-2 text-[1rem] leading-7 text-[var(--ink-muted)]">{scoreBand?.note}</p>
          <div className="mt-6 rounded-[24px] border border-[rgba(154,79,43,0.14)] bg-[rgba(154,79,43,0.06)] px-4 py-4">
            <p className="text-[0.94rem] leading-7 text-[var(--ink-soft)]">
              You reached the end of the little book. Gather the group and try once more.
            </p>
          </div>
          <button
            type="button"
            data-stop-tap
            data-testid="quiz-replay"
            onClick={replayQuiz}
            className="mt-6 w-full rounded-[22px] bg-[var(--accent)] px-4 py-3 text-[0.98rem] font-semibold text-[rgba(255,248,241,0.98)] transition hover:bg-[var(--accent-soft)]"
          >
            Play again
          </button>
        </div>
      ) : null}
    </div>
  );
}
