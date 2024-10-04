// Constants
export const LEETCODE_URL_PATTERN = /^https:\/\/.+\.(com|cn)\/problems\/([a-zA-Z0-9-]+)\/.*/;
export const SUBMISSION_CHECK_URL = "https://leetcode.com/submissions/detail/*/check/";
export const DEBOUNCE_DELAY = 2000; // 2 seconds

// Utility Functions
export const getTitleSlug = (url: string): string => {
    const match = url.match(LEETCODE_URL_PATTERN);
    return match ? match[2] : "";
};

export async function getCurrentTab(): Promise<chrome.tabs.Tab | undefined> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, highlighted: true}, (tabs) => {
        if (tabs.length > 0 && tabs[0].url) {
          resolve(tabs[0]);
        } else {
          resolve(undefined);
        }
      });
    });
}

export const debounce = <T extends (...args: any[]) => void>(func: T, delay: number): (...args: Parameters<T>) => void => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    return (...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => func(...args), delay);
    };
};