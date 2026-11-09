// Practice problem definitions.
// Each problem exposes a single function (functionName) that the judge calls
// with `args` for every test case, comparing the JSON-stringified result
// against `expected`.

export const problems = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'Easy',
    tags: ['Arrays', 'Hash Map'],
    functionName: 'twoSum',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return the indices of the two numbers that add up to \`target\`.

You may assume each input has exactly one solution, and you may not use the same element twice.`,
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'nums[0] + nums[1] == 9' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
    ],
    constraints: ['2 <= nums.length <= 10^4', '-10^9 <= nums[i] <= 10^9', 'Only one valid answer exists.'],
    hints: [
      'A brute-force double loop works but is O(n^2). Can you do it in one pass?',
      'Try storing each value you have seen, along with its index, in a hash map as you iterate.'
    ],
    starterCode: `function twoSum(nums, target) {
  // your code here

}`,
    tests: [
      { args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { args: [[3, 2, 4], 6], expected: [1, 2] },
      { args: [[3, 3], 6], expected: [0, 1] },
      { args: [[-1, -2, -3, -4, -5], -8], expected: [2, 4] }
    ]
  },
  {
    id: 'reverse-string',
    title: 'Reverse a String',
    difficulty: 'Easy',
    tags: ['Strings'],
    functionName: 'reverseString',
    description: `Write a function that reverses a string in place... conceptually — return the reversed string as your result.

Do it without using the built-in \`.reverse()\` array method.`,
    examples: [
      { input: 's = "hello"', output: '"olleh"' },
      { input: 's = "Vericode"', output: '"edocireV"' }
    ],
    constraints: ['0 <= s.length <= 10^5'],
    hints: ['A two-pointer approach (from both ends toward the middle) avoids extra built-ins entirely.'],
    starterCode: `function reverseString(s) {
  // your code here

}`,
    tests: [
      { args: ['hello'], expected: 'olleh' },
      { args: ['Vericode'], expected: 'edocireV' },
      { args: [''], expected: '' },
      { args: ['a'], expected: 'a' },
      { args: ['racecar'], expected: 'racecar' }
    ]
  },
  {
    id: 'valid-parentheses',
    title: 'Valid Parentheses',
    difficulty: 'Easy',
    tags: ['Stack', 'Strings'],
    functionName: 'isValid',
    description: `Given a string \`s\` containing just the characters \`(\`, \`)\`, \`{\`, \`}\`, \`[\` and \`]\`, determine if the input string is valid.

A string is valid if every opening bracket is closed by the same type of bracket, and brackets close in the correct order.`,
    examples: [
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' }
    ],
    constraints: ['1 <= s.length <= 10^4'],
    hints: ['A stack is the natural fit here: push opening brackets, pop and compare on closing brackets.'],
    starterCode: `function isValid(s) {
  // your code here

}`,
    tests: [
      { args: ['()'], expected: true },
      { args: ['()[]{}'], expected: true },
      { args: ['(]'], expected: false },
      { args: ['([)]'], expected: false },
      { args: ['{[]}'], expected: true },
      { args: [''], expected: true }
    ]
  },
  {
    id: 'fizz-buzz',
    title: 'FizzBuzz',
    difficulty: 'Easy',
    tags: ['Basics'],
    functionName: 'fizzBuzz',
    description: `Given an integer \`n\`, return an array of strings \`answer\` (1-indexed) where:
- \`answer[i] == "FizzBuzz"\` if i is divisible by 3 and 5.
- \`answer[i] == "Fizz"\` if i is divisible by 3.
- \`answer[i] == "Buzz"\` if i is divisible by 5.
- \`answer[i] == String(i)\` otherwise.`,
    examples: [
      { input: 'n = 5', output: '["1","2","Fizz","4","Buzz"]' }
    ],
    constraints: ['1 <= n <= 10^4'],
    hints: ['Check divisibility by 15 first (or check 3 and 5 together) before falling back to the plain number.'],
    starterCode: `function fizzBuzz(n) {
  // your code here

}`,
    tests: [
      { args: [5], expected: ['1', '2', 'Fizz', '4', 'Buzz'] },
      { args: [15], expected: ['1', '2', 'Fizz', '4', 'Buzz', 'Fizz', '7', '8', 'Fizz', 'Buzz', '11', 'Fizz', '13', '14', 'FizzBuzz'] },
      { args: [1], expected: ['1'] }
    ]
  },
  {
    id: 'binary-search',
    title: 'Binary Search',
    difficulty: 'Medium',
    tags: ['Arrays', 'Binary Search'],
    functionName: 'search',
    description: `Given a sorted (ascending) integer array \`nums\` and an integer \`target\`, return the index of \`target\` in \`nums\`, or \`-1\` if it isn't present.

Your solution must run in O(log n) time.`,
    examples: [
      { input: 'nums = [-1,0,3,5,9,12], target = 9', output: '4' },
      { input: 'nums = [-1,0,3,5,9,12], target = 2', output: '-1' }
    ],
    constraints: ['1 <= nums.length <= 10^4', 'nums is sorted in ascending order.'],
    hints: ['Keep a `low` and `high` pointer and repeatedly halve the search space based on the middle element.'],
    starterCode: `function search(nums, target) {
  // your code here

}`,
    tests: [
      { args: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
      { args: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
      { args: [[5], 5], expected: 0 },
      { args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 1], expected: 0 },
      { args: [[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 10], expected: 9 }
    ]
  },
  {
    id: 'max-subarray',
    title: 'Maximum Subarray',
    difficulty: 'Medium',
    tags: ['Arrays', 'Dynamic Programming'],
    functionName: 'maxSubArray',
    description: `Given an integer array \`nums\`, find the contiguous subarray (containing at least one number) which has the largest sum, and return that sum.`,
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: '[4,-1,2,1] has the largest sum = 6.' }
    ],
    constraints: ['1 <= nums.length <= 10^5'],
    hints: ["This is Kadane's algorithm: track the best sum ending at the current index, resetting when it drops below the current element."],
    starterCode: `function maxSubArray(nums) {
  // your code here

}`,
    tests: [
      { args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { args: [[1]], expected: 1 },
      { args: [[5, 4, -1, 7, 8]], expected: 23 },
      { args: [[-1, -2, -3]], expected: -1 }
    ]
  }
];

export function getProblemById(id) {
  return problems.find((p) => p.id === id);
}
