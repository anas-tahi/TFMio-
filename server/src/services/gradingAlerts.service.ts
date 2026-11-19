import { Work } from "../models/Work.js";
import { Grade } from "../models/Grade.js";
import { User } from "../models/User.js";
import { Degree } from "../models/Degree.js";
import { WorkStage, NotificationType, UserRole } from "../types/index.js";
import { notify } from "./notification.service.js";
import { REMINDER_DAYS_BEFORE } from "../config/gradingDeadline.js";
import {
  normalizeGradingDays,
  getGradingDeadline,
  getGradingPhase,
  findMissingGraders,
} from "../utils/gradingDeadline.js";
import { decideGradingAlert, joinNames } from "../utils/gradingAlerts.js";

const ONE_HOUR_MS = 60 * 60 * 1000;
const FIRST_RUN_DELAY_MS = 10 * 1000;

let running = false;

/** The deadline day as text. Deadlines are stored in UTC, so we format in UTC. */
export function formatDay(date: Date): string {
  return date.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * One pass over every work that has a defense date and is still waiting for
 * grades. Sends the reminder to the people who haven't graded (in the last days
 * before the deadline) and tells the coordinator who missed it (after the
 * deadline). Each message is sent once: a note is written on the work before
 * sending, and only the run that writes it sends the message.
 * The deadline is the defense date plus the degree's grading days plus any
 * extra days the coordinator gave this work.
 * Returns how many messages were sent.
 */
export async function checkGradingDeadlines(now: Date = new Date()): Promise<number> {
  const works = await Work.find({
    stage: { $in: [WorkStage.DEFENSE_READY, WorkStage.DEFENDED] },
    "defense.date": { $ne: null },
  }).populate("student", "fullName degree");

  if (works.length === 0) return 0;

  const degrees = await Degree.find().select("gradingDays");
  const daysByDegree = new Map<string, number>(
    degrees.map((d) => [d._id.toString(), normalizeGradingDays(d.gradingDays)] as [string, number])
  );

  let sent = 0;

  for (const work of works) {
    try {
      const student = work.student as unknown as {
        fullName: string;
        degree?: { toString(): string };
      } | null;
      if (!student) continue;

      const baseDays =
        daysByDegree.get(student.degree?.toString() ?? "") ?? normalizeGradingDays(undefined);
      const days = baseDays + (work.gradingExtraDays ?? 0);
      const deadline = getGradingDeadline(work.defense?.date, days);
      const phase = getGradingPhase(deadline, now, REMINDER_DAYS_BEFORE);

      const expected = [
        work.tutor.toString(),
        ...(work.defense?.jury ?? []).map((j) => j.toString()),
      ];
      const grades = await Grade.find({ work: work._id }).select("grader");
      const missing = findMissingGraders(
        expected,
        grades.map((g) => g.grader.toString())
      );

      const alert = decideGradingAlert({
        phase,
        missingCount: missing.length,
        reminderSent: Boolean(work.gradingAlerts?.reminderSentAt),
        overdueSent: Boolean(work.gradingAlerts?.overdueSentAt),
      });
      if (!alert || !deadline) continue;

      if (alert === "reminder") {
        const claimed = await Work.updateOne(
          { _id: work._id, "gradingAlerts.reminderSentAt": { $exists: false } },
          { $set: { "gradingAlerts.reminderSentAt": now } }
        );
        if (claimed.modifiedCount !== 1) continue;

        for (const graderId of missing) {
          await notify({
            recipient: graderId,
            type: NotificationType.GRADE,
            title: "Recordatorio: calificación pendiente",
            message: `Tienes hasta el ${formatDay(deadline)} para calificar el trabajo de ${student.fullName}.`,
            link: `/works/${work._id}/grade`,
          });
          sent++;
        }
        continue;
      }

      // alert === "overdue": tell the coordinator of the student's degree.
      const coordinator = await User.findOne({
        role: UserRole.COORDINATOR,
        degreeManaged: student.degree,
      });
      if (!coordinator) continue;

      const claimed = await Work.updateOne(
        { _id: work._id, "gradingAlerts.overdueSentAt": { $exists: false } },
        { $set: { "gradingAlerts.overdueSentAt": now } }
      );
      if (claimed.modifiedCount !== 1) continue;

      const missingUsers = await User.find({ _id: { $in: missing } }).select("fullName");
      const names = missing.map(
        (id) => missingUsers.find((u) => u._id.toString() === id)?.fullName ?? "Un evaluador"
      );

      await notify({
        recipient: coordinator._id,
        type: NotificationType.GRADE,
        title: "Plazo de calificación vencido",
        message: `${joinNames(names)} ${
          names.length === 1 ? "no ha" : "no han"
        } calificado el trabajo de ${student.fullName}. Decide si das más días o cierras con las notas recibidas.`,
        link: "/coordinator/pending-grades",
      });
      sent++;
    } catch (err) {
      console.error("Grading deadline check failed for one work:", err);
    }
  }

  return sent;
}

/**
 * Starts the check: once shortly after the server starts, then every hour.
 * It only runs while the server is on.
 */
export function startGradingDeadlineJob(): void {
  const run = async () => {
    if (running) return;
    running = true;
    try {
      const sent = await checkGradingDeadlines();
      if (sent > 0) console.log(`✓ Grading deadline check: ${sent} message(s) sent`);
    } catch (err) {
      console.error("Grading deadline check failed:", err);
    } finally {
      running = false;
    }
  };

  setTimeout(run, FIRST_RUN_DELAY_MS);
  setInterval(run, ONE_HOUR_MS);
}