import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export async function seedFirestoreFromClient() {
  console.log("🔥 Seeding Firestore from Web Client SDK...");
  try {
    // 1. Users
  const users = [
    {
      id: "usr_alice",
      uid: "usr_alice",
      email: "alice@devflow.io",
      name: "Alice Chen",
      role: "ADMIN",
      title: "Lead Architect & Staff Engineer",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      createdAt: serverTimestamp(),
    },
    {
      id: "usr_bob",
      uid: "usr_bob",
      email: "bob@devflow.io",
      name: "Bob Martinez",
      role: "DEVELOPER",
      title: "Senior Full-Stack Engineer",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      createdAt: serverTimestamp(),
    },
    {
      id: "usr_carol",
      uid: "usr_carol",
      email: "carol@devflow.io",
      name: "Carol Zhang",
      role: "PROJECT_MANAGER",
      title: "Technical Product Manager",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      createdAt: serverTimestamp(),
    },
    {
      id: "usr_david",
      uid: "usr_david",
      email: "david@devflow.io",
      name: "David Kim",
      role: "TESTER",
      title: "QA Automation Engineer",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      createdAt: serverTimestamp(),
    },
  ];

  for (const user of users) {
    await setDoc(doc(db, "users", user.id), user, { merge: true });
  }

  // 2. Workspace
  const workspaceId = "ws_acme_eng";
  const workspace = {
    id: workspaceId,
    name: "Acme Engineering",
    slug: "acme-engineering",
    description: "Primary engineering and product workspace for DevFlow",
    ownerId: "usr_alice",
    members: [
      { userId: "usr_alice", role: "ADMIN", name: "Alice Chen" },
      { userId: "usr_bob", role: "DEVELOPER", name: "Bob Martinez" },
      { userId: "usr_carol", role: "PROJECT_MANAGER", name: "Carol Zhang" },
      { userId: "usr_david", role: "TESTER", name: "David Kim" },
    ],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "workspaces", workspaceId), workspace, { merge: true });

  // 3. Project
  const projectId = "proj_speedyshop";
  const project = {
    id: projectId,
    workspaceId,
    name: "SpeedyShop",
    key: "SS",
    description: "High-performance e-commerce platform with automated delivery logistics",
    leadId: "usr_alice",
    membersCount: 4,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, "projects", projectId), project, { merge: true });

  // 4. Sprint
  const sprintId = "sprint_18";
  const sprint = {
    id: sprintId,
    projectId,
    name: "Sprint 18 - Reliability & Performance",
    goal: "Fix coupon calculation edge-cases, reduce product API response times, and ship 2FA auth",
    status: "ACTIVE",
    totalPoints: 34,
    completedPoints: 12,
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, "sprints", sprintId), sprint, { merge: true });

  // 5. Labels
  const labels = [
    { id: "lbl_checkout", name: "checkout", color: "#ef4444", projectId },
    { id: "lbl_payment", name: "payment", color: "#f97316", projectId },
    { id: "lbl_auth", name: "authentication", color: "#8b5cf6", projectId },
    { id: "lbl_api", name: "api", color: "#3b82f6", projectId },
    { id: "lbl_ui", name: "ui", color: "#06b6d4", projectId },
    { id: "lbl_perf", name: "performance", color: "#22c55e", projectId },
    { id: "lbl_sec", name: "security", color: "#ec4899", projectId },
    { id: "lbl_coupon", name: "coupon", color: "#eab308", projectId },
    { id: "lbl_cart", name: "cart", color: "#14b8a6", projectId },
    { id: "lbl_search", name: "search", color: "#a855f7", projectId },
  ];

  for (const label of labels) {
    await setDoc(doc(db, "labels", label.id), label, { merge: true });
  }

  // 6. Issues (Kanban Board)
  const issues = [
    {
      id: "issue_ss_1",
      projectId,
      number: 1,
      key: "SS-1",
      title: "Checkout crashes when user applies SAVE20 coupon",
      description: "When entering coupon SAVE20 with items totaling under $50, the checkout handler throws a 500 error due to negative discount values.",
      type: "BUG",
      status: "IN_PROGRESS",
      priority: "CRITICAL",
      assigneeId: "usr_bob",
      assigneeName: "Bob Martinez",
      reporterId: "usr_david",
      sprintId,
      position: 0,
      storyPoints: 5,
      estimatedHours: 6,
      loggedHours: 3.5,
      labels: ["checkout", "coupon", "payment"],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      id: "issue_ss_2",
      projectId,
      number: 2,
      key: "SS-2",
      title: "Cart items count not updating across browser tabs",
      description: "Adding an item to the shopping cart on Tab A does not broadcast an update to Tab B without a full browser reload.",
      type: "BUG",
      status: "TODO",
      priority: "HIGH",
      assigneeId: "usr_alice",
      assigneeName: "Alice Chen",
      reporterId: "usr_carol",
      sprintId,
      position: 0,
      storyPoints: 3,
      estimatedHours: 4,
      loggedHours: 0,
      labels: ["cart", "ui"],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      id: "issue_ss_3",
      projectId,
      number: 3,
      key: "SS-3",
      title: "Implement Google & Phone SMS Authentication",
      description: "Integrate Firebase Authentication to enable passwordless SMS verification and Google One-Click sign-in.",
      type: "FEATURE",
      status: "DONE",
      priority: "HIGH",
      assigneeId: "usr_alice",
      assigneeName: "Alice Chen",
      reporterId: "usr_alice",
      sprintId,
      position: 0,
      storyPoints: 8,
      estimatedHours: 12,
      loggedHours: 11.5,
      labels: ["authentication", "security"],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      id: "issue_ss_4",
      projectId,
      number: 4,
      key: "SS-4",
      title: "Product search auto-complete dropdown latency optimization",
      description: "The product search debounced query takes 450ms. Optimize full-text index query on Firestore/PostgreSQL.",
      type: "TASK",
      status: "IN_REVIEW",
      priority: "MEDIUM",
      assigneeId: "usr_bob",
      assigneeName: "Bob Martinez",
      reporterId: "usr_carol",
      sprintId,
      position: 0,
      storyPoints: 5,
      estimatedHours: 6,
      loggedHours: 5,
      labels: ["search", "performance", "api"],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      id: "issue_ss_5",
      projectId,
      number: 5,
      key: "SS-5",
      title: "E2E automated testing for payment webhooks",
      description: "Write Playwright and Supertest coverage simulating Stripe/PayPal webhook callbacks under concurrency.",
      type: "TASK",
      status: "TESTING",
      priority: "MEDIUM",
      assigneeId: "usr_david",
      assigneeName: "David Kim",
      reporterId: "usr_alice",
      sprintId,
      position: 0,
      storyPoints: 5,
      estimatedHours: 8,
      loggedHours: 4,
      labels: ["payment", "api"],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    {
      id: "issue_ss_6",
      projectId,
      number: 6,
      key: "SS-6",
      title: "Dark mode theme toggle and visual token alignment",
      description: "Support system, light, and high-contrast dark mode across all dashboard Kanban and settings screens.",
      type: "FEATURE",
      status: "BACKLOG",
      priority: "LOW",
      assigneeId: null,
      assigneeName: null,
      reporterId: "usr_carol",
      sprintId: null,
      position: 0,
      storyPoints: 3,
      estimatedHours: 4,
      loggedHours: 0,
      labels: ["ui"],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
  ];

  for (const issue of issues) {
    await setDoc(doc(db, "issues", issue.id), issue, { merge: true });
  }

  // 7. Comments
  const comments = [
    {
      id: "comment_1",
      issueId: "issue_ss_1",
      authorId: "usr_bob",
      authorName: "Bob Martinez",
      authorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      content: "I reproduced the issue in our staging environment. When the cart total is $40 and coupon SAVE20 ($20 off min $50) is forced, it creates an invalid state.",
      createdAt: serverTimestamp(),
    },
    {
      id: "comment_2",
      issueId: "issue_ss_1",
      authorId: "usr_david",
      authorName: "David Kim",
      authorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      content: "Automated regression test `checkout_coupon_min_amount.spec.ts` has been added to verify the fix.",
      createdAt: serverTimestamp(),
    },
  ];

  for (const comment of comments) {
    await setDoc(doc(db, "comments", comment.id), comment, { merge: true });
  }

  console.log("✅ Successfully seeded Firestore from client!");
  return { success: true, count: issues.length };
  } catch (err: any) {
    if (err?.code === "permission-denied" || err?.message?.includes("permission")) {
      throw new Error(
        "Firestore Security Rules in Firebase Console are locked. Please set: 'allow read, write: if true;' in Firebase Console -> Firestore Database -> Rules tab."
      );
    }
    throw err;
  }
}
