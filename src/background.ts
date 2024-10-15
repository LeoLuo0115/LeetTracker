import { SUBMISSION_CHECK_URL, DEBOUNCE_DELAY, getTitleSlug, getCurrentTab, debounce} from './lib/background-utils';
import { Problem, loadForgettingCurve, getProblemStatus } from './lib/problem-manager';
import { queryProblemInfo, querySubmissionDetails } from './lib/background-api';

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
const handleSubmission = async (details: chrome.webRequest.WebResponseCacheDetails) => {
    // Check if the request was initiated by LeetCode
    if (details.initiator !== "https://leetcode.com") {
        console.log("Skipping non-LeetCode request:", details.url);
        return;
    }

    console.log("Processing final submission:", details.url);
    
    const currentTab = await getCurrentTab();
    const titleSlug = getTitleSlug(currentTab?.url!);

    // get submission details
    const submissionDetails = await querySubmissionDetails(details.url);
    console.log("Submission details:", submissionDetails);
    if (submissionDetails.status_msg !== "Accepted") {
        console.log("Submission not accepted, skipping");
        return;
    }
    
    // get problem info
    const question = await queryProblemInfo(titleSlug);
    console.log("Question:", question);
    const problemId = question.questionFrontendId;
    console.log("Problem id:", problemId);
    
    // make sure question is in cloud storage if not, create a new problem
    const result = await chrome.storage.local.get(problemId);
    const existingProblem = result[problemId as keyof typeof result] as Problem | undefined;

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
            firstSubmissionTime: now,
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
    // // clear local storage
    // chrome.storage.local.clear(() => {
    //     console.log("Local storage cleared");
    // });
    // // clear sync storage
    // chrome.storage.sync.clear(() => {
    //     console.log("Sync storage cleared");
    // });
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
    { urls: [SUBMISSION_CHECK_URL] },
    ["responseHeaders", "extraHeaders"]
);