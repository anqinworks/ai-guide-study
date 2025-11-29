// Test script to debug answer validation issue
const app = getApp();

// Mock data to simulate the issue
const mockCard = {
  question: "测试问题",
  options: ["A. 选项1", "B. 选项2", "C. 选项3", "D. 选项4"],
  correctAnswer: "A. 选项1",
  explanation: "测试解析"
};

// Mock user selection
const userSelection = "A. 选项1";

// Simulate the validation logic
const isCorrect = userSelection === mockCard.correctAnswer;
console.log("User Selection:", userSelection);
console.log("Correct Answer:", mockCard.correctAnswer);
console.log("Is Correct:", isCorrect);

// Test different scenarios
console.log("\n--- Testing Different Scenarios ---");

// Scenario 1: Correct answer with exact match
const scenario1 = "A. 选项1" === "A. 选项1";
console.log("Scenario 1 (Exact match):", scenario1);

// Scenario 2: Correct answer with only letter
const scenario2 = "A. 选项1" === "A";
console.log("Scenario 2 (Full text vs letter):", scenario2);

// Scenario 3: Undefined correct answer
const scenario3 = "A. 选项1" === undefined;
console.log("Scenario 3 (Answer vs undefined):", scenario3);

// Scenario 4: Empty correct answer
const scenario4 = "A. 选项1" === "";
console.log("Scenario 4 (Answer vs empty string):", scenario4);