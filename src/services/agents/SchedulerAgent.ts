import { TwinModel } from "@/types/digitalTwin";

export const SchedulerAgent = {
  name: "SchedulerAgent",
  responsibility: "Chronological task calendars, seeding intervals, weeding checkups, and harvest cycles",

  /**
   * Generates step-by-step tasks schedules
   */
  async execute(twin: TwinModel, goal: string) {
    const goalLower = goal.toLowerCase();
    const eventsTimeline: { time: string; task: string }[] = [];

    // General calendar checks
    eventsTimeline.push(
      { time: "Day 1-2", task: "Mix coco peat and compost into grow bag soil profiles." },
      { time: "Day 3", task: "Sow seeds at 0.5-inch depth in nursery trays." }
    );

    if (goalLower.includes("summer") || goalLower.includes("heat")) {
      eventsTimeline.push(
        { time: "Day 4", task: "Mount the 50% shade netting cover grid." },
        { time: "Day 5-30", task: "Run drip irrigation cycle daily at 7 AM (avoid midday evaporation)." }
      );
    } else if (goalLower.includes("water")) {
      eventsTimeline.push(
        { time: "Day 4", task: "Lay organic straw mulch layer across soil beds." },
        { time: "Day 5-30", task: "Check moisture sensors; irrigate only when soil levels drop below 40%." }
      );
    } else {
      eventsTimeline.push(
        { time: "Day 14", task: "Apply liquid seaweed organic fertilizer." },
        { time: "Day 30", task: "Conduct weeding checkup and prune lower foliage shoots." }
      );
    }

    return {
      eventsTimeline
    };
  }
};
