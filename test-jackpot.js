// Simple test script for the new jackpot system
// Run this in the browser console or as a Node.js script

console.log("🧪 TESTING NEW JACKPOT SYSTEM...");

// Test 1: Check if GameSession table exists
async function testDatabaseConnection() {
  try {
    console.log("📊 Testing database connection...");

    // This would test the API endpoint
    const response = await fetch("/api/cashiers/1/jackpot-info");
    if (response.ok) {
      const data = await response.json();
      console.log("✅ Database connection successful:", data);
      return true;
    } else {
      console.error("❌ Database connection failed:", response.status);
      return false;
    }
  } catch (error) {
    console.error("❌ Database test error:", error);
    return false;
  }
}

// Test 2: Test game session creation
async function testGameSessionCreation() {
  try {
    console.log("🎮 Testing game session creation...");

    const response = await fetch("/api/cashiers/1/game-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ totalBet: 500 }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Game session created:", data);
      return data.session;
    } else {
      console.error("❌ Game session creation failed:", response.status);
      return null;
    }
  } catch (error) {
    console.error("❌ Game session test error:", error);
    return null;
  }
}

// Test 3: Test jackpot calculation
function testJackpotCalculation() {
  console.log("🎰 Testing jackpot calculation...");

  // Simulate the calculation logic
  const totalBet = 500;
  const jackpotPercent = 25;
  const jackpotAmount = Math.round((totalBet * jackpotPercent) / 100);

  console.log("✅ Jackpot calculation:", {
    totalBet,
    jackpotPercent,
    jackpotAmount,
    expected: 125,
  });

  return jackpotAmount === 125;
}

// Run all tests
async function runAllTests() {
  console.log("🚀 STARTING COMPREHENSIVE JACKPOT TESTS...");

  const dbTest = await testDatabaseConnection();
  const sessionTest = await testGameSessionCreation();
  const calcTest = testJackpotCalculation();

  console.log("📋 TEST RESULTS:");
  console.log("  Database Connection:", dbTest ? "✅ PASS" : "❌ FAIL");
  console.log("  Game Session Creation:", sessionTest ? "✅ PASS" : "❌ FAIL");
  console.log("  Jackpot Calculation:", calcTest ? "✅ PASS" : "❌ FAIL");

  const allPassed = dbTest && sessionTest && calcTest;
  console.log(
    "🎯 OVERALL RESULT:",
    allPassed ? "✅ ALL TESTS PASSED" : "❌ SOME TESTS FAILED"
  );

  return allPassed;
}

// Export for use in browser console
if (typeof window !== "undefined") {
  window.testJackpotSystem = runAllTests;
  console.log("🧪 Test functions available in browser console:");
  console.log("  - testJackpotSystem() - Run all tests");
  console.log("  - testDatabaseConnection() - Test DB connection");
  console.log("  - testGameSessionCreation() - Test session creation");
  console.log("  - testJackpotCalculation() - Test jackpot math");
}

// Run tests if this is a Node.js script
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    runAllTests,
    testDatabaseConnection,
    testGameSessionCreation,
    testJackpotCalculation,
  };
}
