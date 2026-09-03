import { prisma } from "@devflow/database";

export class DeploymentService {
  /**
   * Create a new deployment record
   */
  static async createDeployment(projectId: string, data: {
    environment: string;
    status: string;
    version: string;
    commitSha?: string;
    url?: string;
  }) {
    return prisma.deployment.create({
      data: {
        projectId,
        ...data,
      },
    });
  }

  /**
   * Get all deployments for a project, optionally filtered by environment
   */
  static async getDeployments(projectId: string, filter?: { environment?: string }) {
    return prisma.deployment.findMany({
      where: {
        projectId,
        environment: filter?.environment,
      },
      orderBy: {
        deployedAt: "desc",
      },
    });
  }

  /**
   * Get a specific deployment by ID
   */
  static async getDeploymentById(id: string) {
    return prisma.deployment.findUnique({
      where: { id },
    });
  }

  /**
   * Update a deployment status
   */
  static async updateDeploymentStatus(id: string, status: string, url?: string) {
    return prisma.deployment.update({
      where: { id },
      data: { status, url },
    });
  }
}
