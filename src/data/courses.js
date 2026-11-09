// Course content for the Learn module.
//
// Lesson `type` values:
//  - 'reading'  : explanation text + optional read-only code snippets
//  - 'exercise' : interactive coding challenge, graded via the same Web
//                 Worker judge used by the Practice module (JS only)
//  - 'quiz'     : multiple-choice check, graded client-side with no code
//                 execution — works for any language, including ones we
//                 can't safely run in-browser (Python, etc.)

export const courses = [
  {
    id: 'javascript-fundamentals',
    title: 'JavaScript Fundamentals',
    language: 'JavaScript',
    color: '#f7df1e',
    difficulty: 'Beginner',
    description: 'Variables, functions, control flow, and data structures — the core of JS, with hands-on exercises graded instantly.',
    modules: [
      {
        id: 'basics',
        title: 'Basics',
        lessons: [
          {
            id: 'variables-and-types',
            title: 'Variables & Data Types',
            type: 'reading',
            content: `JavaScript has three ways to declare a variable: \`let\`, \`const\`, and the older \`var\`.

- \`const\` — the value can't be reassigned. Use this by default.
- \`let\` — the value can be reassigned. Use this when you know it will change.
- \`var\` — function-scoped, mostly legacy. Avoid it in new code.

The core primitive types are \`number\`, \`string\`, \`boolean\`, \`undefined\`, and \`null\`. Unlike some languages, JS doesn't separate integers and floats — they're all just \`number\`.`,
            codeExample: `const name = "Ada";      // string, never reassigned
let age = 30;             // number, can change
age = 31;                 // fine, "age" was declared with let

const isLearning = true;  // boolean
console.log(typeof name, typeof age, typeof isLearning);
// "string" "number" "boolean"`
          },
          {
            id: 'functions',
            title: 'Functions',
            type: 'reading',
            content: `Functions are reusable blocks of code. There are three common ways to write one:

1. Function declaration: \`function add(a, b) { return a + b; }\`
2. Function expression: \`const add = function(a, b) { return a + b; };\`
3. Arrow function: \`const add = (a, b) => a + b;\`

Arrow functions are especially common for short, one-line operations, and they don't rebind \`this\` — a detail that matters more once you get into objects and classes.`,
            codeExample: `function square(n) {
  return n * n;
}

const cube = (n) => n * n * n;

console.log(square(4)); // 16
console.log(cube(3));   // 27`
          },
          {
            id: 'exercise-sum-two-numbers',
            title: 'Exercise: Sum Two Numbers',
            type: 'exercise',
            description: 'Write a function `sumTwo(a, b)` that returns the sum of its two arguments.',
            functionName: 'sumTwo',
            starterCode: `function sumTwo(a, b) {
  // your code here

}`,
            tests: [
              { args: [2, 3], expected: 5 },
              { args: [-1, 1], expected: 0 },
              { args: [10, 15], expected: 25 },
              { args: [0, 0], expected: 0 }
            ]
          }
        ]
      },
      {
        id: 'control-flow',
        title: 'Control Flow',
        lessons: [
          {
            id: 'conditionals',
            title: 'Conditionals',
            type: 'reading',
            content: `\`if\`/\`else\` branches your code based on a condition. JS also has a ternary operator for short conditional expressions, and a \`switch\` statement for matching one value against several cases.

Falsy values in JS are: \`false\`, \`0\`, \`""\`, \`null\`, \`undefined\`, and \`NaN\`. Everything else is truthy — including \`"0"\` (a non-empty string) and empty arrays/objects.`,
            codeExample: `function describe(n) {
  if (n > 0) {
    return "positive";
  } else if (n < 0) {
    return "negative";
  } else {
    return "zero";
  }
}

// Ternary shorthand for simple cases:
const label = (n % 2 === 0) ? "even" : "odd";`
          },
          {
            id: 'loops',
            title: 'Loops',
            type: 'reading',
            content: `The three most common loops:

- \`for (let i = 0; i < n; i++) { ... }\` — when you know how many times to iterate.
- \`while (condition) { ... }\` — when you don't know the count ahead of time.
- \`for (const item of array) { ... }\` — the cleanest way to iterate over array elements directly.

Watch out for off-by-one errors with \`for\` loops — the classic bug is using \`<=\` instead of \`<\`, which runs one iteration too many.`,
            codeExample: `const nums = [1, 2, 3, 4, 5];
let total = 0;

for (const n of nums) {
  total += n;
}

console.log(total); // 15`
          },
          {
            id: 'exercise-fizzbuzz-lite',
            title: 'Exercise: Count Evens',
            type: 'exercise',
            description: 'Write a function `countEvens(nums)` that returns how many numbers in the array `nums` are even.',
            functionName: 'countEvens',
            starterCode: `function countEvens(nums) {
  // your code here

}`,
            tests: [
              { args: [[1, 2, 3, 4, 5, 6]], expected: 3 },
              { args: [[1, 3, 5]], expected: 0 },
              { args: [[2, 4, 6, 8]], expected: 4 },
              { args: [[]], expected: 0 }
            ]
          }
        ]
      },
      {
        id: 'arrays-and-objects',
        title: 'Arrays & Objects',
        lessons: [
          {
            id: 'arrays',
            title: 'Arrays',
            type: 'reading',
            content: `Arrays come with built-in methods that avoid manual loops for common tasks:

- \`.map(fn)\` — transforms each element, returns a new array.
- \`.filter(fn)\` — keeps elements where \`fn\` returns true, returns a new array.
- \`.reduce(fn, initial)\` — folds the array down to a single value.

None of these mutate the original array — they all return a new one, which makes bugs from accidental mutation much rarer.`,
            codeExample: `const nums = [1, 2, 3, 4, 5];

const doubled = nums.map((n) => n * 2);        // [2, 4, 6, 8, 10]
const evens = nums.filter((n) => n % 2 === 0); // [2, 4]
const sum = nums.reduce((acc, n) => acc + n, 0); // 15`
          },
          {
            id: 'objects',
            title: 'Objects',
            type: 'reading',
            content: `Objects store key-value pairs. You can access properties with dot notation (\`obj.key\`) or bracket notation (\`obj["key"]\`) — bracket notation is required when the key is dynamic or not a valid identifier.

Destructuring lets you pull specific properties out into variables in one line, which is extremely common in modern JS code.`,
            codeExample: `const user = { name: "Grace", role: "Engineer" };

const { name, role } = user; // destructuring
console.log(name, role); // "Grace" "Engineer"

user.yearsExperience = 12; // add a new property`
          },
          {
            id: 'exercise-filter-evens',
            title: 'Exercise: Filter Positive Numbers',
            type: 'exercise',
            description: 'Write a function `filterPositive(nums)` that returns a new array containing only the positive numbers from `nums`.',
            functionName: 'filterPositive',
            starterCode: `function filterPositive(nums) {
  // your code here

}`,
            tests: [
              { args: [[-3, -1, 0, 2, 5]], expected: [2, 5] },
              { args: [[1, 2, 3]], expected: [1, 2, 3] },
              { args: [[-1, -2, -3]], expected: [] },
              { args: [[]], expected: [] }
            ]
          }
        ]
      }
    ]
  },
  {
    id: 'python-basics',
    title: 'Python Basics',
    language: 'Python',
    color: '#3776ab',
    difficulty: 'Beginner',
    description: 'An introduction to Python syntax and fundamentals. Checks are quiz-based rather than auto-graded code, since Python doesn\'t run safely in the browser yet.',
    modules: [
      {
        id: 'getting-started',
        title: 'Getting Started',
        lessons: [
          {
            id: 'what-is-python',
            title: 'What is Python?',
            type: 'reading',
            content: `Python is a high-level, dynamically typed language known for readable syntax — it uses indentation instead of curly braces to define blocks of code.

It's widely used across web backends, data science, automation scripting, and machine learning, largely because of its simplicity and huge ecosystem of libraries.`,
            codeExample: `print("Hello, Vericode!")

# Indentation defines blocks, not braces
if 5 > 2:
    print("Five is greater than two")`
          },
          {
            id: 'variables-and-types-py',
            title: 'Variables & Types',
            type: 'reading',
            content: `Python variables don't need a declared type — the type is inferred from the value, and can change if you reassign the variable to something else.

Core built-in types: \`int\`, \`float\`, \`str\`, \`bool\`, and \`None\` (Python's equivalent of \`null\`/\`undefined\`).`,
            codeExample: `name = "Ada"      # str
age = 30          # int
gpa = 3.9         # float
is_learning = True # bool

print(type(name), type(age), type(gpa))
# <class 'str'> <class 'int'> <class 'float'>`
          },
          {
            id: 'quiz-basics',
            title: 'Quiz: Python Basics',
            type: 'quiz',
            question: 'What does Python use to define a block of code (like the body of an `if` statement)?',
            options: ['Curly braces `{ }`', 'Indentation (whitespace)', 'The `begin`/`end` keywords', 'Semicolons `;`'],
            correctIndex: 1,
            explanation: 'Python uses consistent indentation — typically 4 spaces — to define code blocks, instead of braces or keywords.'
          }
        ]
      },
      {
        id: 'control-flow-py',
        title: 'Control Flow',
        lessons: [
          {
            id: 'if-else-py',
            title: 'If / Else',
            type: 'reading',
            content: `Python's conditional syntax mirrors plain English closely: \`if\`, \`elif\` (not "else if"), and \`else\`. Conditions don't need parentheses, though you can add them for clarity in complex expressions.`,
            codeExample: `age = 20

if age < 13:
    category = "child"
elif age < 20:
    category = "teen"
else:
    category = "adult"

print(category) # "adult"`
          },
          {
            id: 'loops-py',
            title: 'Loops',
            type: 'reading',
            content: `The \`for\` loop in Python iterates directly over a sequence (list, string, range, etc.) — there's no traditional C-style \`for (i = 0; ...)\` form. Use \`range(n)\` when you need a numeric counter.`,
            codeExample: `fruits = ["apple", "banana", "cherry"]

for fruit in fruits:
    print(fruit)

for i in range(3):
    print(i) # 0, 1, 2`
          },
          {
            id: 'quiz-loops',
            title: 'Quiz: Loops',
            type: 'quiz',
            question: 'Which of these prints the numbers 0, 1, and 2 in Python?',
            options: ['for i in range(3):', 'for (i = 0; i < 3; i++):', 'for i to 3:', 'loop i from 0 to 2:'],
            correctIndex: 0,
            explanation: '`range(3)` produces the sequence 0, 1, 2 — `range(n)` always stops just before `n`.'
          }
        ]
      }
    ]
  }
];

export function getCourseById(courseId) {
  return courses.find((c) => c.id === courseId);
}

export function getAllLessons(course) {
  return course.modules.flatMap((m) => m.lessons.map((lesson) => ({ ...lesson, moduleId: m.id })));
}

export function getLessonById(course, lessonId) {
  return getAllLessons(course).find((l) => l.id === lessonId);
}

export function getAdjacentLessonIds(course, lessonId) {
  const lessons = getAllLessons(course);
  const index = lessons.findIndex((l) => l.id === lessonId);
  return {
    prevId: index > 0 ? lessons[index - 1].id : null,
    nextId: index >= 0 && index < lessons.length - 1 ? lessons[index + 1].id : null
  };
}
