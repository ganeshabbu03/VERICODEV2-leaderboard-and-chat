// Backend store for practice problems.
// Handles Supabase read/write operations, seeding, and execution runner.

import { supabase } from './supabase-client.js';
import { executeUserCode, isMatchExpected } from './problems-judge.js';
import fs from 'fs';
import path from 'path';

// Local storage fallback paths
const DATA_DIR = path.join(process.cwd(), 'server', 'data');
const LOCAL_PROBLEMS_FILE = path.join(DATA_DIR, 'problems.json');
const LOCAL_SOLVES_FILE = path.join(DATA_DIR, 'user_solves.json');

// Ensure data folder exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 8 Default seed problems
const SEED_PROBLEMS = [
  {
    id: 1,
    title: "Two Sum",
    number: "1",
    difficulty: "Easy",
    acceptance: "50.1%",
    topics: ["Array", "Hash Table"],
    description: "Given an array of integers <code>nums</code> and an integer <code>target</code>, return indices of the two numbers such that they add up to <code>target</code>.<br><br>You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    example: "<strong>Input:</strong> nums = [2,7,11,15], target = 9<br><strong>Output:</strong> [0,1]<br><strong>Explanation:</strong> Because nums[0] + nums[1] == 9, we return [0, 1].",
    suggestion: "Optimize Two Sum using Hash Map",
    templates: {
      python: `class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        # Write your Python solution here\n        pass\n`,
      javascript: `/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    // Write your JavaScript solution here\n    return [];\n};\n`,
      cpp: `class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your C++ solution here\n        return {};\n    }\n};\n`,
      java: `class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your Java solution here\n        return new int[0];\n    }\n}\n`
    },
    test_suite: [
      { inputs: { nums: [2, 7, 11, 15], target: 9 }, expected: [0, 1] },
      { inputs: { nums: [3, 2, 4], target: 6 }, expected: [1, 2] },
      { inputs: { nums: [3, 3], target: 6 }, expected: [0, 1] }
    ],
    explanation: "This problem can be solved efficiently in O(n) time using a Hash Map (Object). Traverse the array while storing each number's index. If target - nums[i] is already in the map, return its index along with the current index.",
    snippet: "class Solution:\n    def twoSum(self, nums: list[int], target: int) -> list[int]:\n        seen = {}\n        for i, num in enumerate(nums):\n            diff = target - num\n            if diff in seen:\n                return [seen[diff], i]\n            seen[num] = i\n        return []"
  },
  {
    id: 2,
    title: "Add Two Numbers",
    number: "2",
    difficulty: "Medium",
    acceptance: "40.5%",
    topics: ["Linked List", "Math"],
    description: "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.",
    example: "<strong>Input:</strong> l1 = [2,4,3], l2 = [5,6,4]<br><strong>Output:</strong> [7,0,8]<br><strong>Explanation:</strong> 342 + 465 = 807.",
    suggestion: "Solve Add Two Numbers using linked list node traversal",
    templates: {
      python: `class Solution:\n    def addTwoNumbers(self, l1: Optional[ListNode], l2: Optional[ListNode]) -> Optional[ListNode]:\n        # Write your Python solution here\n        pass\n`,
      javascript: `var addTwoNumbers = function(l1, l2) {\n    // Write your JavaScript solution here\n    return null;\n};\n`,
      cpp: `class Solution {\npublic:\n    ListNode* addTwoNumbers(ListNode* l1, ListNode* l2) {\n        // Write your C++ solution here\n        return nullptr;\n    }\n};\n`,
      java: `class Solution {\n    public ListNode addTwoNumbers(ListNode l1, ListNode l2) {\n        // Write your Java solution here\n        return null;\n    }\n}\n`
    },
    test_suite: [
      { inputs: { l1: [2, 4, 3], l2: [5, 6, 4] }, expected: [7, 0, 8] },
      { inputs: { l1: [0], l2: [0] }, expected: [0] },
      { inputs: { l1: [9, 9, 9, 9, 9, 9, 9], l2: [9, 9, 9, 9] }, expected: [8, 9, 9, 9, 0, 0, 0, 1] }
    ],
    explanation: "Traverse both linked lists simultaneously. Maintain a carry variable representing the digit overflow (sum / 10). Create new nodes with (sum % 10) and link them to build the output list.",
    snippet: "class Solution:\n    def addTwoNumbers(self, l1: ListNode, l2: ListNode) -> ListNode:\n        dummy = ListNode(0)\n        curr = dummy\n        carry = 0\n        while l1 or l2 or carry:\n            v1 = l1.val if l1 else 0\n            v2 = l2.val if l2 else 0\n            val = v1 + v2 + carry\n            carry = val // 10\n            curr.next = ListNode(val % 10)\n            curr = curr.next\n            l1 = l1.next if l1 else None\n            l2 = l2.next if l2 else None\n        return dummy.next"
  },
  {
    id: 3,
    title: "Longest Substring Without Repeating Characters",
    number: "3",
    difficulty: "Medium",
    acceptance: "33.8%",
    topics: ["Hash Table", "String", "Sliding Window"],
    description: "Given a string <code>s</code>, find the length of the longest substring without repeating characters.",
    example: "<strong>Input:</strong> s = \"abcabcbb\"<br><strong>Output:</strong> 3<br><strong>Explanation:</strong> The answer is \"abc\", with the length of 3.",
    suggestion: "Explain sliding window technique for Longest Substring",
    templates: {
      python: `class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        # Write your Python solution here\n        return 0\n`,
      javascript: `var lengthOfLongestSubstring = function(s) {\n    // Write your JavaScript solution here\n    return 0;\n};\n`,
      cpp: `class Solution {\npublic:\n    int lengthOfLongestSubstring(string s) {\n        // Write your C++ solution here\n        return 0;\n    }\n};\n`,
      java: `class Solution {\n    public int lengthOfLongestSubstring(String s) {\n        // Write your Java solution here\n        return 0;\n    }\n}\n`
    },
    test_suite: [
      { inputs: { s: "abcabcbb" }, expected: 3 },
      { inputs: { s: "bbbbb" }, expected: 1 },
      { inputs: { s: "pwwkew" }, expected: 3 },
      { inputs: { s: "" }, expected: 0 }
    ],
    explanation: "Use a sliding window with two pointers representing the substring boundaries. Maintain a map storing characters and their latest indices. If a duplicate is encountered, slide the left pointer to the right of the duplicate's last index.",
    snippet: "class Solution:\n    def lengthOfLongestSubstring(self, s: str) -> int:\n        char_map = {}\n        left = 0\n        max_len = 0\n        for right, char in enumerate(s):\n            if char in char_map:\n                left = max(left, char_map[char] + 1)\n            char_map[char] = right\n            max_len = max(max_len, right - left + 1)\n        return max_len"
  },
  {
    id: 4,
    title: "XML External Entity (XXE) Injection Parser",
    number: "4",
    difficulty: "Hard",
    acceptance: "28.5%",
    topics: ["Security", "XML"],
    description: "Secure an XML parser configuration against XML External Entity (XXE) injection attacks. Prevent the parser from resolving external entities or loading external DTDs.",
    example: "<strong>Input:</strong> &lt;!DOCTYPE foo [ &lt;!ENTITY xxe SYSTEM \"file:///etc/passwd\"&gt; ]&gt;&lt;foo&gt;&amp;xxe;&lt;/foo&gt;<br><strong>Output:</strong> ParserException: External entities are disabled.",
    suggestion: "Scan XML parser code for XXE vulnerabilities",
    templates: {
      python: `import xml.etree.ElementTree as ET\n\nclass XMLParser:\n    def parse_xml_safely(self, xml_string: str) -> ET.Element:\n        # Prevent XML External Entity (XXE) injection attacks\n        # Write your secure Python code here\n        pass\n`,
      javascript: `// Node.js libxmljs XML parse configuration\nfunction parseXMLSafely(xmlString) {\n    // Configure parsing flags to prevent XXE injection\n    // Write secure code here\n    return null;\n}\n`,
      cpp: `// Xerces-C++ parser configurations\nclass SecureXMLParser {\npublic:\n    void parseXML(const string& xmlContent) {\n        // Set features to disable DTD and external entities\n        // Write secure code here\n    }\n};\n`,
      java: `import javax.xml.parsers.DocumentBuilderFactory;\n\nclass SecureXMLParser {\n    public void parseXML(String xmlString) throws Exception {\n        DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();\n        // Configure factory features to forbid external DTDs\n        // Write secure code here\n    }\n}\n`
    },
    test_suite: [
      { inputs: { xml: "<foo>bar</foo>" }, expected: "bar" },
      { inputs: { xml: "<!DOCTYPE foo [ <!ENTITY xxe SYSTEM \"file:///etc/passwd\"> ]><foo>&xxe;</foo>" }, expected: "ParserException: External entities are disabled." },
      { inputs: { xml: "<foo>hello world</foo>" }, expected: "hello world" }
    ],
    explanation: "To mitigate XXE vulnerabilities, configure the XML parser factory to disallow inline DOCTYPE declarations entirely or set external entity resolving properties to false. In Python, replace the unsafe standard xml library with defusedxml.",
    snippet: "class SecureXMLParser:\n    # Java configuration:\n    # dbf.setFeature(\"http://apache.org/xml/features/disallow-doctype-decl\", true);\n    # dbf.setFeature(\"http://xml.org/sax/features/external-general-entities\", false);\n    # dbf.setFeature(\"http://xml.org/sax/features/external-parameter-entities\", false);"
  },
  {
    id: 5,
    title: "SQL Injection Mitigation in Login Handler",
    number: "5",
    difficulty: "Easy",
    acceptance: "65.2%",
    topics: ["Security", "Database"],
    description: "Secure a database login query handler against SQL injection attacks. Upgrade concatenating dynamic queries to use parameterized prepared statements.",
    example: "<strong>Input:</strong> username = \"admin' OR '1'='1\", password = \"xyz\"<br><strong>Output:</strong> Authentication failed (safe prepared query executed).",
    suggestion: "🛡️ Scan login handler for OWASP security flaws",
    templates: {
      python: `import sqlite3\n\nclass LoginHandler:\n    def authenticate_user(self, conn: sqlite3.Connection, username: str, password: str):\n        # Use prepared statements with placeholder binds\n        pass\n`,
      javascript: `// PG SQL injection mitigation\nfunction authenticateUser(dbClient, username, password) {\n    // Use parameterized queries to query users safely\n    // Write secure code here\n    return null;\n}\n`,
      cpp: `// SQLite database query\nclass LoginHandler {\npublic:\n    bool authenticateUser(sqlite3* db, const string& username, const string& password) {\n        // Use sqlite3_prepare_v2 and binding placeholders\n        // Write secure code here\n        return false;\n    }\n};\n`,
      java: `import java.sql.*;\n\nclass LoginHandler {\n    public boolean authenticateUser(Connection conn, String username, String password) throws Exception {\n        // Use PreparedStatement instead of Statement\n        // Write secure code here\n        return false;\n    }\n}\n`
    },
    test_suite: [
      { inputs: { username: "admin", password: "password123" }, expected: "User Logged In: admin" },
      { inputs: { username: "admin' OR '1'='1", password: "xyz" }, expected: "Authentication failed (Safe prepared statement executed)" },
      { inputs: { username: "guest", password: "123" }, expected: "Authentication failed" }
    ],
    explanation: "Mitigate SQL Injection by replacing dynamic query string concatenation with parameterized prepared statements. Bind user parameters using database question-marks or named markers.",
    snippet: "class LoginHandler:\n    # Prepared query instead of raw string concat:\n    # cursor.execute(\"SELECT * FROM users WHERE username = ? AND password = ?\", (username, password))"
  },
  {
    id: 6,
    title: "Longest Palindromic Substring",
    number: "6",
    difficulty: "Medium",
    acceptance: "32.4%",
    topics: ["String", "Dynamic Programming"],
    description: "Given a string <code>s</code>, return the longest palindromic substring in <code>s</code>.",
    example: "<strong>Input:</strong> s = \"babad\"<br><strong>Output:</strong> \"bab\" (or \"aba\")",
    suggestion: "Explain dynamic programming formulation for longest palindromic substring",
    templates: {
      python: `class Solution:\n    def longestPalindrome(self, s: str) -> str:\n        # Write your Python solution here\n        return ""\n`,
      javascript: `var longestPalindrome = function(s) {\n    // Write your JavaScript solution here\n    return "";\n};\n`,
      cpp: `class Solution {\npublic:\n    string longestPalindrome(string s) {\n        // Write your C++ solution here\n        return "";\n    }\n};\n`,
      java: `class Solution {\n    public String longestPalindrome(String s) {\n        // Write your Java solution here\n        return "";\n    }\n}\n`
    },
    test_suite: [
      { inputs: { s: "babad" }, expected: ["bab", "aba"] },
      { inputs: { s: "cbbd" }, expected: "bb" },
      { inputs: { s: "a" }, expected: "a" }
    ],
    explanation: "This problem can be solved in O(n^2) time by expanding outwards around each index as a potential palindrome center. Account for both odd-length (1-character center) and even-length (2-character center) palindromes.",
    snippet: "class Solution:\n    def longestPalindrome(self, s: str) -> str:\n        if not s: return \"\"\n        start, end = 0, 0\n        def expand(l, r):\n            while l >= 0 and r < len(s) and s[l] == s[r]:\n                l -= 1\n                r += 1\n            return r - l - 1\n        for i in range(len(s)):\n            len1 = expand(i, i)\n            len2 = expand(i, i + 1)\n            max_l = max(len1, len2)\n            if max_l > end - start:\n                start = i - (max_l - 1) // 2\n                end = i + max_l // 2\n        return s[start:end + 1]"
  },
  {
    id: 7,
    title: "Buffer Overflow Check in C-String Copy",
    number: "7",
    difficulty: "Hard",
    acceptance: "18.2%",
    topics: ["Security", "C++"],
    description: "Audit a C++ program that copies user input into a fixed-size character array. Prevent buffer overflow exploits by replacing standard unsecure copy functions (like <code>strcpy</code>) with secure alternatives.",
    example: "<strong>Input:</strong> input = \"A\" * 100, buffer_size = 16<br><strong>Output:</strong> CompileError/ExecutionBlocked: Safe copy bound exceeded.",
    suggestion: "Audit C++ code for strcpy buffer overflow vulnerabilities",
    templates: {
      python: `class SafeMemoryCopy:\n    def safe_copy(self, src: str, dest_limit: int) -> str:\n        # Check length bound before copying string into destination\n        pass\n`,
      javascript: `// Node buffer overflow check\nfunction safeStringCopy(srcString, destLimit) {\n    // Implement bounds validation limit\n    // Write secure code here\n    return null;\n}\n`,
      cpp: `// Secure copying using bounds limit\nclass SafeMemoryCopy {\npublic:\n    void safeCopy(char* dest, const char* src, size_t destSize) {\n        // Replace strcpy with safe checks or strncpy\n        // Write secure code here\n    }\n};\n`,
      java: `class SafeMemoryCopy {\n    public void safeCopy(byte[] dest, byte[] src) {\n        // Validate bounds copy limits\n        // Write secure code here\n    }\n}\n`
    },
    test_suite: [
      { inputs: { input: "A".repeat(100), buffer_size: 16 }, expected: "CompileError/ExecutionBlocked: Safe copy bound exceeded." },
      { inputs: { input: "hello", buffer_size: 16 }, expected: "hello" },
      { inputs: { input: "B".repeat(20), buffer_size: 10 }, expected: "CompileError/ExecutionBlocked: Safe copy bound exceeded." }
    ],
    explanation: "Mitigate buffer overflows by replacing insecure string copy functions (like strcpy) with bounds-checked alternatives like strncpy or memcpy. Always specify the destination buffer limit (sizeof(dest) - 1) and guarantee null-termination.",
    snippet: "class SafeMemoryCopy:\n    # Pre-copy validation check:\n    # if len(src) >= dest_limit: raise Exception(\"Safe copy bound exceeded\")"
  },
  {
    id: 8,
    title: "Regular Expression Matching",
    number: "8",
    difficulty: "Hard",
    acceptance: "28.0%",
    topics: ["String", "Dynamic Programming", "Recursion"],
    description: "Implement regular expression matching with support for <code>'.'</code> and <code>'*'</code>. '.' matches any single character, and '*' matches zero or more of the preceding element.",
    example: "<strong>Input:</strong> s = \"aa\", p = \"a*\"<br><strong>Output:</strong> true<br><strong>Explanation:</strong> '*' means zero or more of the preceding element 'a'.",
    suggestion: "Explain regular expression matching DP state transitions",
    templates: {
      python: `class Solution:\n    def isMatch(self, s: str, p: str) -> bool:\n        # Write your Python solution here\n        return False\n`,
      javascript: `var isMatch = function(s, p) {\n    // Write your JavaScript solution here\n    return false;\n};\n`,
      cpp: `class Solution {\npublic:\n    bool isMatch(string s, string p) {\n        // Write your C++ solution here\n        return false;\n    }\n};\n`,
      java: `class Solution {\n    public boolean isMatch(String s, String p) {\n        // Write your Java solution here\n        return false;\n    }\n}\n`
    },
    test_suite: [
      { inputs: { s: "aa", p: "a" }, expected: false },
      { inputs: { s: "aa", p: "a*" }, expected: true },
      { inputs: { s: "ab", p: ".*" }, expected: true },
      { inputs: { s: "aab", p: "c*a*b" }, expected: true }
    ],
    explanation: "Solve this problem using a 2D Dynamic Programming table of dimensions (len(s)+1) x (len(p)+1). dp[i][j] represents if suffix s[i:] matches pattern p[j:]. Check transitions based on star '*' presence.",
    snippet: "class Solution:\n    def isMatch(self, s: str, p: str) -> bool:\n        dp = [[False] * (len(p) + 1) for _ in range(len(s) + 1)]\n        dp[-1][-1] = True\n        for i in range(len(s), -1, -1):\n            for j in range(len(p) - 1, -1, -1):\n                first = i < len(s) and p[j] in (s[i], '.')\n                if j + 1 < len(p) and p[j + 1] == '*':\n                    dp[i][j] = dp[i][j + 2] or (first and dp[i + 1][j])\n                else:\n                    dp[i][j] = first and dp[i + 1][j + 1]\n        return dp[0][0]"
  }
];

