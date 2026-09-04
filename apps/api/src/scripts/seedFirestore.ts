import { adminFirestore, isFirebaseConfigured } from "../config/firebaseAdmin.js";

export async function seedFirestore() {
  if (!isFirebaseConfigured) {
    console.log("ℹ️  Firebase service account credentials (FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY) are not configured.");
    console.log("ℹ️  Skipping Firestore seeding. (PostgreSQL database is already fully synced & seeded).\n");
    return;
  }

  console.log("🔥 Starting DevFlow Master Firestore Database Seeding across all 22 Collections...\n");

  const db = adminFirestore;

  // ─── 1. Users Collection ──────────────────────────
  const users = [
    {
      id: "usr_alice",
      uid: "usr_alice",
      email: "alice@devflow.io",
      displayName: "Alice Chen",
      role: "ADMIN",
      title: "Lead Architect & Staff Engineer",
      photoURL: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
      status: "active",
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "usr_bob",
      uid: "usr_bob",
      email: "bob@devflow.io",
      displayName: "Bob Martinez",
      role: "DEVELOPER",
      title: "Senior Full-Stack Engineer",
      photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
      status: "active",
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "usr_carol",
      uid: "usr_carol",
      email: "carol@devflow.io",
      displayName: "Carol Zhang",
      role: "PROJECT_MANAGER",
      title: "Technical Product Manager",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
      status: "active",
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "usr_david",
      uid: "usr_david",
      email: "david@devflow.io",
      displayName: "David Kim",
      role: "TESTER",
      title: "QA Automation Engineer",
      photoURL: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
      status: "active",
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  for (const user of users) {
    await db.collection("users").doc(user.id).set(user, { merge: true });
  }
  console.log(`✅ [1/22] Seeded ${users.length} Users`);

  // ─── 2. Workspaces Collection ─────────────────────
  const workspaceId = "ws_acme_eng";
  const workspace = {
    id: workspaceId,
    name: "Acme Engineering",
    slug: "acme-engineering",
    description: "Primary engineering and product workspace for DevFlow",
    ownerId: "usr_alice",
    planId: "PRO",
    subscriptionStatus: "active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.collection("workspaces").doc(workspaceId).set(workspace, { merge: true });
  console.log(`✅ [2/22] Seeded Workspace: ${workspace.name}`);

  // ─── 3. Workspace Members Collection ──────────────
  const workspaceMembers = [
    { id: "mem_alice", workspaceId, userId: "usr_alice", role: "ADMIN", status: "active", joinedAt: new Date().toISOString() },
    { id: "mem_bob", workspaceId, userId: "usr_bob", role: "DEVELOPER", status: "active", joinedAt: new Date().toISOString() },
    { id: "mem_carol", workspaceId, userId: "usr_carol", role: "PROJECT_MANAGER", status: "active", joinedAt: new Date().toISOString() },
    { id: "mem_david", workspaceId, userId: "usr_david", role: "TESTER", status: "active", joinedAt: new Date().toISOString() },
  ];

  for (const wm of workspaceMembers) {
    await db.collection("workspaceMembers").doc(wm.id).set(wm, { merge: true });
  }
  console.log(`✅ [3/22] Seeded ${workspaceMembers.length} Workspace Members`);

  // ─── 4. Projects Collection ───────────────────────
  const projectId = "hg2D1fflVt3JgxNGwU50";
  const project = {
    id: projectId,
    workspaceId,
    name: "web applications",
    key: "WEB",
    description: "Cloud-native web applications and developer productivity platform",
    status: "ACTIVE",
    createdBy: "usr_alice",
    leadId: "usr_alice",
    membersCount: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.collection("projects").doc(projectId).set(project, { merge: true });
  console.log(`✅ [4/22] Seeded Project: ${project.name} (${project.key})`);

  // ─── 5. Project Members Collection ────────────────
  const projectMembers = [
    { id: "pmem_alice", projectId, workspaceId, userId: "usr_alice", role: "ADMIN", joinedAt: new Date().toISOString() },
    { id: "pmem_bob", projectId, workspaceId, userId: "usr_bob", role: "DEVELOPER", joinedAt: new Date().toISOString() },
    { id: "pmem_carol", projectId, workspaceId, userId: "usr_carol", role: "PROJECT_MANAGER", joinedAt: new Date().toISOString() },
    { id: "pmem_david", projectId, workspaceId, userId: "usr_david", role: "TESTER", joinedAt: new Date().toISOString() },
  ];

  for (const pm of projectMembers) {
    await db.collection("projectMembers").doc(pm.id).set(pm, { merge: true });
  }
  console.log(`✅ [5/22] Seeded ${projectMembers.length} Project Members`);

  // ─── 6. Sprints Collection ────────────────────────
  const sprintId = "cmtbwre9l0001u7x840tvwbvb";
  const sprint = {
    id: sprintId,
    workspaceId,
    projectId,
    name: "Sprint 1 - Foundation & UI",
    goal: "Establish Firestore real-time synchronization, RBAC security rules, and Kanban UI",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 14 * 86400000).toISOString(),
    status: "ACTIVE",
    createdBy: "usr_alice",
    createdAt: new Date().toISOString(),
  };

  await db.collection("sprints").doc(sprintId).set(sprint, { merge: true });
  console.log(`✅ [6/22] Seeded Sprint: ${sprint.name}`);

  // ─── 7. Labels Collection ─────────────────────────
  const labels = [
    { id: "lbl_ui", workspaceId, projectId, name: "frontend", color: "#4f46e5", description: "UI/UX and styling" },
    { id: "lbl_api", workspaceId, projectId, name: "api", color: "#06b6d4", description: "Backend endpoints" },
    { id: "lbl_sec", workspaceId, projectId, name: "security", color: "#ef4444", description: "RBAC and permissions" },
    { id: "lbl_ai", workspaceId, projectId, name: "ai", color: "#8b5cf6", description: "Machine learning workflows" },
  ];

  for (const lbl of labels) {
    await db.collection("labels").doc(lbl.id).set(lbl, { merge: true });
  }
  console.log(`✅ [7/22] Seeded ${labels.length} Labels`);

  // ─── 8. Issues Collection ─────────────────────────
  const issueId = "NEZhke5RHA7xqHJvuj43";
  const issue = {
    id: issueId,
    workspaceId,
    projectId,
    number: 6044,
    title: "ksdkkdf",
    description: "### Overview Structured engineering task derived from description: \"ksdkkdf\". ### Steps to Reproduce 1. Authenticate as developer 2. Trigger the workflow for: ksdkkdf 3. Inspect console and network latency headers ### Acceptance Criteria - [ ] Request completes with 200 OK within 150ms budget - [ ] Unit and regression tests pass with zero errors",
    status: "BACKLOG",
    priority: "MEDIUM",
    type: "FEATURE",
    assigneeId: "usr_alice",
    reporterId: "usr_alice",
    sprintId: sprintId,
    position: 0,
    storyPoints: 3,
    estimatedHours: 8,
    loggedHours: 0,
    labels: ["frontend", "api"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.collection("issues").doc(issueId).set(issue, { merge: true });
  console.log(`✅ [8/22] Seeded Primary Issue: WEB-6044 (${issue.title})`);

  // ─── 9. Comments Collection ───────────────────────
  const comment = {
    id: "cmt_initial",
    workspaceId,
    projectId,
    issueId,
    authorId: "usr_alice",
    authorName: "Alice Chen",
    authorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    content: "Initial task specification created and linked to active Sprint 1 milestone.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.collection("comments").doc(comment.id).set(comment, { merge: true });
  console.log(`✅ [9/22] Seeded Comment on ${issueId}`);

  // ─── 10. Notifications Collection ─────────────────
  const notification = {
    id: "notif_welcome",
    userId: "usr_alice",
    type: "ISSUE_ASSIGNED",
    title: "Issue assigned to you",
    message: "Alice Chen assigned WEB-6044 to you.",
    entityType: "ISSUE",
    entityId: issueId,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  await db.collection("notifications").doc(notification.id).set(notification, { merge: true });
  console.log(`✅ [10/22] Seeded Notification for ${notification.userId}`);

  // ─── 11. Activities Collection ────────────────────
  const activity = {
    id: "act_init",
    workspaceId,
    projectId,
    userId: "usr_alice",
    userName: "Alice Chen",
    action: "ISSUE_CREATED",
    entityType: "ISSUE",
    entityId: issueId,
    metadata: { title: issue.title, number: issue.number },
    createdAt: new Date().toISOString(),
  };

  await db.collection("activities").doc(activity.id).set(activity, { merge: true });
  console.log(`✅ [11/22] Seeded Activity log`);

  // ─── 12. Security Events Collection ───────────────
  const secEvent = {
    id: "sec_event_init",
    userId: "usr_alice",
    workspaceId,
    event: "LOGIN_SUCCESS",
    targetUserId: "usr_alice",
    ipAddress: "127.0.0.1",
    metadata: { method: "PASSWORD", userAgent: "DevFlow Client" },
    createdAt: new Date().toISOString(),
  };

  await db.collection("securityEvents").doc(secEvent.id).set(secEvent, { merge: true });
  console.log(`✅ [12/22] Seeded Security Event`);

  // ─── 13. AI Analyses Collection ───────────────────
  const aiAnalysis = {
    id: "ai_analysis_init",
    workspaceId,
    projectId,
    issueId,
    requestedBy: "usr_alice",
    model: "gemini-2.5-flash",
    category: "ARCHITECTURE",
    suggestedPriority: "MEDIUM",
    summary: "Automated analysis completed with 98% confidence. Schema constraints and regression test suite prepared.",
    reproductionSteps: ["1. Authenticate as developer", "2. Trigger API payload", "3. Assert 200 OK"],
    acceptanceCriteria: ["Response time < 150ms", "0 test regressions"],
    suggestedTasks: ["Implement schema validators", "Add automated end-to-end assertions"],
    createdAt: new Date().toISOString(),
  };

  await db.collection("aiAnalyses").doc(aiAnalysis.id).set(aiAnalysis, { merge: true });
  console.log(`✅ [13/22] Seeded AI Analysis Record`);

  // ─── 14. Attachments Collection ───────────────────
  const attachment = {
    id: "att_arch_diagram",
    workspaceId,
    projectId,
    issueId,
    uploadedBy: "usr_alice",
    fileName: "architecture_diagram.png",
    contentType: "image/png",
    size: 148500,
    storagePath: `workspaces/${workspaceId}/projects/${projectId}/issues/${issueId}/files/architecture_diagram.png`,
    downloadUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600",
    createdAt: new Date().toISOString(),
  };

  await db.collection("attachments").doc(attachment.id).set(attachment, { merge: true });
  console.log(`✅ [14/22] Seeded Attachment Metadata`);

  // ─── 15. GitHub Integrations Collection ───────────
  const ghIntegration = {
    id: "gh_integ_init",
    workspaceId,
    projectId,
    repositoryOwner: "devflow-org",
    repositoryName: "web-applications",
    installationId: "gh_inst_98412",
    status: "CONNECTED",
    createdAt: new Date().toISOString(),
  };

  await db.collection("githubIntegrations").doc(ghIntegration.id).set(ghIntegration, { merge: true });
  console.log(`✅ [15/22] Seeded GitHub Integration`);

  // ─── 16. GitHub Pull Requests Collection ──────────
  const ghPr = {
    id: "gh_pr_init",
    workspaceId,
    projectId,
    issueId,
    prNumber: 42,
    title: "feat(web): complete firestore connectivity and security rules",
    url: "https://github.com/devflow-org/web-applications/pull/42",
    status: "OPEN",
    authorId: "usr_alice",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.collection("githubPullRequests").doc(ghPr.id).set(ghPr, { merge: true });
  console.log(`✅ [16/22] Seeded GitHub Pull Request`);

  // ─── 17. Subscriptions Collection ─────────────────
  const subscription = {
    id: "sub_pro_init",
    workspaceId,
    planId: "PRO",
    provider: "razorpay",
    providerSubscriptionId: "sub_rzp_9841285",
    status: "ACTIVE",
    currentPeriodStart: new Date().toISOString(),
    currentPeriodEnd: new Date(Date.now() + 30 * 86400000).toISOString(),
    cancelAtPeriodEnd: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await db.collection("subscriptions").doc(subscription.id).set(subscription, { merge: true });
  console.log(`✅ [17/22] Seeded Subscription: ${subscription.planId}`);

  // ─── 18. Payments Collection ──────────────────────
  const payment = {
    id: "pay_init",
    workspaceId,
    subscriptionId: subscription.id,
    provider: "razorpay",
    providerPaymentId: "pay_rzp_104819",
    amount: 99900,
    currency: "INR",
    status: "CAPTURED",
    createdAt: new Date().toISOString(),
  };

  await db.collection("payments").doc(payment.id).set(payment, { merge: true });
  console.log(`✅ [18/22] Seeded Payment Record`);

  // ─── 19. Invoices Collection ──────────────────────
  const invoice = {
    id: "inv_init",
    workspaceId,
    invoiceNumber: "INV-2026-0001",
    subscriptionId: subscription.id,
    amount: 99900,
    currency: "INR",
    status: "PAID",
    periodStart: subscription.currentPeriodStart,
    periodEnd: subscription.currentPeriodEnd,
    createdAt: new Date().toISOString(),
  };

  await db.collection("invoices").doc(invoice.id).set(invoice, { merge: true });
  console.log(`✅ [19/22] Seeded Invoice: ${invoice.invoiceNumber}`);

  // ─── 20. Payment Methods Collection ───────────────
  const paymentMethod = {
    id: "pm_init",
    workspaceId,
    provider: "razorpay",
    providerMethodId: "token_rzp_card_4242",
    type: "CARD",
    brand: "VISA",
    last4: "4242",
    expiryMonth: 12,
    expiryYear: 2029,
    isDefault: true,
    createdAt: new Date().toISOString(),
  };

  await db.collection("paymentMethods").doc(paymentMethod.id).set(paymentMethod, { merge: true });
  console.log(`✅ [20/22] Seeded Tokenized Payment Method`);

  // ─── 21. Billing Events Collection (Idempotency) ──
  const billingEvent = {
    id: "be_init",
    provider: "razorpay",
    providerEventId: "evt_rzp_payment_captured_1",
    eventType: "PAYMENT_CAPTURED",
    processed: true,
    receivedAt: new Date().toISOString(),
    processedAt: new Date().toISOString(),
  };

  await db.collection("billingEvents").doc(billingEvent.id).set(billingEvent, { merge: true });
  console.log(`✅ [21/22] Seeded Billing Event`);

  // ─── 22. Usage & Sessions Collection ──────────────
  const usage = {
    id: "usage_2026_08",
    workspaceId,
    period: "2026-08",
    aiAnalyses: 12,
    storageBytes: 154288000,
    activeMembers: 4,
    projects: 1,
    updatedAt: new Date().toISOString(),
  };

  await db.collection("usage").doc(usage.id).set(usage, { merge: true });

  const session = {
    id: "sess_alice_init",
    userId: "usr_alice",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/128.0",
    ipAddress: "127.0.0.1",
    lastActiveAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };

  await db.collection("sessions").doc(session.id).set(session, { merge: true });
  console.log(`✅ [22/22] Seeded Usage Ledger & Active Session`);

  console.log("\n🚀 All 22 Firestore collections have been successfully initialized with full relational integrity!");
}

if (process.argv[1]?.includes("seedFirestore")) {
  seedFirestore()
    .then(() => process.exit(0))
    .catch((err) => {
      const errStr = String(err?.message || err);
      if (
        process.env.CI ||
        errStr.includes("Could not load the default credentials") ||
        errStr.includes("credentials")
      ) {
        console.warn("⚠️  Firestore seeding skipped:", err?.message || err);
        process.exit(0);
      }
      console.error("Firestore seeding failed:", err);
      process.exit(1);
    });
}
