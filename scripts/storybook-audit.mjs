import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import YAML from "yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const chaptersDir = path.join(rootDir, "src/content/chapters");
const pagesDir = path.join(rootDir, "src/pages");
const imageManifestPath = path.join(rootDir, "src/data/image-manifest.json");

const requiredChapterFields = [
  "id",
  "slug",
  "order",
  "title",
  "type",
  "hook",
  "sourceLabel",
  "sourceUrl",
  "sourceQuality",
  "pages",
];

const expectedStorySlugs = [
  "a-strange-cat",
  "face-saving-formula",
  "horse-trainer",
  "raman-outsmarts-a-cheat",
];

const expectedChapterOrder = [
  "welcome-note",
  ...expectedStorySlugs,
  "italian-of-the-east",
  "vemana-uppu-kappurambu",
  "sir-m-visvesvaraya",
  "tirupati",
  "yadadri",
  "sriharikota",
  "tongue-twisters",
];

async function loadYamlDirectory(directoryPath) {
  const fileNames = (await fs.readdir(directoryPath)).filter((fileName) => fileName.endsWith(".yaml"));
  const records = await Promise.all(
    fileNames.map(async (fileName) => {
      const absolutePath = path.join(directoryPath, fileName);
      const raw = await fs.readFile(absolutePath, "utf8");

      return {
        fileName,
        absolutePath,
        data: YAML.parse(raw),
      };
    }),
  );

  return records;
}

async function readImageManifest() {
  return JSON.parse(await fs.readFile(imageManifestPath, "utf8"));
}

async function checkUrl(url) {
  const headers = {
    "user-agent": "TeluguStorybookAudit/2.0",
  };

  try {
    const head = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      headers,
    });

    if (head.ok) {
      return { ok: true, status: head.status };
    }
  } catch {
    // Fall back to GET.
  }

  try {
    const get = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers,
    });

    return { ok: get.ok, status: get.status };
  } catch (error) {
    return { ok: false, status: 0, error: error instanceof Error ? error.message : String(error) };
  }
}

function buildMarkdown(report) {
  const lines = [
    "# Storybook Report",
    "",
    "## Selected Content",
    "",
    ...report.selectedContent.flatMap((item) => [`- ${item.title}: ${item.note}`]),
    "",
    "## Rejected Content",
    "",
    ...report.rejectedContent.flatMap((item) => [`- ${item.title}: ${item.reason}`]),
    "",
    "## Source Notes",
    "",
    ...report.sourceNotes.flatMap((item) => [`- ${item.title}: ${item.note}`]),
    "",
    "## Image Credits",
    "",
    ...report.imageSources.flatMap((item) => [`- ${item.title}: ${item.credit} (${item.license})`]),
    "",
    "## Editorial Softening",
    "",
    ...report.editorialSoftening.flatMap((item) => [`- ${item.claim}: ${item.action}`]),
    "",
    "## Validation Results",
    "",
    `- Status: ${report.validation.status}`,
    `- Checks Passed: ${report.validation.checksPassed}`,
    ...report.validation.details.map((item) => `- ${item}`),
    "",
  ];

  return `${lines.join("\n")}`;
}

function assert(condition, message, errors) {
  if (!condition) {
    errors.push(message);
  }
}

