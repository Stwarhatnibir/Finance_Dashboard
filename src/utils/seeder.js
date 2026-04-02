/**
 * Development database seeder.
 *
 * Creates one user per role and a year's worth of realistic transaction data.
 *
 * Usage:
 *   node src/utils/seeder.js seed    → populate the database
 *   node src/utils/seeder.js destroy → wipe all users and transactions
 */

require("dotenv").config();

const mongoose = require("mongoose");
const User = require("../models/User");
const Transaction = require("../models/Transaction");
const { ROLES, TRANSACTION_TYPES } = require("../config/constants");

// ── Seed data ───────────────────────────────────────────────────────────────

const SEED_USERS = [
  { name: "Admin User", email: "admin@example.com", password: "AdminPass1", role: ROLES.ADMIN },
  { name: "Alice Analyst", email: "analyst@example.com", password: "AnalystPass1", role: ROLES.ANALYST },
  { name: "Victor Viewer", email: "viewer@example.com", password: "ViewerPass1", role: ROLES.VIEWER },
];

const INCOME_CATEGORIES = ["Salary", "Freelance", "Investment", "Rental Income", "Bonus", "Consulting"];
const EXPENSE_CATEGORIES = ["Rent", "Utilities", "Groceries", "Transport", "Software", "Insurance", "Marketing", "Salaries Paid", "Office Supplies"];

const randomBetween = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Generates a realistic spread of transactions across the past 12 months.
 */
const generateTransactions = (adminId) => {
  const transactions = [];
  const now = new Date();

  for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
    const year = now.getFullYear();
    const month = now.getMonth() - monthOffset;

    // 2–4 income entries per month
    const incomeCount = Math.floor(Math.random() * 3) + 2;
    for (let i = 0; i < incomeCount; i++) {
      const date = new Date(year, month, Math.floor(Math.random() * 28) + 1);
      transactions.push({
        amount: randomBetween(1500, 15000),
        type: TRANSACTION_TYPES.INCOME,
        category: randomItem(INCOME_CATEGORIES),
        date,
        note: `Income entry ${i + 1} for ${date.toLocaleString("en-US", { month: "long", year: "numeric" })}`,
        createdBy: adminId,
      });
    }

    // 5–9 expense entries per month
    const expenseCount = Math.floor(Math.random() * 5) + 5;
    for (let i = 0; i < expenseCount; i++) {
      const date = new Date(year, month, Math.floor(Math.random() * 28) + 1);
      transactions.push({
        amount: randomBetween(50, 5000),
        type: TRANSACTION_TYPES.EXPENSE,
        category: randomItem(EXPENSE_CATEGORIES),
        date,
        note: `Expense entry ${i + 1} for ${date.toLocaleString("en-US", { month: "long", year: "numeric" })}`,
        createdBy: adminId,
      });
    }
  }

  return transactions;
};

// ── Actions ─────────────────────────────────────────────────────────────────

const seed = async () => {
  console.log("🌱  Seeding database...\n");

  // Wipe existing data first for idempotency
  await User.deleteMany({});
  await Transaction.deleteMany({});
  console.log("   ✓ Cleared existing users and transactions");

  // Create users (passwords are auto-hashed by the pre-save hook)
  const createdUsers = await User.create(SEED_USERS);
  console.log(`   ✓ Created ${createdUsers.length} users:`);
  createdUsers.forEach((u) => console.log(`       ${u.role.padEnd(8)} → ${u.email}`));

  const adminUser = createdUsers.find((u) => u.role === ROLES.ADMIN);

  // Generate and insert transactions
  const transactions = generateTransactions(adminUser._id);
  await Transaction.insertMany(transactions);
  console.log(`\n   ✓ Created ${transactions.length} transactions across the last 12 months`);

  const incomeCount = transactions.filter((t) => t.type === "income").length;
  const expenseCount = transactions.filter((t) => t.type === "expense").length;
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  console.log(`       Income:  ${incomeCount} records  →  $${totalIncome.toFixed(2)}`);
  console.log(`       Expense: ${expenseCount} records  →  $${totalExpense.toFixed(2)}`);
  console.log(`       Net:                       $${(totalIncome - totalExpense).toFixed(2)}`);

  console.log("\n🎉  Seeding complete!\n");
  console.log("── Login credentials ───────────────────────────────");
  SEED_USERS.forEach((u) => {
    console.log(`   ${u.role.padEnd(8)}  email: ${u.email.padEnd(28)} password: ${u.password}`);
  });
  console.log("────────────────────────────────────────────────────\n");
};

const destroy = async () => {
  console.log("💥  Destroying all seed data...");
  await User.deleteMany({});
  await Transaction.deleteMany({});
  console.log("   ✓ All users and transactions deleted.\n");
};

// ── Entry point ──────────────────────────────────────────────────────────────

const run = async () => {
  const command = process.argv[2];

  if (!["seed", "destroy"].includes(command)) {
    console.error('Usage: node src/utils/seeder.js [seed|destroy]');
    process.exit(1);
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error("MONGO_URI is not set in environment variables.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log("   Connected to MongoDB\n");

  if (command === "seed") await seed();
  if (command === "destroy") await destroy();

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seeder error:", err.message);
  process.exit(1);
});
