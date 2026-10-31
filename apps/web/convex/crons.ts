import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval("recordatorio del diario", { minutes: 15 }, internal.push.sendDue, {});

export default crons;
