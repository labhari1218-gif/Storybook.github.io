import { getCollection } from "astro:content";
import { imageMap, resolveImage, type ImageId, type ResolvedImage } from "./images";

export type ChapterType =
  | "story"
  | "explainer"
  | "profile"
  | "poem"
  | "place"
  | "extras"
  | "frontmatter";

export type HeroPlacement = "opening-only" | "full-chapter";

export type SourceQuality =
  | "reference"
  | "archive"
  | "folklore-adaptation"
  | "folklore-record";

export type ChapterPage = {
  heading: string;
  body: string;
  image?: ImageId;
  imageAlt?: string;
  sourceNote?: string;
  displayLines?: string[];
  translationLines?: string[];
  imageMeta?: ResolvedImage;
};

export type ResolvedChapter = {
  id: string;
  slug: string;
  order: number;
  title: string;
  subtitle?: string;
  type: ChapterType;
  hook: string;
  takeaway?: string;
  sourceLabel: string;
  sourceUrl: string;
  sourceQuality: SourceQuality;
  heroImage?: ImageId;
  heroImageAlt?: string;
  heroImageCaption?: string;
  heroPlacement: HeroPlacement;
  imageCredit?: string;
  imageLicense?: string;
  imageSourceUrl?: string;
  heroImageMeta?: ResolvedImage;
  pages: ChapterPage[];
  extras?: {
    label: string;
    value: string;
  }[];
};

export type ScreenVariant =
  | "cover"
  | "front-note"
  | "story-opening"
  | "story-text"
  | "info-page"
  | "poem-page"
  | "place-page"
  | "extras-page";

export type BookScreen = {
  id: string;
  kind: "cover" | "chapter";
  variant: ScreenVariant;
  slug: string;
  chapterTitle: string;
  chapterSubtitle?: string;
  chapterType: ChapterType | "cover";
  hook: string;
  heading: string;
  body: string;
  image?: ResolvedImage;
  imageAlt?: string;
  imageCaption?: string;
  chapterIndex: number;
  chapterCount: number;
  pageNumber: number;
  pageCount: number;
  screenNumber: number;
  totalScreens: number;
  takeaway?: string;
  extras?: {
    label: string;
    value: string;
  }[];
  displayLines?: string[];
  translationLines?: string[];
};

const coverScreenBase = {
  id: "cover",
  kind: "cover" as const,
  variant: "cover" as const,
  slug: "cover",
  chapterTitle: "A Little Book of Telugu Wonder",
  chapterSubtitle: "Stories, wit, poetry, temples, and skyward dreams",
  chapterType: "cover" as const,
  hook: "A small festive book for phone-sized reading and slow, easy page turns.",
  heading: "Open into Telugu wonder.",
  body:
    "Begin with an Ugadi welcome, wander through four quick Tenali stories, pause for a poem, visit temple hills, and end where rockets rise from the coast.",
  image: imageMap["vijayanagara-krishnadevaraya"],
  imageAlt: "Sri Krishnadevaraya associated with the Vijayanagara court",
  imageCaption: "Sri Krishnadevaraya",
  chapterIndex: 0,
  chapterCount: 0,
  pageNumber: 1,
  pageCount: 1,
  screenNumber: 1,
  totalScreens: 1,
} satisfies BookScreen;

function resolveChapter(entry: Awaited<ReturnType<typeof getCollection<"chapters">>>[number]) {
  const data = entry.data;

  return {
    ...data,
    heroImage: data.heroImage as ImageId | undefined,
    heroImageMeta: data.heroImage ? resolveImage(data.heroImage) : undefined,
    pages: data.pages.map((page) => ({
      ...page,
      image: page.image as ImageId | undefined,
      imageMeta: page.image ? resolveImage(page.image) : undefined,
    })),
  } satisfies ResolvedChapter;
}

function getVariant(chapter: ResolvedChapter, pageIndex: number): ScreenVariant {
  if (chapter.type === "frontmatter") {
    return "front-note";
  }

  if (chapter.type === "story") {
    return pageIndex === 0 ? "story-opening" : "story-text";
  }

  if (chapter.type === "poem") {
    return "poem-page";
  }

  if (chapter.type === "place") {
    return "place-page";
  }

  if (chapter.type === "extras") {
    return "extras-page";
  }

  return "info-page";
}

function getScreenImage(chapter: ResolvedChapter, page: ChapterPage, pageIndex: number) {
  if (page.imageMeta) {
    return {
      image: page.imageMeta,
      imageAlt: page.imageAlt,
    };
  }

  if (
    chapter.heroImageMeta &&
    (chapter.heroPlacement === "full-chapter" || pageIndex === 0)
  ) {
    return {
      image: chapter.heroImageMeta,
      imageAlt: chapter.heroImageAlt,
    };
  }

  return {
    image: undefined,
    imageAlt: undefined,
  };
}

export async function getChapters() {
  const entries = await getCollection("chapters");
  return entries
    .map(resolveChapter)
    .sort((left, right) => left.order - right.order);
}

export async function getBookScreens() {
  const chapters = await getChapters();
  const totalChapterScreens = chapters.reduce((count, chapter) => count + chapter.pages.length, 0);
  const totalScreens = totalChapterScreens + 1;
  const screens: BookScreen[] = [
    {
      ...coverScreenBase,
      totalScreens,
      chapterCount: chapters.length,
    },
  ];

  chapters.forEach((chapter, chapterOffset) => {
    chapter.pages.forEach((page, pageIndex) => {
      const screenImage = getScreenImage(chapter, page, pageIndex);

      screens.push({
        id: `${chapter.slug}-${pageIndex + 1}`,
        kind: "chapter",
        variant: getVariant(chapter, pageIndex),
        slug: chapter.slug,
        chapterTitle: chapter.title,
        chapterSubtitle: chapter.subtitle,
        chapterType: chapter.type,
        hook: chapter.hook,
        heading: page.heading,
        body: page.body,
        image: screenImage.image,
        imageAlt: screenImage.imageAlt,
        imageCaption: pageIndex === 0 ? chapter.heroImageCaption : undefined,
        chapterIndex: chapterOffset + 1,
        chapterCount: chapters.length,
        pageNumber: pageIndex + 1,
        pageCount: chapter.pages.length,
        screenNumber: screens.length + 1,
        totalScreens,
        takeaway: pageIndex === chapter.pages.length - 1 ? chapter.takeaway : undefined,
        extras: pageIndex === 0 ? chapter.extras : undefined,
        displayLines: page.displayLines,
        translationLines: page.translationLines,
      });
    });
  });

  return screens;
}

export async function getScreenIndexForSlug(slug?: string, page = 1) {
  const screens = await getBookScreens();

  if (!slug || slug === "cover") {
    return 0;
  }

  const screenIndex = screens.findIndex(
    (screen) => screen.slug === slug && screen.pageNumber === Math.max(1, page),
  );

  if (screenIndex >= 0) {
    return screenIndex;
  }

  const fallbackIndex = screens.findIndex((screen) => screen.slug === slug);
  return fallbackIndex >= 0 ? fallbackIndex : 0;
}

export async function getChapterBySlug(slug: string) {
  const chapters = await getChapters();
  return chapters.find((chapter) => chapter.slug === slug);
}
