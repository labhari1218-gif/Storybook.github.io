import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const chapterPageSchema = z.object({
  heading: z.string().min(1),
  body: z.string().min(1),
  image: z.string().min(1).optional(),
  imageAlt: z.string().min(1).optional(),
  sourceNote: z.string().optional(),
  displayLines: z.array(z.string().min(1)).optional(),
  translationLines: z.array(z.string().min(1)).optional(),
});

const quizQuestionSchema = z.object({
  id: z.string().min(1),
  prompt: z.string().min(1),
  visualType: z.enum(["image", "clue-card"]),
  image: z.string().min(1).optional(),
  imageAlt: z.string().min(1).optional(),
  clueTitle: z.string().min(1).optional(),
  clueText: z.string().min(1).optional(),
  options: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(1),
  difficulty: z.enum(["easy", "hard"]),
  timerSeconds: z.number().int().positive(),
});

const scoreLabelSchema = z.object({
  min: z.number().int().min(0),
  max: z.number().int().min(0),
  label: z.string().min(1),
  note: z.string().min(1),
});

const chapters = defineCollection({
  loader: glob({
    base: "./src/content/chapters",
    pattern: "**/*.yaml",
  }),
  schema: z
    .object({
      id: z.string().min(1),
      slug: z.string().min(1),
      order: z.number().int().positive(),
      title: z.string().min(1),
      subtitle: z.string().optional(),
      type: z.enum(["story", "explainer", "profile", "poem", "place", "extras", "frontmatter", "game"]),
      hook: z.string().min(1),
      takeaway: z.string().optional(),
      sourceLabel: z.string().min(1),
      sourceUrl: z.string().url(),
      sourceQuality: z.enum([
        "reference",
        "archive",
        "folklore-adaptation",
        "folklore-record",
      ]),
      heroImage: z.string().min(1).optional(),
      heroImageAlt: z.string().min(1).optional(),
      heroImageCaption: z.string().min(1).optional(),
      heroPlacement: z.enum(["opening-only", "full-chapter"]).default("opening-only"),
      imageCredit: z.string().min(1).optional(),
      imageLicense: z.string().min(1).optional(),
      imageSourceUrl: z.string().url().optional(),
      pages: z.array(chapterPageSchema).min(1),
      extras: z
        .array(
          z.object({
            label: z.string().min(1),
            value: z.string().min(1),
          }),
        )
        .optional(),
      quizTitle: z.string().min(1).optional(),
      quizIntro: z.string().min(1).optional(),
      questions: z.array(quizQuestionSchema).optional(),
      scoreLabels: z.array(scoreLabelSchema).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.type !== "game") {
        return;
      }

      if (!data.questions || data.questions.length !== 5) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "game chapters must include exactly 5 questions",
          path: ["questions"],
        });
      }

      if (!data.scoreLabels?.length) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "game chapters must include scoreLabels",
          path: ["scoreLabels"],
        });
      }

      data.questions?.forEach((question, index) => {
        if (question.visualType === "image" && (!question.image || !question.imageAlt)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "image quiz questions must include image and imageAlt",
            path: ["questions", index],
          });
        }
      });
    }),
});

export const collections = {
  chapters,
};
