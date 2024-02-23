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
  await app.showsTimeWorkedYesterdayForTask('Pet the dog', 0, 0);
  await app.showsTimeWorkedThisWeekForTask('Pet the dog', 1, 40);
  await app.showsTimeWorkedThisMonthForTask('Pet the dog', 1, 40);
  await app.hold();
  await app.jump(0, 60 * 24);
  await app.showsTimeWorkedTodayForTask('Pet the dog', 0, 0);
  await app.showsTimeWorkedYesterdayForTask('Pet the dog', 1, 40);
  await app.showsTimeWorkedThisWeekForTask('Pet the dog', 1, 40);
  await app.showsTimeWorkedThisMonthForTask('Pet the dog', 1, 40);
  await app.jump(0, 60 * 24 * 7);
  await app.showsTimeWorkedTodayForTask('Pet the dog', 0, 0);
  await app.showsTimeWorkedYesterdayForTask('Pet the dog', 0, 0);
  await app.showsTimeWorkedThisWeekForTask('Pet the dog', 0, 0);
  await app.showsTimeWorkedThisMonthForTask('Pet the dog', 1, 40);
  await app.jump(0, 60 * 24 * 30);
  await app.doesNotShowTotalsForTask('Pet the dog');
  await app.setCustomSummaryDateRange(2023, 6, 9, 2023, 6, 9);
  await app.showsTimeWorkedForCustomPeriodForTask('Pet the dog', 1, 40);
  await app.setCustomSummaryDateRange(2024, 6, 9, 2024, 6, 9);
  await app.doesNotShowTotalsForTask('Pet the dog');
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
  await app.selectTask('Pet the dog');
  await app.showsTimeWorkedTodayForTask('Play games', 0, 55);
  await app.break();
  await app.returnToWork();
  await app.tick(0, 15);
  await app.break();
  await app.showsTimeWorkedTodayForTask('Pet the dog', 0, 25);
});

test('search tasks', async ({ page }) => {
  const app = new ApplicationRunner(page);
  await app.goToStartPage();
  await app.saveTask('Pet the dog');
  await app.saveTask('Play games');
  await app.saveTask('Walk with dog');
  await app.showsTask('No task');
  await app.showsTask('Pet the dog');
  await app.showsTask('Play games');
  await app.showsTask('Walk with dog');
  await app.fillTaskName('dog');
  await app.showsTask('Pet the dog');
  await app.showsTask('Walk with dog');
  await app.showsTask('No task');
  await app.doesNotShowTask('Play games');
  await app.fillTaskName('play');
  await app.showsTask('Play games');
  await app.showsTask('No task');
  await app.doesNotShowTask('Pet the dog');
  await app.doesNotShowTask('Walk with dog');
  await app.fillTaskName('');
  await app.showsTask('No task');
  await app.showsTask('Pet the dog');
  await app.showsTask('Play games');
  await app.showsTask('Walk with dog');
});

