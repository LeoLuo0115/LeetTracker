import { SUBMISSION_CHECK_URL, DEBOUNCE_DELAY, getTitleSlug, getCurrentTab, debounce} from './lib/background-utils';
import { Problem, loadForgettingCurve, getProblemStatus } from './lib/problem-manager';
import { queryProblemInfo } from './lib/background-api';

// Sync cloud to local storage
const syncToLocal = () => {
    chrome.storage.sync.get(null, (items) => {
      chrome.storage.local.set(items, () => {
        console.log('All items synced to local storage');
        console.log('Synced items:', items);
      });
    });
};

// Update problem in both local and sync storage
const saveProblemToStorage = async (problem: Problem) => {
    const storageItem = { [problem.id]: problem };
    await chrome.storage.local.set(storageItem);
    await chrome.storage.sync.set(storageItem);
    console.log(`Problem ${problem.id} saved to both local and sync storage`);
};

// Main Functionality
const handleSubmission = async ({ url }: { url: string }) => {
    // console.log("Processing final submission:", url);
    const currentTab = await getCurrentTab();
    // console.log("Current tab url:", currentTab?.url);
    const titleSlug = getTitleSlug(currentTab?.url!);
    // console.log("Title slug:", titleSlug);
    const question = await queryProblemInfo(titleSlug);
    // console.log("Question:", question);
    // const problemId = question.questionFrontendId;
    // console.log("Problem id:", problemId);
    
    // make sure question is in cloud storage if not, create a new problem
    const result = await chrome.storage.local.get(question.questionFrontendId);
    const existingProblem = result[question.questionFrontendId as keyof typeof result] as Problem | undefined;

    if (existingProblem && getProblemStatus(existingProblem) !== "Archived") {
        // calculate problem status
        const problemStatus = getProblemStatus(existingProblem!);
        console.log("Problem status:", problemStatus);
        if (problemStatus === "Scheduled") return;
        if (problemStatus === "Review") {
            // schedule a review
            console.log("Scheduling a review");
            const updatedProblem: Problem = {
                ...existingProblem,
                proficiency: Math.min(existingProblem.proficiency + 1, 5),
                isArchived: existingProblem.proficiency + 1 >= 5
            };
            await saveProblemToStorage(updatedProblem);
        }
    } else {
        // create a new problem
        console.log("Creating a new problem");
        const now = Date.now();
        const newProblem: Problem = {
            id: question.questionFrontendId,
            title: question.title,
            difficulty: question.difficulty,
            url: `https://leetcode.com/problems/${titleSlug}/`,
            proficiency: Math.min((existingProblem?.proficiency || 0) + 1, 5),
            submissionTime: now,
            isArchived: (existingProblem?.proficiency || 0) + 1 >= 5
        };
        await saveProblemToStorage(newProblem);
        // print local storage
        console.log("Local storage:", await chrome.storage.local.get(null));
        // print sync storage
        console.log("Sync storage:", await chrome.storage.sync.get(null));
    }
};

// Event Listeners
chrome.runtime.onInstalled.addListener(() => {
    // clear local and sync storage
    // chrome.storage.local.clear();
    // chrome.storage.sync.clear();
    syncToLocal();
    loadForgettingCurve();
});

chrome.webNavigation.onBeforeNavigate.addListener(
    ({ url }) => console.log("AWAKE: urlContains redirecting to " + url),
    { url: [{ urlContains: "leetcode" }] }
);

chrome.webRequest.onBeforeSendHeaders.addListener(
    ({ url }) => console.log("AWAKE: BeforeSendHeaders " + url),
    { urls: ["https://leetcode.com/problems/*/submit/"] }
);

const debouncedHandleSubmission = debounce(handleSubmission, DEBOUNCE_DELAY);

chrome.webRequest.onCompleted.addListener(
    debouncedHandleSubmission,
    { urls: [SUBMISSION_CHECK_URL] }
);