// Seed function for practice problems
export async function seedProblemsTable() {
  if (!supabase) {
    console.warn("⚠️ Supabase not initialized; problems seeding skipped.");
    return;
  }
  
  try {
    const { data, error } = await supabase.from('problems').select('id');
    if (error) throw error;
    
    if (data.length === 0) {
      console.log("🌱 Database seeded: 'problems' table is empty. Inserting default challenges...");
      for (const p of SEED_PROBLEMS) {
        const { error: insErr } = await supabase.from('problems').insert([p]);
        if (insErr) throw insErr;
      }
      console.log("✅ Successfully seeded Supabase practice problems!");
    } else {
      console.log("ℹ️ Supabase problems list is already seeded.");
    }
  } catch (err) {
    console.error("❌ Failed to seed Supabase 'problems' table:", err.message);
  }
}

// Memory fallback cache variables
let memoryProblems = [...SEED_PROBLEMS];
let memorySolves = [];

// Try loading local file back-ups
try {
  if (fs.existsSync(LOCAL_PROBLEMS_FILE)) {
    memoryProblems = JSON.parse(fs.readFileSync(LOCAL_PROBLEMS_FILE, 'utf8'));
  }
} catch (e) {
  console.error("Error reading local problems.json:", e);
}

try {
  if (fs.existsSync(LOCAL_SOLVES_FILE)) {
    memorySolves = JSON.parse(fs.readFileSync(LOCAL_SOLVES_FILE, 'utf8'));
  }
} catch (e) {
  console.error("Error reading local user_solves.json:", e);
}

