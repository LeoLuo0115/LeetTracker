import { SUBMISSION_CHECK_URL, DEBOUNCE_DELAY, getTitleSlug, getCurrentTab, debounce, logStorageData } from './lib/background-utils';
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
    console.log("Processing final submission:", url);
    const currentTab = await getCurrentTab();
    console.log("Current tab url:", currentTab?.url);
};

// Event Listeners
chrome.runtime.onInstalled.addListener(() => {
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