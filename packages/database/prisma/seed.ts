import { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding DevFlow database...\n");

  // ─── Create Users ───────────────────────────────
  const password = await argon2.hash("Password123", { type: argon2.argon2id });

  const [alice, bob, carol, david] = await Promise.all([
    prisma.user.upsert({
      where: { email: "alice@devflow.io" },
      update: {},
      create: {
        email: "alice@devflow.io",
        name: "Alice Chen",
        password,
        avatar: null,
      },
    }),
    prisma.user.upsert({
      where: { email: "bob@devflow.io" },
      update: {},
      create: {
        email: "bob@devflow.io",
        name: "Bob Martinez",
        password,
        avatar: null,
      },
    }),
    prisma.user.upsert({
      where: { email: "carol@devflow.io" },
      update: {},
      create: {
        email: "carol@devflow.io",
        name: "Carol Zhang",
        password,
        avatar: null,
      },
    }),
    prisma.user.upsert({
      where: { email: "david@devflow.io" },
      update: {},
      create: {
        email: "david@devflow.io",
        name: "David Kim",
        password,
        avatar: null,
      },
    }),
  ]);

  console.log("✅ Created 4 users");

  // ─── Create Workspace ───────────────────────────
  const workspace = await prisma.workspace.upsert({
    where: { slug: "acme-engineering" },
    update: {},
    create: {
      name: "Acme Engineering",
      slug: "acme-engineering",
      description: "Main engineering workspace",
      ownerId: alice.id,
    },
  });

  // Add all users as workspace members
  for (const [user, role] of [
    [alice, "ADMIN"],
    [bob, "DEVELOPER"],
    [carol, "PROJECT_MANAGER"],
    [david, "TESTER"],
  ] as const) {
    await prisma.workspaceMember.upsert({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: workspace.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        workspaceId: workspace.id,
        role,
      },
    });
  }

  console.log("✅ Created workspace: Acme Engineering");

  // ─── Create Project ─────────────────────────────
  const project = await prisma.project.upsert({
    where: {
      workspaceId_key: {
        workspaceId: workspace.id,
        key: "SS",
      },
    },
    update: {},
    create: {
      name: "SpeedyShop",
      key: "SS",
      description: "E-commerce platform for fast delivery",
      workspaceId: workspace.id,
    },
  });

  // Add members to project
  for (const user of [alice, bob, carol, david]) {
    await prisma.projectMember.upsert({
      where: {
        userId_projectId: {
          userId: user.id,
          projectId: project.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        projectId: project.id,
        role: user.id === alice.id ? "ADMIN" : "DEVELOPER",
      },
    });
  }

  console.log("✅ Created project: SpeedyShop (SS)");

  // ─── Create Labels ─────────────────────────────
  const labelData = [
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

  const labels: Record<string, string> = {};
  for (const label of labelData) {
    const created = await prisma.label.upsert({
      where: {
        projectId_name: {
          projectId: project.id,
          name: label.name,
        },
      },
      update: {},
      create: {
        name: label.name,
        color: label.color,
        projectId: project.id,
      },
    });
    labels[label.name] = created.id;
  }

  console.log("✅ Created 10 labels");

  // ─── Create Sprint ─────────────────────────────
  const sprint = await prisma.sprint.create({
    data: {
      name: "Sprint 18",
      goal: "Improve checkout flow and fix coupon bugs",
      status: "ACTIVE",
      startDate: new Date("2026-08-11"),
      endDate: new Date("2026-08-25"),
      projectId: project.id,
    },
  });

  console.log("✅ Created sprint: Sprint 18");

  // ─── Create Issues ─────────────────────────────
  const issueData = [
    {
      number: 1,
      title: "Checkout crashes when user applies SAVE20 coupon",
      description:
        "The application crashes immediately after applying the SAVE20 coupon code during checkout. The error occurs in the validation layer and affects all users.",
      type: "BUG",
      status: "IN_PROGRESS",
      priority: "HIGH",
      assigneeId: bob.id,
      reporterId: david.id,
      sprintId: sprint.id,
      position: 0,
      labelNames: ["checkout", "coupon"],
    },
    {
      number: 2,
      title: "Cart total shows negative value with multiple discounts",
      description:
        "When applying multiple discounts, the cart total can become negative. Need to add a floor of $0.",
      type: "BUG",
      status: "TODO",
      priority: "CRITICAL",
      assigneeId: bob.id,
      reporterId: carol.id,
      sprintId: sprint.id,
      position: 0,
      labelNames: ["cart", "checkout"],
    },
    {
      number: 3,
      title: "Implement product search with filters",
      description:
        "Add full-text search for products with filters for category, price range, and rating.",
      type: "FEATURE",
      status: "BACKLOG",
      priority: "MEDIUM",
      assigneeId: null,
      reporterId: carol.id,
      sprintId: null,
      position: 0,
      labelNames: ["search", "ui"],
    },
    {
      number: 4,
      title: "Payment gateway timeout after 30 seconds",
      description:
        "Payment processing times out after 30 seconds on slow connections. Need to increase timeout and add retry logic.",
      type: "BUG",
      status: "IN_REVIEW",
      priority: "HIGH",
      assigneeId: alice.id,
      reporterId: david.id,
      sprintId: sprint.id,
      position: 0,
      labelNames: ["payment", "api"],
    },
    {
      number: 5,
      title: "Add order tracking page",
      description:
        "Create a page where users can track their order status in real-time with delivery updates.",
      type: "FEATURE",
      status: "TODO",
      priority: "MEDIUM",
      assigneeId: bob.id,
      reporterId: carol.id,
      sprintId: sprint.id,
      position: 1,
      labelNames: ["ui"],
    },
    {
      number: 6,
      title: "Optimize product image loading",
      description:
        "Product images are loading slowly. Implement lazy loading and WebP format support.",
      type: "TASK",
      status: "DONE",
      priority: "LOW",
      assigneeId: alice.id,
      reporterId: alice.id,
      sprintId: sprint.id,
      position: 0,
      labelNames: ["performance", "ui"],
    },
    {
      number: 7,
      title: "Fix login session not persisting after page refresh",
      description:
        "Users are being logged out after refreshing the page. The session token is not being saved correctly.",
      type: "BUG",
      status: "DONE",
      priority: "HIGH",
      assigneeId: alice.id,
      reporterId: bob.id,
      sprintId: sprint.id,
      position: 1,
      labelNames: ["authentication", "security"],
    },
    {
      number: 8,
      title: "Add rate limiting to authentication endpoints",
      description:
        "Implement rate limiting on /login and /register to prevent brute force attacks. Use sliding window algorithm.",
      type: "TASK",
      status: "IN_PROGRESS",
      priority: "MEDIUM",
      assigneeId: alice.id,
      reporterId: carol.id,
      sprintId: sprint.id,
      position: 1,
      labelNames: ["security", "api"],
    },
    {
      number: 9,
      title: "As a user, I want to save items to a wishlist",
      description:
        "Users should be able to save products to a wishlist from product detail pages and the search results page.",
      type: "STORY",
      status: "BACKLOG",
      priority: "LOW",
      assigneeId: null,
      reporterId: carol.id,
      sprintId: null,
      position: 1,
      labelNames: ["ui"],
    },
    {
      number: 10,
      title: "API response time exceeds 500ms for product listing",
      description:
        "The /api/products endpoint is slow. Need to add database indexing and implement pagination.",
      type: "BUG",
      status: "TODO",
      priority: "MEDIUM",
      assigneeId: david.id,
      reporterId: bob.id,
      sprintId: sprint.id,
      position: 2,
      labelNames: ["api", "performance"],
    },
  ];

  for (const issue of issueData) {
    const { labelNames, ...data } = issue;
    const created = await prisma.issue.upsert({
      where: {
        projectId_number: {
          projectId: project.id,
          number: data.number,
        },
      },
      update: {
        ...data,
      },
      create: {
        ...data,
        projectId: project.id,
      },
    });

    // Add labels
    for (const labelName of labelNames) {
      if (labels[labelName]) {
        await prisma.issueLabel.upsert({
          where: {
            issueId_labelId: {
              issueId: created.id,
              labelId: labels[labelName],
            },
          },
          update: {},
          create: {
            issueId: created.id,
            labelId: labels[labelName],
          },
        });
      }
    }
  }

  console.log("✅ Created 10 issues");

  // ─── Create Comments ───────────────────────────
  const firstIssue = await prisma.issue.findFirst({
    where: { projectId: project.id, number: 1 },
  });

  if (firstIssue) {
    const existingComments = await prisma.comment.count({ where: { issueId: firstIssue.id } });
    if (existingComments === 0) {
      await prisma.comment.createMany({
        data: [
          {
            content:
              "The crash happens in the validation layer. I traced it to the coupon discount calculation.",
            issueId: firstIssue.id,
            authorId: bob.id,
          },
          {
            content:
              "I can reproduce this reliably on mobile too. The SAVE10 coupon works fine though.",
            issueId: firstIssue.id,
            authorId: david.id,
          },
          {
            content:
              "Looks like the percentage calculation doesn't account for the minimum order amount. Working on a fix.",
            issueId: firstIssue.id,
            authorId: bob.id,
          },
        ],
      });
    }
  }

  console.log("✅ Created 3 comments");

  // ─── Create Notifications ──────────────────────
  const existingNotifications = await prisma.notification.count();
  if (existingNotifications === 0) {
    await prisma.notification.createMany({
      data: [
        {
          type: "ISSUE_ASSIGNED",
          title: "Issue assigned to you",
          message: 'You were assigned to "Checkout crashes when user applies SAVE20 coupon"',
          userId: bob.id,
          isRead: false,
        },
        {
          type: "ISSUE_COMMENTED",
          title: "New comment on your issue",
          message: 'Bob commented on "Checkout crashes when user applies SAVE20 coupon"',
          userId: david.id,
          isRead: true,
        },
        {
          type: "SPRINT_STARTED",
          title: "Sprint started",
          message: "Sprint 18 has started. Good luck team!",
          userId: alice.id,
          isRead: false,
        },
      ],
    });
  }

  console.log("✅ Created 3 notifications");
  console.log("\n🎉 Seed completed successfully!");
  console.log("\n📧 Login credentials:");
  console.log("   Email: alice@devflow.io");
  console.log("   Password: Password123");
  console.log("   (All 4 users have the same password)");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