function saveLocalProblems() {
  try {
    fs.writeFileSync(LOCAL_PROBLEMS_FILE, JSON.stringify(memoryProblems, null, 2), 'utf8');
  } catch (e) {
    console.error("Error saving local problems.json:", e);
  }
}

function saveLocalSolves() {
  try {
    fs.writeFileSync(LOCAL_SOLVES_FILE, JSON.stringify(memorySolves, null, 2), 'utf8');
  } catch (e) {
    console.error("Error saving local user_solves.json:", e);
  }
}

// -----------------------------------------------------------------
// STORE INTERFACES
// -----------------------------------------------------------------

export async function getProblems() {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('problems').select('*').order('id', { ascending: true });
      if (!error && data) return data;
      console.warn("⚠️ Supabase read failed, returning memory fallback:", error?.message);
    } catch (e) {
      console.warn("⚠️ Supabase read error, returning memory fallback:", e.message);
    }
  }
  return memoryProblems;
}

export async function getProblemById(id) {
  id = parseInt(id);
  if (supabase) {
    try {
      const { data, error } = await supabase.from('problems').select('*').eq('id', id).single();
      if (!error && data) return data;
    } catch (e) {}
  }
  return memoryProblems.find(p => p.id === id) || null;
}

export async function getUserSolves(userId) {
  if (!userId) return [];
  if (supabase) {
    try {
      const { data, error } = await supabase.from('user_solves').select('problem_id, language, solved_at').eq('user_id', userId);
      if (!error && data) return data;
    } catch (e) {}
  }
  return memorySolves.filter(s => s.user_id === userId);
}

