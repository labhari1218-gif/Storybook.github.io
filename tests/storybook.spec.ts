import { expect, test } from "@playwright/test";

const base = "/Storybook.github.io";

test("book opens on cover and front note before story one", async ({ page }) => {
  await page.goto(`${base}/`);

  await expect(page.getByText("A Little Book of Telugu Wonder")).toBeVisible();
  await expect(page.getByTestId("progress-text")).toHaveText("01 / 16");

  await page.getByTestId("nav-next").click();
  await expect(page.getByText("Come in. The book begins here.")).toBeVisible();

  await page.getByTestId("nav-next").click();
  await expect(page.getByText("The court wanted the cleverest cat")).toBeVisible();
  await expect(page.getByTestId("progress-text")).toHaveText("03 / 16");
});

test("story opening has one image and later pages are text only", async ({ page }) => {
  await page.goto(`${base}/read/a-strange-cat`);

  await expect(page.getByTestId("screen-image")).toBeVisible();
  await page.getByTestId("nav-next").click();
  await expect(page.getByText("One bowl of milk changed everything")).toBeVisible();
  await expect(page.getByTestId("screen-image")).toHaveCount(0);

  await page.getByTestId("nav-next").click();
  await expect(page.getByText("Rama explained the trick")).toBeVisible();
  await expect(page.getByTestId("screen-image")).toHaveCount(0);
});

test("tap and swipe still turn pages, extras still expand, and cover reset works", async ({ page }) => {
  await page.goto(`${base}/`);

  const surface = page.getByTestId("book-surface");
  const box = await surface.boundingBox();
  if (!box) {
    throw new Error("Book surface bounding box not found");
  }

  await page.touchscreen.tap(box.x + box.width - 24, box.y + box.height / 2);
  await expect(page.getByText("Come in. The book begins here.")).toBeVisible();

  await page.touchscreen.tap(box.x + box.width - 24, box.y + box.height / 2);
  await expect(page.getByText("The court wanted the cleverest cat")).toBeVisible();

  await page.touchscreen.tap(box.x + 24, box.y + box.height / 2);
  await expect(page.getByText("Come in. The book begins here.")).toBeVisible();

  await page.goto(`${base}/read/tongue-twisters`);
  await page.getByRole("button", { name: /Yerra lorry tella lorry/i }).click();
  await expect(page.getByText(/Red lorry, white lorry/i)).toBeVisible();

  await page.getByTestId("nav-cover").click();
  await expect(page.getByText("A Little Book of Telugu Wonder")).toBeVisible();
});

test("deep links resolve correctly and public credits/report routes are gone", async ({ page }) => {
  await page.goto(`${base}/read/sir-m-visvesvaraya`);
  await expect(page.getByText("Engineer first, legend second")).toBeVisible();
  await expect(page.getByAltText(/Portrait of Sir M. Visvesvaraya/i)).toBeVisible();

  await page.goto(`${base}/read/italian-of-the-east`);
  await expect(page.getByText("Have you ever wondered why Telugu is called the Italian of the East?")).toBeVisible();

  await page.goto(`${base}/read/baahubali-quiz`);
  await expect(page.getByTestId("quiz-start")).toBeVisible();

  const creditsResponse = await page.goto(`${base}/credits`);
  expect(creditsResponse?.status()).toBe(404);

  const reportResponse = await page.goto(`${base}/report`);
  expect(reportResponse?.status()).toBe(404);
});

test("public reading flow contains no visible source links and fits mobile viewport", async ({ page }) => {
  await page.goto(`${base}/read/tirupati`);
  await expect(page.getByText("A place carried by countless footsteps")).toBeVisible();
  await expect(page.getByText(/Katha Kids|Britannica|Wikimedia|Image source/i)).toHaveCount(0);

  const heights = await page.locator("[data-testid='book-surface']").evaluate((node) => {
    const surface = node as HTMLElement;
    const article = surface.querySelector("article");
    return {
      surfaceHeight: surface.clientHeight,
      articleHeight: article instanceof HTMLElement ? article.clientHeight : 0,
      articleScrollHeight: article instanceof HTMLElement ? article.scrollHeight : 0,
    };
  });

  expect(heights.articleScrollHeight).toBeLessThanOrEqual(heights.articleHeight + 4);
});

test("quiz renders, scores, replays, and works without images", async ({ page }) => {
  await page.goto(`${base}/read/baahubali-quiz`);

  await expect(page.getByTestId("progress-text")).toHaveText("16 / 16");
  await expect(page.getByTestId("quiz-start")).toBeVisible();

  await page.getByTestId("quiz-start").click();
  await expect(page.getByTestId("quiz-clue-card")).toBeVisible();
  await expect(page.getByTestId("quiz-visual")).toBeVisible();
  await expect(page.getByTestId("screen-image")).toHaveCount(0);
  await expect(page.getByTestId("quiz-timer")).toHaveText("10s left");

  await page.waitForTimeout(1100);
  await expect(page.getByTestId("quiz-timer")).toHaveText("09s left");

  await page.getByTestId("quiz-option-0").click();
  await expect(page.getByTestId("quiz-feedback")).toHaveText("Correct");
  await expect(page.getByTestId("quiz-score-running")).not.toHaveText("Score 0");
  await page.getByTestId("quiz-next").click();

  await expect(page.getByTestId("quiz-prompt")).toHaveText("Guess this character.");
  await page.getByTestId("quiz-option-0").click();
  await expect(page.getByTestId("quiz-feedback")).toHaveText("Not this one");
  await page.getByTestId("quiz-next").click();

  await page.getByTestId("quiz-option-1").click();
  await page.getByTestId("quiz-next").click();

  await page.getByTestId("quiz-option-2").click();
  await page.getByTestId("quiz-next").click();

  await page.getByTestId("quiz-option-1").click();
  await expect(page.getByTestId("quiz-feedback")).toHaveText("Correct");
  await page.getByTestId("quiz-next").click();

  await expect(page.getByTestId("quiz-total-score")).toBeVisible();
  await expect(page.getByTestId("quiz-replay")).toBeVisible();

  await page.getByTestId("quiz-replay").click();
  await expect(page.getByTestId("quiz-prompt")).toHaveText("Guess this character.");
  await expect(page.getByTestId("quiz-score-running")).toHaveText("Score 0");
});
