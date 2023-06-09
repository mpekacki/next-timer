import { test, expect, Page } from '@playwright/test';
import path from 'path';

test.beforeEach(async ({ context }) => {
  await context.addInitScript({
    path: path.join(__dirname, '..', './node_modules/sinon/pkg/sinon.js')
  });
  await context.addInitScript(() => {
    window.__clock = sinon.useFakeTimers({
      now: 1686080433051,
      shouldAdvanceTime: true
    });
  });
});

test('switch phases', async ({ page }) => {
  const app = new ApplicationRunner(page);
  await app.goToStartPage();
  await app.showsTimer(25, 0);
  await app.showsTotalTimeWorked(0, 0, 0);
  await app.showsAvailableBreakTime(0, 0, 0);
  await app.tick(2);
  await app.showsTimer(25, 0);
  await app.start();
  await app.showsWorkStatus();
  await app.tick(1);
  await app.showsTimer(24, 59);
  await app.showsTotalTimeWorked(0, 0, 1);
  await app.tick(58, 24);
  await app.showsTimer(0, 1);
  await app.tick(1);
  await app.showsTimer(5, 0);
  await app.showsBreakStatus();
  await app.showsTotalTimeWorked(0, 25, 0);
  await app.showsAvailableBreakTime(0, 5, 0);
  await app.tick(1);
  await app.showsTimer(4, 59);
  await app.tick(58, 4);
  await app.showsTimer(0, 1);
  await app.showsTotalTimeWorked(0, 25, 0);
  await app.showsAvailableBreakTime(0, 0, 1);
  await app.tick(1);
  await app.showsTimer(25, 0);
  await app.showsWorkStatus();
  await app.tick(0, 25 + 5 + 25 + 5 + 25);
  await app.showsTimer(10, 0);
  await app.showsBreakStatus();
  await app.showsAvailableBreakTime(0, 10, 0);
  await app.tick(0, 10);
  await app.showsTimer(25, 0);
  await app.showsWorkStatus();
  await app.tick(0, 25);
  await app.showsTimer(5, 0);
  await app.showsBreakStatus();
  await app.hold();
  await app.showsTimer(5, 0);
  await app.showsBreakStatus();
  await app.tick(2);
  await app.showsTimer(5, 0);
  await app.showsBreakStatus();
  await app.start();
  await app.showsTimer(5, 0);
  await app.showsBreakStatus();
  await app.tick(1);
  await app.showsTimer(4, 59);
});

test('preserve state', async ({ page }) => {
  const app = new ApplicationRunner(page);
  await app.goToStartPage();
  await app.start();
  await app.tick(2);
  await app.reload();
  await app.showsTimer(24, 58);
  await app.showsWorkStatus();
  await app.tick(1);
  await app.showsTimer(24, 57);
});


test('test log tasks', async ({ page }) => {
  const app = new ApplicationRunner(page);
  await app.goToStartPage();
  await app.enterTaskName('Pet the dog');
  await app.saveTask();
  await app.showsTask('Pet the dog');
  await app.showsTaskAsSelected('Pet the dog');
});

class ApplicationRunner {
  constructor(private page: Page) {}

  async goToStartPage() {
    await this.page.goto('http://localhost:3000/');
  }

  async reload() {
    await this.page.reload();
  }

  getStartButton() {
    return this.page.getByRole('button', { name: 'Start' });
  }

  getHoldButton() {
    return this.page.getByRole('button', { name: 'Hold' });
  }

  async start() {
    await this.getStartButton().click();
  }

  async hold() {
    await this.getHoldButton().click();
  }

  async showsTimer(minutes: number, seconds: number) {
    await expect(this.page.getByText(new RegExp(`^${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}$`))).toBeVisible();
  }

  async showsWorkStatus() {
    await expect(this.page.getByText(new RegExp('Work'))).toBeVisible();
  }

  async showsBreakStatus() {
    await expect(this.page.getByText(new RegExp('Break'))).toBeVisible();
  }

  async showsTotalTimeWorked(hours: number, minutes: number, seconds: number) {
    await expect(this.page.getByText(`Total time worked: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)).toBeVisible();
  }

  async showsAvailableBreakTime(hours: number, minutes: number, seconds: number) {
    await expect(this.page.getByText(`Available break time: ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`)).toBeVisible();
  }

  async tick(seconds: number, minutes?: number) {
    await this.page.evaluate((t) => window.__clock.tick(t), seconds * 1000 + (minutes || 0) * 60 * 1000);
  }

  async enterTaskName(taskName: string) {
    await this.page.fill('input', taskName);
  }

  async saveTask() {
    await this.page.click('button:has-text("Save")');
  }

  async showsTask(taskName: string) {
    await expect(this.page.getByText(taskName)).toBeVisible();
  }

  async showsTaskAsSelected(taskName: string) {
    await expect(this.page.getByText(taskName)).toHaveClass('selected');
  }
}