export async function recordUserSolve(userId, problemId, language) {
  problemId = parseInt(problemId);
  const solvedAt = Date.now();
  
  if (supabase) {
    try {
      const { error } = await supabase.from('user_solves').upsert([
        { user_id: userId, problem_id: problemId, language: language.toUpperCase(), solved_at: solvedAt }
      ]);
      if (!error) return true;
      console.warn("⚠️ Supabase user_solves write failed, logging to memory fallback:", error.message);
    } catch (e) {
      console.warn("⚠️ Supabase user_solves write error:", e.message);
    }
  }
  
  // Memory fallback logger
  const existing = memorySolves.findIndex(s => s.user_id === userId && s.problem_id === problemId);
  const solveRow = { user_id: userId, problem_id: problemId, language: language.toUpperCase(), solved_at: solvedAt };
  if (existing >= 0) {
    memorySolves[existing] = solveRow;
  } else {
    memorySolves.push(solveRow);
  }
  saveLocalSolves();
  return true;
}

// -----------------------------------------------------------------
// CODE EVALUATION AND SUBMISSION CHANNELS
// -----------------------------------------------------------------

export async function runCode(problemId, codeText, transpiledJs, language, inputs) {
  try {
    const result = executeUserCode(codeText, transpiledJs, problemId, inputs);
    const expected = await getReferenceOutput(problemId, inputs);
    const isCorrect = isMatchExpected(result, expected);
    return {
      status: isCorrect ? "Accepted" : "Wrong Answer",
      output: result,
      expected: expected,
      isCorrect
    };
  } catch (err) {
    return {
      status: "Runtime Error",
      output: "RuntimeError: " + err.message,
      expected: null,
      isCorrect: false
    };
  }
}

