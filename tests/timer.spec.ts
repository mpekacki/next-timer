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
  await app.showsTask('No task');
  await app.showsTaskAsSelected('No task');
  await app.saveTask('Pet the dog');
  await app.showsTask('Pet the dog');
  await app.selectTask('Pet the dog');
  await app.start();
  await app.tick(0, 25);
  // await app.showsEvent('Pet the dog', 12, 0, 12, 25);
  await app.jump(0, 5 + 25 + 5 + 25 + 5 + 25);
  // await app.showsEvent('Pet the dog', 12, 30, 12, 55);
  // await app.showsEvent('Pet the dog', 13, 0, 13, 25);
  // await app.showsEvent('Pet the dog', 13, 30, 13, 55);
  await app.showsTimeWorkedTodayForTask('Pet the dog', 1, 40);
  await app.showsTimeWorkedThisWeekForTask('Pet the dog', 1, 40);
  await app.showsTimeWorkedThisMonthForTask('Pet the dog', 1, 40);
  await app.hold();
  await app.jump(0, 60 * 24);
  await app.start(); // not a great solution, but it works - still, it should be improved 
                     // (starting the timer causes tick() to happen, which rerenders the component, which updates totals)
  await app.tick(1);
  await app.hold();
  await app.showsTimeWorkedTodayForTask('Pet the dog', 0, 0);
  await app.showsTimeWorkedThisWeekForTask('Pet the dog', 1, 40);
  await app.showsTimeWorkedThisMonthForTask('Pet the dog', 1, 40);
  await app.jump(0, 60 * 24 * 7);
  await app.start();
  await app.tick(1);
  await app.hold();
  await app.showsTimeWorkedTodayForTask('Pet the dog', 0, 0);
  await app.showsTimeWorkedThisWeekForTask('Pet the dog', 0, 0);
  await app.showsTimeWorkedThisMonthForTask('Pet the dog', 1, 40);
  await app.jump(0, 60 * 24 * 30);
  await app.start();
  await app.tick(1);
  await app.hold();
  await app.showsTimeWorkedTodayForTask('Pet the dog', 0, 0);
  await app.showsTimeWorkedThisWeekForTask('Pet the dog', 0, 0);
  await app.showsTimeWorkedThisMonthForTask('Pet the dog', 0, 0);
});

test('log partial tasks', async ({ page }) => {
  const app = new ApplicationRunner(page);
  await app.goToStartPage();
  await app.enableContinuousMode();
  await app.saveTask('Pet the dog');
  await app.saveTask('Play games');
  await app.selectTask('Pet the dog');
  await app.start();
  await app.tick(0, 10);
  await app.selectTask('Play games');
  await app.showsTimeWorkedTodayForTask('Pet the dog', 0, 10);
  await app.tick(0, 15);
  await app.showsTimeWorkedTodayForTask('Play games', 0, 15);
  await app.tick(0, 10);
  await app.hold();
  await app.showsTimeWorkedTodayForTask('Play games', 0, 25);
  await app.tick(0, 5);
  await app.showsTimeWorkedTodayForTask('Play games', 0, 25);
  await app.start();
  await app.tick(0, 15);
  await app.showsTimeWorkedTodayForTask('Play games', 0, 40);
  await app.tick(0, 15);
  await app.break();
  await app.showsTimeWorkedTodayForTask('Play games', 0, 55);
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

test('go on a break if available', async ({ page }) => {
  const app = new ApplicationRunner(page);
  await app.goToStartPage();
  await app.enableContinuousMode();
  await app.start();
  await app.doesNotShowBreakButton();
  await app.tick(0, 25);
  await app.showsTimer(25, 0);
  await app.showsWorkStatus();
  await app.showsAvailableBreakTime(0, 5, 0);
  await app.showsBreakButton();
  await app.break();
  await app.showsTimer(5, 0);
  await app.showsBreakStatus();
  await app.showsAvailableBreakTime(0, 5, 0);
  await app.doesNotShowBreakButton();
});

test('reset' , async ({ page }) => {
  const app = new ApplicationRunner(page);
  await app.goToStartPage();
  await app.enableContinuousMode();
  await app.start();
  await app.tick(0, 25);
  await app.showsTimer(25, 0);
  await app.showsWorkStatus();
  await app.showsAvailableBreakTime(0, 5, 0);
  await app.showsTotalTimeWorked(0, 25, 0);
  await app.tick(0, 10);
  await app.showsTimer(15, 0);
  await app.reset();
  await app.showsTimer(25, 0);
  await app.showsWorkStatus();
  await app.showsAvailableBreakTime(0, 0, 0);
  await app.showsTotalTimeWorked(0, 0, 0);
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

  getBreakButton() {
    return this.page.getByRole('button', { name: 'Break' });
  }

  async start() {
    await this.getStartButton().click();
  }

  async hold() {
    await this.getHoldButton().click();
  }

  async break() {
    await this.getBreakButton().click();
  }

  async returnToWork() {
    await this.page.getByRole('button', { name: 'Return to work' }).click();
  }

  async reset() {
    await this.page.getByRole('button', { name: 'Reset' }).click();
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

  async doesNotShowBreakButton() {
    await expect(this.getBreakButton()).not.toBeVisible();
  }

  async showsBreakButton() {
    await expect(this.getBreakButton()).toBeVisible();
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
    await expect(this.page.locator('div').filter({ hasText: new RegExp(`^${taskName}$`) }).getByRole('radio')).toBeChecked();
  }

  async showsEvent(taskName: string, startHours: number, startMinutes: number, endHours: number, endMinutes: number) {
    await expect(this.page.getByText(`${taskName} ${String(startHours).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')} - ${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`)).toBeVisible();
  }

  async showsTimeWorkedTodayForTask(taskName: string, hours: number, minutes: number) {
    // the text is in the format "Task name: today 08:00, week 08:00, month 08:00"
    await expect(this.page.getByText(new RegExp(`${taskName}: today ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}, week \\d\\d:\\d\\d, month \\d\\d:\\d\\d`))).toBeVisible();
  }

  async showsTimeWorkedThisWeekForTask(taskName: string, hours: number, minutes: number) {
    await expect(this.page.getByText(new RegExp(`${taskName}: today \\d\\d:\\d\\d, week ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}, month \\d\\d:\\d\\d`))).toBeVisible();
  }

  async showsTimeWorkedThisMonthForTask(taskName: string, hours: number, minutes: number) {
    await expect(this.page.getByText(new RegExp(`${taskName}: today \\d\\d:\\d\\d, week \\d\\d:\\d\\d, month ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`))).toBeVisible();
  }

  async tick(seconds: number, minutes?: number) {
    await this.page.evaluate((t) => window.__clock.tick(t), seconds * 1000 + (minutes || 0) * 60 * 1000);
  }

  async jump(seconds: number, minutes?: number) {
    await this.page.evaluate((t) => window.__clock.jump(t), seconds * 1000 + (minutes || 0) * 60 * 1000);
  }
}