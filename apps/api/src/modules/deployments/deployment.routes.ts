import { Router, Request, Response, NextFunction } from "express";
import { DeploymentService } from "./deployment.service.js";
import { authenticate } from "../../middleware/auth.js";
import { verifyProjectAccess } from "../../middleware/authorizationHelpers.js";

export const deploymentRoutes = Router();

// Ensure all routes are protected
deploymentRoutes.use(authenticate);

/**
 * @route   GET /api/projects/:projectId/deployments
 * @desc    Get deployments for a project
 */
deploymentRoutes.get(
  "/projects/:projectId/deployments",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      const { environment } = req.query;

      await verifyProjectAccess(req.user!.userId, projectId);

      const deployments = await DeploymentService.getDeployments(projectId, {
        environment: environment as string,
      });

      res.json({ success: true, data: deployments });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   POST /api/projects/:projectId/deployments
 * @desc    Create a new deployment
 */
deploymentRoutes.post(
  "/projects/:projectId/deployments",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const projectId = req.params.projectId as string;
      const { environment, status, version, commitSha, url } = req.body;

      await verifyProjectAccess(req.user!.userId, projectId, ["ADMIN", "PROJECT_MANAGER", "DEVELOPER"]);

      const deployment = await DeploymentService.createDeployment(projectId, {
        environment,
        status,
        version,
        commitSha,
        url,
      });

      res.status(201).json({ success: true, data: deployment });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   GET /api/deployments/:id
 * @desc    Get a specific deployment
 */
deploymentRoutes.get(
  "/deployments/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const deployment = await DeploymentService.getDeploymentById(id);

      if (!deployment) {
        res.status(404).json({ success: false, message: "Deployment not found" });
        return;
      }

      await verifyProjectAccess(req.user!.userId, deployment.projectId);

      res.json({ success: true, data: deployment });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @route   PATCH /api/deployments/:id
 * @desc    Update a deployment status
 */
deploymentRoutes.patch(
  "/deployments/:id",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.params.id as string;
      const { status, url } = req.body;

      const existingDeployment = await DeploymentService.getDeploymentById(id);
      if (!existingDeployment) {
        res.status(404).json({ success: false, message: "Deployment not found" });
        return;
      }
      await verifyProjectAccess(req.user!.userId, existingDeployment.projectId, ["ADMIN", "PROJECT_MANAGER", "DEVELOPER"]);

      const deployment = await DeploymentService.updateDeploymentStatus(id, status, url);

      res.json({ success: true, data: deployment });
    } catch (error) {
      next(error);
    }
  }
);