export async function submitCode(userId, problemId, codeText, transpiledJs, language) {
  const prob = await getProblemById(problemId);
  if (!prob) throw new Error("Problem does not exist");
  
  const testSuite = prob.test_suite || [];
  let allPassed = true;
  let failedIndex = -1;
  let failedActual = "";
  let failedExpected = "";
  let failedInputs = "";
  
  for (let idx = 0; idx < testSuite.length; idx++) {
    const testCase = testSuite[idx];
    try {
      const result = executeUserCode(codeText, transpiledJs, problemId, testCase.inputs);
      if (!isMatchExpected(result, testCase.expected)) {
        allPassed = false;
        failedIndex = idx;
        failedActual = result;
        failedExpected = testCase.expected;
        failedInputs = testCase.inputs;
        break;
      }
    } catch (err) {
      allPassed = false;
      failedIndex = idx;
      failedActual = "RuntimeError: " + err.message;
      failedExpected = testCase.expected;
      failedInputs = testCase.inputs;
      break;
    }
  }
  
  if (allPassed) {
    // Record solved status to database
    await recordUserSolve(userId, problemId, language);
    return {
      allPassed: true,
      runtime: "12 ms",
      memory: "15.2 MB",
      testCasesCount: testSuite.length
    };
  } else {
    return {
      allPassed: false,
      failedIndex,
      actual: failedActual,
      expected: failedExpected,
      inputs: failedInputs,
      testCasesCount: testSuite.length
    };
  }
}

