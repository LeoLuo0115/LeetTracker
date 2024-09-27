// Constants
const LEETCODE_BASE_URL = 'https://leetcode.com';
const GRAPHQL_ENDPOINT = `${LEETCODE_BASE_URL}/graphql`;

const QUERY_QUESTION = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      questionId
      questionFrontendId
      title
      titleSlug
      content
      translatedTitle
      translatedContent
      difficulty
      topicTags {
        name
        slug
        translatedName
        __typename
      }
      __typename
    }
  }
`;

// Main export function
export const queryProblemInfo = (titleSlug: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    fetch(GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: QUERY_QUESTION,
        variables: {
          titleSlug: titleSlug,
        },
      }),
    })
      .then((res) => res.json())
      .then((res) => {
        if (res.data) {
          resolve(res.data.question);
        } else {
          reject(res);
        }
      })
      .catch((err) => reject(err));
  });
};