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

const chapters = defineCollection({
  loader: glob({
    base: "./src/content/chapters",
    pattern: "**/*.yaml",
  }),
  schema: z.object({
    id: z.string().min(1),
    slug: z.string().min(1),
    order: z.number().int().positive(),
    title: z.string().min(1),
    subtitle: z.string().optional(),
    type: z.enum(["story", "explainer", "profile", "poem", "place", "extras", "frontmatter"]),
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
  }),
});

export const collections = {
  chapters,
};