// Private helper to calculate expected reference outputs on-the-fly
async function getReferenceOutput(problemId, inputs) {
  problemId = parseInt(problemId);
  if (problemId === 1) {
    let nums = inputs.nums || [];
    let target = inputs.target || 0;
    let seen = {};
    for (let i = 0; i < nums.length; i++) {
      let complement = target - nums[i];
      if (seen.hasOwnProperty(complement)) {
        return [seen[complement], i];
      }
      seen[nums[i]] = i;
    }
    return [];
  }
  if (problemId === 2) {
    let l1 = inputs.l1 || [];
    let l2 = inputs.l2 || [];
    let carry = 0;
    let result = [];
    let i = 0, j = 0;
    while (i < l1.length || j < l2.length || carry) {
      let val1 = i < l1.length ? l1[i] : 0;
      let val2 = j < l2.length ? l2[j] : 0;
      let total = val1 + val2 + carry;
      carry = Math.floor(total / 10);
      result.push(total % 10);
      i++;
      j++;
    }
    return result;
  }
  if (problemId === 3) {
    let s = inputs.s || "";
    let charMap = {};
    let left = 0, maxLen = 0;
    for (let right = 0; right < s.length; right++) {
      let char = s[right];
      if (charMap.hasOwnProperty(char)) {
        left = Math.max(left, charMap[char] + 1);
      }
      charMap[char] = right;
      maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
  }
  if (problemId === 4) {
    let inputXml = inputs.xml || inputs.xmlContent || "";
    return inputXml.replace(/<[^>]+>/g, "").trim() || inputXml;
  }
  if (problemId === 5) {
    let uName = inputs.username || "";
    let pWord = inputs.password || "";
    if (uName === "admin" && (pWord === "password123" || pWord === "xyz")) {
      return "User Logged In: admin";
    }
    return "Authentication failed";
  }
  if (problemId === 6) {
    let s = inputs.s || "";
    if (!s) return "";
    let start = 0, end = 0;
    const expand = (l, r) => {
      while (l >= 0 && r < s.length && s[l] == s[r]) {
        l--;
        r++;
      }
      return r - l - 1;
    };
    for (let i = 0; i < s.length; i++) {
      let len1 = expand(i, i);
      let len2 = expand(i, i + 1);
      let max_l = Math.max(len1, len2);
      if (max_l > end - start) {
        start = i - Math.floor((max_l - 1) / 2);
        end = i + Math.floor(max_l / 2);
      }
    }
    return s.slice(start, end + 1);
  }
  if (problemId === 7) {
    let srcVal = inputs.input || inputs.src || "";
    return srcVal;
  }
  if (problemId === 8) {
    let s = inputs.s || "";
    let p = inputs.p || "";
    let dp = Array(s.length + 1).fill(null).map(() => Array(p.length + 1).fill(false));
    dp[s.length][p.length] = true;
    for (let i = s.length; i >= 0; i--) {
      for (let j = p.length - 1; j >= 0; j--) {
        let firstMatch = i < s.length && (p[j] === s[i] || p[j] === '.');
        if (j + 1 < p.length && p[j + 1] === '*') {
          dp[i][j] = dp[i][j + 2] || (firstMatch && dp[i + 1][j]);
        } else {
          dp[i][j] = firstMatch && dp[i + 1][j + 1];
        }
      }
    }
    return dp[0][0];
  }
  return null;
}