test('does not allow creation of duplicate tasks', async ({ page }) => {
  const app = new ApplicationRunner(page);
  await app.goToStartPage();
  await app.fillTaskName('Pet the dog');
  await app.showsAddTaskButton();
  await app.getAddTaskButton().click();
  await app.showsTask('Pet the dog');
  await app.fillTaskName('Pet the dog');
  await app.doesNotShowAddTaskButton();
  await app.fillTaskName('Walk with dog');
  await app.showsAddTaskButton();
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

test('clear task input on clear button click', async ({ page }) => {
  const app = new ApplicationRunner(page);
  await app.goToStartPage();
  await app.doesNotShowClearTaskInputButton();
  await app.fillTaskName('Pet the dog');
  await app.showsAddTaskButton();
  await app.showsClearTaskInputButton();
  await app.getClearTaskInputButton().click();
  await app.doesNotShowAddTaskButton();
  await app.doesNotShowClearTaskInputButton();
});

class ApplicationRunner {
  constructor(private page: Page) {}

  async goToStartPage() {
    await this.page.goto('http://localhost:3000/?noanimations');
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

  getAddTaskButton() {
    return this.page.getByRole('button', { name: 'Add task' });
  }

  getClearTaskInputButton() {
    return this.page.getByRole('button', { name: 'Clear' });
  }

  getTotalsRowForTask(taskName: string) {
    return this.page.locator(`td:has-text("${taskName}")`);
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
    await expect(this.page.title()).resolves.toMatch(new RegExp(`${expectedTime}`));
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

  async showsAddTaskButton() {
    await expect(this.getAddTaskButton()).toBeVisible();
  }

  async doesNotShowAddTaskButton() {
    await expect(this.getAddTaskButton()).not.toBeVisible();
  }

  async showsClearTaskInputButton() {
    await expect(this.getClearTaskInputButton()).toBeVisible();
  }

  async doesNotShowClearTaskInputButton() {
    await expect(this.getClearTaskInputButton()).not.toBeVisible();
  }

  async fillTaskName(taskName: string) {
    await this.page.fill('input[placeholder="Task name"]', taskName);
  }

  async saveTask(taskName: string) {
    await this.fillTaskName(taskName);
    await this.getAddTaskButton().click();
  }

  async selectTask(taskName: string) {
    await this.page.locator('div').filter({ hasText: new RegExp(`^${taskName}$`) }).getByRole('radio').click();
  }

  async setCustomSummaryDateRange(startYear: number, startMonth: number, startDay: number, endYear: number, endMonth: number, endDay: number) {
    const customFromInput = await this.page.$('label:has-text("Custom from") + input[type="date"]');
    const customToInput = await this.page.$('label:has-text("Custom to") + input[type="date"]');
    if (!customFromInput || !customToInput) {
      throw new Error('Could not find custom date inputs');
    }
    await customFromInput.fill(`${startYear}-${String(startMonth).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`);
    await customToInput.fill(`${endYear}-${String(endMonth).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`);
  }

  async showsTask(taskName: string) {
    await expect(this.page.getByText(taskName)).toBeVisible();
  }

  async doesNotShowTask(taskName: string) {
    await expect(this.page.getByText(taskName)).not.toBeVisible();
  }

  async showsTaskAsSelected(taskName: string) {
    await expect(this.page.locator('div').filter({ hasText: new RegExp(`^${taskName}$`) }).getByRole('radio')).toBeChecked();
    await expect(this.page.title()).resolves.toMatch(new RegExp(`${taskName}`));
  }

  async showsEvent(taskName: string, startHours: number, startMinutes: number, endHours: number, endMinutes: number) {
    await expect(this.page.getByText(`${taskName} ${String(startHours).padStart(2, '0')}:${String(startMinutes).padStart(2, '0')} - ${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`)).toBeVisible();
  }

  async validateNthTotalSlot(taskName: string, nth: number, hours: number, minutes: number) {
    // Find the table cell with the task name
    const taskNameCell = this.getTotalsRowForTask(taskName);

    // Find the corresponding time cell in the "Total" column
    const totalCell = taskNameCell.locator(`xpath=../td[${nth}]`);

    if (!totalCell) {
      throw new Error(`Could not find total cell for ${nth}th column`);
    }

    // Retrieve the time value
    const total = await totalCell.textContent();

    // Check that the time value is correct
    expect(total).toMatch(new RegExp(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`));
  }

  async showsTimeWorkedTodayForTask(taskName: string, hours: number, minutes: number) {
    await this.validateNthTotalSlot(taskName, 2, hours, minutes);
  }

  async showsTimeWorkedYesterdayForTask(taskName: string, hours: number, minutes: number) {
    await this.validateNthTotalSlot(taskName, 3, hours, minutes);
  }

  async showsTimeWorkedThisWeekForTask(taskName: string, hours: number, minutes: number) {
    await this.validateNthTotalSlot(taskName, 4, hours, minutes);
  }

  async showsTimeWorkedThisMonthForTask(taskName: string, hours: number, minutes: number) {
    await this.validateNthTotalSlot(taskName, 5, hours, minutes);
  }

  async showsTimeWorkedForCustomPeriodForTask(taskName: string, hours: number, minutes: number) {
    await this.validateNthTotalSlot(taskName, 6, hours, minutes);
  }

  async doesNotShowTotalsForTask(taskName: string) {
    await expect(this.getTotalsRowForTask(taskName)).not.toBeVisible();
  }

  async tick(seconds: number, minutes?: number) {
    await this.page.evaluate((t) => window.__clock.tick(t), seconds * 1000 + (minutes || 0) * 60 * 1000);
  }

  async jump(seconds: number, minutes?: number) {
    await this.page.evaluate((t) => window.__clock.jump(t), seconds * 1000 + (minutes || 0) * 60 * 1000);
  }
}