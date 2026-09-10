import { Request, Response, NextFunction } from "express";
import { Rubric } from "../models/Rubric.js";
import { User } from "../models/User.js";
import { RubricRole } from "../types/index.js";

/** Coordinator: get both rubrics (tutor and jury) for their own degree. */
export async function getMyRubrics(req: Request, res: Response, next: NextFunction) {
  try {
    const coordinator = await User.findById(req.user!.userId);
    if (!coordinator?.degreeManaged) {
      return res.status(400).json({ message: "No tienes una titulación asignada" });
    }
    const rubrics = await Rubric.find({ degree: coordinator.degreeManaged });
    return res.json({ rubrics });
  } catch (err) {
    next(err);
  }
}

/** Coordinator: create or replace the rubric for a given role (tutor/jury) in their degree. */
export async function setRubric(req: Request, res: Response, next: NextFunction) {
  try {
    const coordinator = await User.findById(req.user!.userId);
    if (!coordinator?.degreeManaged) {
      return res.status(400).json({ message: "No tienes una titulación asignada" });
    }

    const { role, criteria, roleWeight } = req.body as {
      role: RubricRole;
      criteria: { name: string; maxPoints: number; weight: number }[];
      roleWeight: number;
    };

    if (!Object.values(RubricRole).includes(role)) {
      return res.status(400).json({ message: "Rol de rúbrica inválido" });
    }
    if (!criteria || criteria.length === 0) {
      return res.status(400).json({ message: "Añade al menos un criterio" });
    }

    const rubric = await Rubric.findOneAndUpdate(
      { degree: coordinator.degreeManaged, role },
      { criteria, roleWeight },
      { new: true, upsert: true }
    );

    return res.json({ rubric });
  } catch (err) {
    next(err);
  }
}