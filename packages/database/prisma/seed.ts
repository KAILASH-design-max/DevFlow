import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding DevFlow Multi-Tenant PostgreSQL database...\n");

  const password = await argon2.hash("Password123", { type: argon2.argon2id });

  // ─────────────────────────────────────────────
  // 1. Create Users for Workspace A (Acme Engineering)
  // ─────────────────────────────────────────────
  const [alice, bob, carol, david, victor] = await Promise.all([
    prisma.user.upsert({
      where: { email: "alice@devflow.io" },
      update: {},
      create: {
        email: "alice@devflow.io",
        name: "Alice Chen",
        password,
        title: "VP of Engineering",
        bio: "Leading core platform initiatives and cloud architecture.",
        timezone: "America/Los_Angeles",
      },
    }),
    prisma.user.upsert({
      where: { email: "bob@devflow.io" },
      update: {},
      create: {
        email: "bob@devflow.io",
        name: "Bob Martinez",
        password,
        title: "Senior Fullstack Engineer",
        bio: "Focused on checkout flow, API reliability, and UI components.",
        timezone: "America/New_York",
      },
    }),
    prisma.user.upsert({
      where: { email: "carol@devflow.io" },
      update: {},
      create: {
        email: "carol@devflow.io",
        name: "Carol Zhang",
        password,
        title: "Lead Product Manager",
        bio: "Driving roadmap delivery, sprint velocity, and design alignment.",
        timezone: "America/Chicago",
      },
    }),
    prisma.user.upsert({
      where: { email: "david@devflow.io" },
      update: {},
      create: {
        email: "david@devflow.io",
        name: "David Kim",
        password,
        title: "Staff QA & DevOps Engineer",
        bio: "Automated regression pipelines, chaos testing, and observability.",
        timezone: "Europe/London",
      },
    }),
    prisma.user.upsert({
      where: { email: "victor@devflow.io" },
      update: {},
      create: {
        email: "victor@devflow.io",
        name: "Victor Vance",
        password,
        title: "Engineering Observer / Stakeholder",
        bio: "Observing engineering metrics and sprint progress.",
        timezone: "America/Los_Angeles",
      },
    }),
  ]);

  console.log("✅ Created Workspace A users (Alice, Bob, Carol, David, Victor)");

  // ─────────────────────────────────────────────
  // 2. Create Users for Workspace B (Globex Corporation)
  // ─────────────────────────────────────────────
  const [grace, dan, vince] = await Promise.all([
    prisma.user.upsert({
      where: { email: "grace@globex.io" },
      update: {},
      create: {
        email: "grace@globex.io",
        name: "Grace Hopper",
        password,
        title: "CTO & Founder",
        bio: "Building next-generation distributed logistics systems at Globex.",
        timezone: "America/New_York",
      },
    }),
    prisma.user.upsert({
      where: { email: "dan@globex.io" },
      update: {},
      create: {
        email: "dan@globex.io",
        name: "Dan Developer",
        password,
        title: "Backend Specialist",
        bio: "Microservice performance, data pipelines, and Redis caching.",
        timezone: "America/Chicago",
      },
    }),
    prisma.user.upsert({
      where: { email: "vince@globex.io" },
      update: {},
      create: {
        email: "vince@globex.io",
        name: "Vince Viewer",
        password,
        title: "External Auditor",
        bio: "Compliance review and security auditing.",
        timezone: "Europe/Berlin",
      },
    }),
  ]);

  console.log("✅ Created Workspace B users (Grace, Dan, Vince)");

  // ─────────────────────────────────────────────
  // 3. Workspace A (Acme Engineering)
  // ─────────────────────────────────────────────
  const workspaceA = await prisma.workspace.upsert({
    where: { slug: "acme-engineering" },
    update: {},
    create: {
      name: "Acme Engineering",
      slug: "acme-engineering",
      description: "Primary engineering organization for Acme platform",
      ownerId: alice.id,
    },
  });

  for (const [user, role] of [
    [alice, "ADMIN"],
    [bob, "DEVELOPER"],
    [carol, "PROJECT_MANAGER"],
    [david, "TESTER"],
    [victor, "VIEWER"],
  ] as const) {
    await prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspaceA.id,
        },
      },
      update: { role },
      create: {
        userId: user.id,
        workspaceId: workspaceA.id,
        role,
      },
    });
  }

  await prisma.workspaceSecurityPolicy.upsert({
    where: { workspaceId: workspaceA.id },
    update: {},
    create: {
      workspaceId: workspaceA.id,
      enforceTwoFactor: false,
      restrictProjectCreation: true,
      publicIssuesRead: false,
      sessionTimeoutHours: 24,
    },
  });

  await prisma.workspaceSubscription.upsert({
    where: { workspaceId: workspaceA.id },
    update: {},
    create: {
      workspaceId: workspaceA.id,
      tier: "ENTERPRISE",
      interval: "ANNUAL",
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      paymentBrand: "Visa",
      paymentLast4: "4242",
    },
  });

  console.log("✅ Configured Workspace A: Acme Engineering (5 members, Security Policy, Enterprise Subscription)");

  // ─────────────────────────────────────────────
  // 4. Workspace B (Globex Corporation)
  // ─────────────────────────────────────────────
  const workspaceB = await prisma.workspace.upsert({
    where: { slug: "globex-corp" },
    update: {},
    create: {
      name: "Globex Corporation",
      slug: "globex-corp",
      description: "Isolated enterprise logistics systems organization",
      ownerId: grace.id,
    },
  });

  for (const [user, role] of [
    [grace, "ADMIN"],
    [dan, "DEVELOPER"],
    [vince, "VIEWER"],
  ] as const) {
    await prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspaceB.id,
        },
      },
      update: { role },
      create: {
        userId: user.id,
        workspaceId: workspaceB.id,
        role,
      },
    });
  }

  await prisma.workspaceSecurityPolicy.upsert({
    where: { workspaceId: workspaceB.id },
    update: {},
    create: {
      workspaceId: workspaceB.id,
      enforceTwoFactor: true,
      restrictProjectCreation: true,
      publicIssuesRead: false,
      sessionTimeoutHours: 12,
    },
  });

  await prisma.workspaceSubscription.upsert({
    where: { workspaceId: workspaceB.id },
    update: {},
    create: {
      workspaceId: workspaceB.id,
      tier: "PRO",
      interval: "MONTHLY",
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentBrand: "Mastercard",
      paymentLast4: "8888",
    },
  });

  console.log("✅ Configured Workspace B: Globex Corporation (3 members, Security Policy, Pro Subscription)");

  // ─────────────────────────────────────────────
  // 5. Workspace A Project (SpeedyShop — SS)
  // ─────────────────────────────────────────────
  const projectA = await prisma.project.upsert({
    where: {
      workspaceId_key: {
        workspaceId: workspaceA.id,
        key: "SS",
      },
    },
    update: {},
    create: {
      name: "SpeedyShop",
      key: "SS",
      description: "High-performance e-commerce delivery logistics platform",
      workspaceId: workspaceA.id,
    },
  });

  for (const [u, r] of [
    [alice, "ADMIN"],
    [bob, "DEVELOPER"],
    [carol, "PROJECT_MANAGER"],
    [david, "TESTER"],
    [victor, "VIEWER"],
  ] as const) {
    await prisma.projectMember.upsert({
      where: { userId_projectId: { userId: u.id, projectId: projectA.id } },
      update: { role: r },
      create: { userId: u.id, projectId: projectA.id, role: r },
    });
  }

  const labelDataA = [
    { name: "checkout", color: "#ef4444" },
    { name: "payment", color: "#f97316" },
    { name: "authentication", color: "#8b5cf6" },
    { name: "api", color: "#3b82f6" },
    { name: "ui", color: "#06b6d4" },
    { name: "performance", color: "#22c55e" },
    { name: "security", color: "#ec4899" },
    { name: "coupon", color: "#eab308" },
    { name: "cart", color: "#14b8a6" },
    { name: "search", color: "#a855f7" },
  ];

  const labelsA: Record<string, string> = {};
  for (const label of labelDataA) {
    const created = await prisma.label.upsert({
      where: { projectId_name: { projectId: projectA.id, name: label.name } },
      update: {},
      create: { name: label.name, color: label.color, projectId: projectA.id },
    });
    labelsA[label.name] = created.id;
  }

  const sprintA = await prisma.sprint.upsert({
    where: { id: "sprint_acme_18" },
    update: {},
    create: {
      id: "sprint_acme_18",
      name: "Sprint 18",
      goal: "Enhance checkout throughput and payment reliability",
      status: "ACTIVE",
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      projectId: projectA.id,
    },
  });

  const issueDataA = [
    { number: 1, title: "Checkout crashes when applying SAVE20 coupon", description: "Null pointer validation error during discount calculation.", type: "BUG", status: "IN_PROGRESS", priority: "HIGH", storyPoints: 5, assigneeId: bob.id, reporterId: david.id, sprintId: sprintA.id, position: 0, labelNames: ["checkout", "coupon"] },
    { number: 2, title: "Cart total displays negative value with stacked discounts", description: "Cart needs $0 baseline floor constraint.", type: "BUG", status: "TODO", priority: "CRITICAL", storyPoints: 8, assigneeId: bob.id, reporterId: carol.id, sprintId: sprintA.id, position: 0, labelNames: ["cart", "checkout"] },
    { number: 3, title: "Implement elastic product search with faceted filters", description: "Add typeahead search with pricing and inventory facets.", type: "FEATURE", status: "BACKLOG", priority: "MEDIUM", storyPoints: 5, assigneeId: null, reporterId: carol.id, sprintId: null, position: 0, labelNames: ["search", "ui"] },
    { number: 4, title: "Payment gateway timeout retry circuit breaker", description: "Add idempotent retry headers on 504 gateway timeouts.", type: "BUG", status: "IN_REVIEW", priority: "HIGH", storyPoints: 3, assigneeId: alice.id, reporterId: david.id, sprintId: sprintA.id, position: 0, labelNames: ["payment", "api"] },
    { number: 5, title: "Add real-time order tracking map", description: "Live GPS driver status tracking via SSE.", type: "FEATURE", status: "TODO", priority: "MEDIUM", storyPoints: 8, assigneeId: bob.id, reporterId: carol.id, sprintId: sprintA.id, position: 1, labelNames: ["ui"] },
    { number: 6, title: "Optimize product catalog WebP image caching", description: "Implement CDN edge caching and responsive srcset.", type: "TASK", status: "DONE", priority: "LOW", storyPoints: 2, assigneeId: alice.id, reporterId: alice.id, sprintId: sprintA.id, position: 0, labelNames: ["performance", "ui"] },
    { number: 7, title: "Fix session persistence across tab navigation", description: "Handle cookie refresh tokens gracefully on page reload.", type: "BUG", status: "DONE", priority: "HIGH", storyPoints: 3, assigneeId: alice.id, reporterId: bob.id, sprintId: sprintA.id, position: 1, labelNames: ["authentication", "security"] },
    { number: 8, title: "Implement rate limiting on authentication routes", description: "Sliding window rate limit on login/register endpoints.", type: "TASK", status: "IN_PROGRESS", priority: "MEDIUM", storyPoints: 3, assigneeId: alice.id, reporterId: carol.id, sprintId: sprintA.id, position: 1, labelNames: ["security", "api"] },
    { number: 9, title: "User wishlist and shared shopping list sync", description: "Save wishlist items across mobile and web sessions.", type: "STORY", status: "BACKLOG", priority: "LOW", storyPoints: 5, assigneeId: null, reporterId: carol.id, sprintId: null, position: 1, labelNames: ["ui"] },
    { number: 10, title: "Product listing query optimization under 100ms", description: "Add database composite indexes and cursor pagination.", type: "BUG", status: "TODO", priority: "MEDIUM", storyPoints: 3, assigneeId: david.id, reporterId: bob.id, sprintId: sprintA.id, position: 2, labelNames: ["api", "performance"] },
  ];

  for (const issue of issueDataA) {
    const { labelNames, ...data } = issue;
    const created = await prisma.issue.upsert({
      where: { projectId_number: { projectId: projectA.id, number: data.number } },
      update: { ...data },
      create: { ...data, projectId: projectA.id },
    });

    for (const labelName of labelNames) {
      if (labelsA[labelName]) {
        await prisma.issueLabel.upsert({
          where: { issueId_labelId: { issueId: created.id, labelId: labelsA[labelName] } },
          update: {},
          create: { issueId: created.id, labelId: labelsA[labelName] },
        });
      }
    }
  }

  const firstIssueA = await prisma.issue.findFirst({
    where: { projectId: projectA.id, number: 1 },
  });

  if (firstIssueA) {
    const countA = await prisma.comment.count({ where: { issueId: firstIssueA.id } });
    if (countA === 0) {
      await prisma.comment.createMany({
        data: [
          { content: "Traced the root cause to coupon discount percentage calculation.", issueId: firstIssueA.id, authorId: bob.id },
          { content: "Reproducible on iOS mobile app as well.", issueId: firstIssueA.id, authorId: david.id },
          { content: "Fix verified in staging environment.", issueId: firstIssueA.id, authorId: bob.id },
        ],
      });
    }
  }

  console.log("✅ Seeded Workspace A Project (SpeedyShop — 10 issues, 10 labels, Sprint 18, comments)");

  // ─────────────────────────────────────────────
  // 6. Workspace B Project (Globex Core — GC)
  // ─────────────────────────────────────────────
  const projectB = await prisma.project.upsert({
    where: {
      workspaceId_key: {
        workspaceId: workspaceB.id,
        key: "GC",
      },
    },
    update: {},
    create: {
      name: "Globex Core",
      key: "GC",
      description: "Automated logistics and supply chain routing core engine",
      workspaceId: workspaceB.id,
    },
  });

  for (const [u, r] of [
    [grace, "ADMIN"],
    [dan, "DEVELOPER"],
    [vince, "VIEWER"],
  ] as const) {
    await prisma.projectMember.upsert({
      where: { userId_projectId: { userId: u.id, projectId: projectB.id } },
      update: { role: r },
      create: { userId: u.id, projectId: projectB.id, role: r },
    });
  }

  const labelDataB = [
    { name: "routing", color: "#3b82f6" },
    { name: "telemetry", color: "#06b6d4" },
    { name: "infra", color: "#8b5cf6" },
    { name: "security", color: "#ec4899" },
    { name: "dispatch", color: "#f97316" },
  ];

  const labelsB: Record<string, string> = {};
  for (const label of labelDataB) {
    const created = await prisma.label.upsert({
      where: { projectId_name: { projectId: projectB.id, name: label.name } },
      update: {},
      create: { name: label.name, color: label.color, projectId: projectB.id },
    });
    labelsB[label.name] = created.id;
  }

  const sprintB = await prisma.sprint.upsert({
    where: { id: "sprint_globex_1" },
    update: {},
    create: {
      id: "sprint_globex_1",
      name: "Sprint 1 — Routing Core",
      goal: "Initialize high-concurrency dispatch queue",
      status: "ACTIVE",
      startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 11 * 24 * 60 * 60 * 1000),
      projectId: projectB.id,
    },
  });

  const issueDataB = [
    { number: 1, title: "Setup Kafka event bus for real-time fleet telemetry", description: "Stream vehicle coordinates with partition key by region.", type: "FEATURE", status: "IN_PROGRESS", priority: "HIGH", storyPoints: 8, assigneeId: dan.id, reporterId: grace.id, sprintId: sprintB.id, position: 0, labelNames: ["telemetry", "infra"] },
    { number: 2, title: "Optimize Dijkstra routing algorithm for multi-stop delivery", description: "Reduce path computation from O(V^2) to O(E + V log V).", type: "TASK", status: "TODO", priority: "CRITICAL", storyPoints: 13, assigneeId: dan.id, reporterId: grace.id, sprintId: sprintB.id, position: 0, labelNames: ["routing"] },
    { number: 3, title: "Enforce mTLS certificate authentication between fleet gateways", description: "Prevent rogue telemetry nodes from injecting false coordinates.", type: "TASK", status: "DONE", priority: "CRITICAL", storyPoints: 5, assigneeId: grace.id, reporterId: grace.id, sprintId: sprintB.id, position: 0, labelNames: ["security", "infra"] },
  ];

  for (const issue of issueDataB) {
    const { labelNames, ...data } = issue;
    const created = await prisma.issue.upsert({
      where: { projectId_number: { projectId: projectB.id, number: data.number } },
      update: { ...data },
      create: { ...data, projectId: projectB.id },
    });

    for (const labelName of labelNames) {
      if (labelsB[labelName]) {
        await prisma.issueLabel.upsert({
          where: { issueId_labelId: { issueId: created.id, labelId: labelsB[labelName] } },
          update: {},
          create: { issueId: created.id, labelId: labelsB[labelName] },
        });
      }
    }
  }

  console.log("✅ Seeded Workspace B Project (Globex Core — 3 issues, 5 labels, Sprint 1)");

  // ─────────────────────────────────────────────
  // 7. Notifications
  // ─────────────────────────────────────────────
  const notifCount = await prisma.notification.count();
  if (notifCount === 0) {
    await prisma.notification.createMany({
      data: [
        { type: "ISSUE_ASSIGNED", title: "Issue assigned to you", message: 'You were assigned to "Checkout crashes when applying SAVE20 coupon"', userId: bob.id, isRead: false },
        { type: "ISSUE_COMMENTED", title: "New comment on your issue", message: 'Bob commented on "Checkout crashes when applying SAVE20 coupon"', userId: david.id, isRead: true },
        { type: "SPRINT_STARTED", title: "Sprint started", message: "Sprint 18 has started. Good luck Acme team!", userId: alice.id, isRead: false },
        { type: "ISSUE_ASSIGNED", title: "Globex Task Assigned", message: 'You were assigned to "Setup Kafka event bus for real-time fleet telemetry"', userId: dan.id, isRead: false },
        { type: "SPRINT_STARTED", title: "Globex Sprint Started", message: "Sprint 1 — Routing Core is now live!", userId: grace.id, isRead: false },
      ],
    });
  }

  console.log("✅ Seeded multi-tenant notifications");
  console.log("\n🎉 Multi-Tenant PostgreSQL Seeding Completed Successfully!");
  console.log("\n📧 Seed Credentials:");
  console.log("   Workspace A (Acme):");
  console.log("     - Admin:     alice@devflow.io  / Password123");
  console.log("     - Developer: bob@devflow.io    / Password123");
  console.log("     - PM:        carol@devflow.io  / Password123");
  console.log("     - Tester:    david@devflow.io  / Password123");
  console.log("     - Viewer:    victor@devflow.io / Password123");
  console.log("   Workspace B (Globex):");
  console.log("     - Admin:     grace@globex.io   / Password123");
  console.log("     - Developer: dan@globex.io     / Password123");
  console.log("     - Viewer:    vince@globex.io   / Password123");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
