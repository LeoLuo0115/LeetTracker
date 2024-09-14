/**
 * Following are workaround for problem that service worker does not wake after
 * after a long period of inactive in M3
 * https://stackoverflow.com/questions/66618136/persistent-service-worker-in-chrome-extension
 */

// Level 1: Redirect and make sure the service worker is awake
chrome.webNavigation.onBeforeNavigate.addListener(
  ({ url }) => {
    console.log("AWAKE: urlContains redirecting to " + url);
  },
  { url: [{ urlContains: "leetcode" }] }
);

// Level 2: When submitting the question, make sure the service worker is awake
chrome.webRequest.onBeforeSendHeaders.addListener(
  ({ url }) => {
    console.log("AWAKE: BeforeSendHeaders " + url);
  },
  {
    urls: [
      "https://leetcode.com/problems/*/submit/",
    ],
  }
);

// debounce function to prevent multiple requests
function debounce<T extends (...args: any[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), delay);
  };
}

// Function to handle submission
const handleSubmission = ({ url }: { url: string }) => {
  console.log("Processing final submission:", url, new Date().toISOString());
  // Add your desired operations here
};

// Debounced version of the submission handler
const debouncedHandleSubmission = debounce(handleSubmission, 2000); // 2 seconds delay

chrome.webRequest.onCompleted.addListener(
  debouncedHandleSubmission,
  { urls: ["https://leetcode.com/submissions/detail/*/check/"] }
);



// This is to capture all the network requests that on completed, so we can see the real request url and status code and put it for our desired url filter
// "https://leetcode.cn/submissions/detail/*/check/"
// chrome.webRequest.onCompleted.addListener(
//     (details) => {
//       console.log("Request URL: " + details.url);
//       console.log("Status Code: " + details.statusCode);
//     },
//     { urls: ["<all_urls>"] }
// );

// Leetcode redirect will have multiple requests, we just need the last one
// chrome.webRequest.onCompleted.addListener(
//   ({ url }) => {
//     console.log("After submit redirecting to " + url, new Date().toISOString());
//   },
//   {
//     urls: [
//       "https://leetcode.com/submissions/detail/*/check/",
//     ]
//   }
// );

