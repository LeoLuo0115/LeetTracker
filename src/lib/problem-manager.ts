// Types and Interfaces
export interface Problem {
    id: string;
    title: string;
    difficulty: string;
    url: string;
    submissionTime: number;
    proficiency: number;
    isArchived: boolean;
}

export interface RemindSettings {
    forgettingCurve: number[];
}

// Constants
const DEFAULT_FORGETTING_CURVE = [1, 2, 4, 7, 15]; // Default values in days
const MS_PER_DAY = 24 * 60 * 60 * 1000;

// State
let forgettingCurve: number[] = [];

// Functions
export async function loadForgettingCurve(): Promise<void> {
    const result = await chrome.storage.sync.get('remindSettings');
    if (result.remindSettings?.forgettingCurve) {
        forgettingCurve = result.remindSettings.forgettingCurve;
    } else {
        forgettingCurve = DEFAULT_FORGETTING_CURVE;
        await chrome.storage.sync.set({ remindSettings: { forgettingCurve } });
    }
}

export function getForgettingCurve(): number[] {
    return forgettingCurve;
}

export function calculateNextReviewDate(proficiency: number): number {
    const now = Date.now();
    const daysToAdd = forgettingCurve[proficiency] || forgettingCurve[forgettingCurve.length - 1];
    return now + daysToAdd * MS_PER_DAY;
}

export function requiresReview(problem: Problem): boolean {
    if (problem.proficiency >= forgettingCurve.length) {
        return false;
    }

    const currentTime = Date.now();
    const timeDiffInMs = currentTime - problem.submissionTime;
    const reviewIntervalInMs = forgettingCurve[problem.proficiency] * MS_PER_DAY;
    
    return timeDiffInMs >= reviewIntervalInMs;
}

export function awaitingReview(problem: Problem): boolean {
    return !requiresReview(problem) && problem.proficiency < 5;
}

export function isArchived(problem: Problem): boolean {
    return problem.proficiency === 5;
}

export function getProblemStatus(problem: Problem): string {
    if (isArchived(problem)) {
        return 'Archived';
    } else if (awaitingReview(problem)) {
        return 'Review';
    } else {
        return 'Scheduled';
    }
}