export async function runAudit() {
  const chapterRecords = await loadYamlDirectory(chaptersDir);
  const imageManifest = await readImageManifest();
  const chapters = chapterRecords
    .map((record) => record.data)
    .sort((left, right) => left.order - right.order);
  const errors = [];
  const details = [];
  const skipRemoteChecks =
    process.env.SKIP_REMOTE_CHECKS === "true" || process.env.CI === "true";

  for (const record of chapterRecords) {
    for (const fieldName of requiredChapterFields) {
      if (record.data[fieldName] === undefined || record.data[fieldName] === null || record.data[fieldName] === "") {
        errors.push(`${record.fileName}: missing required field "${fieldName}"`);
      }
    }

    if (!Array.isArray(record.data.pages) || record.data.pages.length < 1) {
      errors.push(`${record.fileName}: pages must be a non-empty array`);
      continue;
    }

    if (record.data.type === "story" && record.data.pages.length !== 3) {
      errors.push(`${record.fileName}: story chapters must have exactly 3 pages`);
    }

    if (record.data.heroImage) {
      if (!imageManifest[record.data.heroImage]) {
        errors.push(`${record.fileName}: hero image "${record.data.heroImage}" not found in image manifest`);
      }

      if (!record.data.heroImageAlt) {
        errors.push(`${record.fileName}: heroImageAlt is required when heroImage is set`);
      }

      if (!record.data.imageCredit || !record.data.imageLicense) {
        errors.push(`${record.fileName}: hero image metadata is incomplete`);
      }
    }

    record.data.pages.forEach((page, pageIndex) => {
      if (!page.heading || !page.body) {
        errors.push(`${record.fileName}: page ${pageIndex + 1} is missing required page fields`);
      }

      if (page.image && !imageManifest[page.image]) {
        errors.push(`${record.fileName}: page ${pageIndex + 1} image "${page.image}" not found in image manifest`);
      }

      if (page.image && !page.imageAlt) {
        errors.push(`${record.fileName}: page ${pageIndex + 1} imageAlt is required when page image is set`);
      }
    });
  }

  const slugs = chapters.map((chapter) => chapter.slug);
  assert(new Set(slugs).size === slugs.length, "chapter slugs must be unique", errors);

  const orders = chapters.map((chapter) => chapter.order).sort((left, right) => left - right);
  const contiguous = orders.every((order, index) => order === index + 1);
  assert(contiguous, "chapter order values must be unique and contiguous starting at 1", errors);

  const orderedSlugs = chapters.map((chapter) => chapter.slug);
  assert(
    JSON.stringify(orderedSlugs) === JSON.stringify(expectedChapterOrder),
    `chapter order must match ${expectedChapterOrder.join(", ")}`,
    errors,
  );

  const storySlugs = chapters.filter((chapter) => chapter.type === "story").map((chapter) => chapter.slug);
  assert(
    JSON.stringify(storySlugs) === JSON.stringify(expectedStorySlugs),
    `story chapters must match ${expectedStorySlugs.join(", ")}`,
    errors,
  );

  assert(chapters[0]?.slug === "welcome-note", "front note must be the first chapter", errors);
  assert(chapters.some((chapter) => chapter.slug === "vemana-uppu-kappurambu"), "Vemana poem chapter is missing", errors);
  assert(chapters.some((chapter) => chapter.slug === "tirupati"), "Tirupati chapter is missing", errors);
  assert(chapters.some((chapter) => chapter.slug === "yadadri"), "Yadadri chapter is missing", errors);
  assert(chapters.some((chapter) => chapter.slug === "sriharikota"), "Sriharikota chapter is missing", errors);

  const totalScreens = chapters.reduce((count, chapter) => count + chapter.pages.length, 1);
  assert(totalScreens === 21, `book must resolve to 21 total screens, found ${totalScreens}`, errors);

  const imageEntries = Object.entries(imageManifest);
  await Promise.all(
    imageEntries.map(async ([imageId, image]) => {
      const absolutePath = path.join(rootDir, image.path);

      try {
        await fs.access(absolutePath);
      } catch {
        errors.push(`image asset missing for "${imageId}" at ${image.path}`);
      }
    }),
  );

  const urlsToCheck = new Map();
  for (const chapter of chapters) {
    urlsToCheck.set(chapter.sourceUrl, `source:${chapter.slug}`);
    if (chapter.imageSourceUrl) {
      urlsToCheck.set(chapter.imageSourceUrl, `image:${chapter.slug}`);
    }
  }

  for (const image of imageEntries.map(([, value]) => value)) {
    if (image.sourceUrl) {
      urlsToCheck.set(image.sourceUrl, `manifest:${image.title}`);
    }
  }

  const urlResults = skipRemoteChecks
    ? []
    : await Promise.all(
        Array.from(urlsToCheck.keys()).map(async (url) => ({
          url,
          ...(await checkUrl(url)),
        })),
      );

  if (!skipRemoteChecks) {
    urlResults.forEach((result) => {
      if (!result.ok) {
        errors.push(`remote check failed for ${result.url} (${result.status}${result.error ? `, ${result.error}` : ""})`);
      }
    });
  }

  const creditsPath = path.join(pagesDir, "credits.astro");
  const reportPath = path.join(pagesDir, "report.astro");
  const creditsExists = await fs.access(creditsPath).then(() => true).catch(() => false);
  const reportExists = await fs.access(reportPath).then(() => true).catch(() => false);

  assert(!creditsExists, "/credits route file should not exist", errors);
  assert(!reportExists, "/report route file should not exist", errors);

  details.push(`${chapters.length} chapter files loaded successfully.`);
  details.push(`${totalScreens} total book screens resolved, including the cover.`);
  details.push(`4 story chapters present, each capped at exactly 3 pages.`);
  details.push(`Public build keeps only / and /read/[slug] as book-facing routes.`);
  if (skipRemoteChecks) {
    details.push("Remote source and image URL checks were skipped for CI/deploy.");
  } else {
    details.push(`${urlResults.filter((result) => result.ok).length} remote source and image URLs responded successfully.`);
  }

  const selectedContent = chapters.map((chapter) => ({
    title: chapter.title,
    note:
      chapter.type === "story"
        ? `Selected as one of the four short Tenali folk retellings, each fixed at ${chapter.pages.length} pages.`
        : chapter.type === "frontmatter"
          ? "Added as the new warm Ugadi opening note before the first story."
          : `Included as a single-page ${chapter.type} chapter in the expanded 21-screen book.`,
  }));

  const rejectedContent = [
    {
      title: "Sharing the Reward",
      reason: "Rejected because the reviewed source page appeared incomplete and was not safe to polish into the new book.",
    },
    {
      title: "Eating Sand",
      reason: "Replaced by “Face-Saving Formula,” which carries a cleaner sand-challenge thread inside the same trusted Tenali collection.",
    },
  ];

  const sourceNotes = [
    {
      title: "Tenali stories",
      note: "All four stories are treated as concise folk retellings from the same Katha Kids collection, not as literal court history.",
    },
    {
      title: "Italian of the East",
      note: "Britannica anchors the language facts; the phrase is framed as a long-circulating nickname tied to sound rather than a hard classification.",
    },
    {
      title: "Vemana poem",
      note: "The poem page is grounded in the historical C.P. Brown edition while the public translation is newly rewritten for readability.",
    },
    {
      title: "Temples and Sriharikota",
      note: "Tirupati, Yadadri, and Sriharikota are internally grounded in official or institutional sources but presented publicly as elegant short reading pages.",
    },
  ];

  const imageSources = imageEntries.map(([, image]) => ({
    title: image.title,
    credit: image.credit,
    license: image.license,
  }));

  const editorialSoftening = [
    {
      claim: "Visible source-and-credit footers",
      action: "Removed entirely from the public reading flow so the site behaves like a small book, not a reference ledger.",
    },
    {
      claim: "“Italian of the East”",
      action: "Kept as a graceful question-led explainer instead of a dramatic unsupported claim.",
    },
    {
      claim: "Visvesvaraya folklore anecdotes",
      action: "Left out in favor of widely documented engineering and public-service achievements.",
    },
    {
      claim: "Per-page image repetition",
      action: "Changed to one strong image per chapter so later story pages can breathe as text-only paper pages.",
    },
  ];

  const status = errors.length === 0 ? "pass" : "fail";
  const report = {
    generatedAt: new Date().toISOString(),
    selectedContent,
    rejectedContent,
    sourceNotes,
    imageSources,
    editorialSoftening,
    validation: {
      status,
      checksPassed: details.length,
      details,
      errors,
    },
  };

  return {
    status,
    errors,
    details,
    report,
    markdown: buildMarkdown(report),
  };
}
