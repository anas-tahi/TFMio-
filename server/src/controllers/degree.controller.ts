import { Request, Response, NextFunction } from "express";
import { Degree } from "../models/Degree.js";

/** List all degrees (titulaciones) — used to populate dropdowns in forms. */
export async function getDegrees(_req: Request, res: Response, next: NextFunction) {
  try {
    const degrees = await Degree.find().sort({ name: 1 });
    return res.json({ degrees });
  } catch (err) {
    next(err);
  }
}