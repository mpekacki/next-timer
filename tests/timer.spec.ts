import { test, expect, Page } from '@playwright/test';
import path from 'path';

test.beforeEach(async ({ context }) => {
  await context.addInitScript({
    path: path.join(__dirname, '..', './node_modules/sinon/pkg/sinon.js')
  });
  await context.addInitScript(() => {
    window.__clock = sinon.useFakeTimers({
      now: 1686312000000, // 9 June 2023 12:00:00
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

test('jump in time', async ({ page }) => {
  const app = new ApplicationRunner(page);
  await app.goToStartPage();
  await app.start();
  await app.tick(2);
  await app.showsTimer(24, 58);
  await app.jump(0, 24);
  await app.showsTimer(0, 58);
  await app.showsWorkStatus();
  await app.showsTotalTimeWorked(0, 24, 2);
  await app.jump(58);
  await app.showsTimer(5, 0);
  await app.showsBreakStatus();
  await app.jump(30);
  await app.showsTimer(4, 30);
  await app.showsAvailableBreakTime(0, 4, 30);
  await app.jump(30, 5);
  await app.showsTimer(24, 0);
  await app.showsWorkStatus();
  await app.showsTotalTimeWorked(0, 26, 0);
  await app.showsAvailableBreakTime(0, 0, 0);
  await app.jump(1, 24 + 5 + 25 + 5 + 25);
  await app.showsTimer(9, 59);
  await app.showsBreakStatus();
  await app.showsAvailableBreakTime(0, 9, 59);
});

test('log tasks', async ({ page }) => {
  const app = new ApplicationRunner(page);
  await app.goToStartPage();
  await app.saveTask('Pet the dog');
  await app.showsTask('Pet the dog');
  await app.selectTask('Pet the dog');
  await app.start();
  await app.tick(0, 25);
  await app.showsEvent('Pet the dog', 12, 0, 12, 25);
  await app.jump(0, 5 + 25 + 5 + 25 + 5 + 25);
  await app.showsEvent('Pet the dog', 12, 30, 12, 55);
  await app.showsEvent('Pet the dog', 13, 0, 13, 25);
  await app.showsEvent('Pet the dog', 13, 30, 13, 55);
});

test('cut break early', async ({ page }) => {
  const app = new ApplicationRunner(page);
  await app.goToStartPage();
  await app.start();
  await app.tick(0, 25);
  await app.showsTimer(5, 0);
  await app.showsBreakStatus();
  await app.returnToWork();
  await app.showsTimer(25, 0);
  await app.showsWorkStatus();
  await app.showsAvailableBreakTime(0, 5, 0);
});

test('enable continuous mode', async ({ page }) => {
  const app = new ApplicationRunner(page);
  await app.goToStartPage();
  await app.enableContinuousMode();
  await app.start();
  await app.tick(0, 25);
  await app.showsTimer(25, 0);
  await app.showsWorkStatus();
  await app.showsAvailableBreakTime(0, 5, 0);
  await app.tick(0, 25);
  await app.showsTimer(25, 0);
  await app.showsWorkStatus();
  await app.showsAvailableBreakTime(0, 10, 0);
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

  async returnToWork() {
    await this.page.getByRole('button', { name: 'Return to work' }).click();
  }

  async enableContinuousMode() {
    await this.page.getByRole('checkbox', { name: 'Continuous work' }).click();
  }

  async showsTimer(minutes: number, seconds: number) {
    const expectedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    await expect(this.page.getByText(new RegExp(`^${expectedTime}$`)), `Timer should show ${expectedTime}`).toBeVisible();
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

  async saveTask(taskName: string) {
    await this.page.fill('input[placeholder="Task name"]', taskName);
    await this.page.click('button:has-text("Add task")');
  }

  async selectTask(taskName: string) {
    await this.page.locator('div').filter({ hasText: new RegExp(`^${taskName}$`) }).getByRole('radio').check();
  }

  async showsTask(taskName: string) {
    await expect(this.page.getByText(taskName)).toBeVisible();
  }

  async showsTaskAsSelected(taskName: string) {
    await expect(this.page.getByText(taskName)).toHaveClass('selected');
  }

  async showsEvent(taskName: string, startHours: number, startMinutes: number, endHours: number, endMinutes: number) {
    await expect(this.page.getByText(`${taskName} ${String(startHours).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')} - ${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`)).toBeVisible();
  }

  async tick(seconds: number, minutes?: number) {
    await this.page.evaluate((t) => window.__clock.tick(t), seconds * 1000 + (minutes || 0) * 60 * 1000);
  }

  async jump(seconds: number, minutes?: number) {
    await this.page.evaluate((t) => window.__clock.jump(t), seconds * 1000 + (minutes || 0) * 60 * 1000);
  }
}