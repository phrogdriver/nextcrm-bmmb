import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { startOfDay, addDays } from "date-fns";

import Container from "../../components/ui/Container";
import { getCalendarData } from "@/actions/crm/calendar/get-calendar-data";
import { CalendarView } from "./_components/CalendarView";

const CalendarPage = async () => {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const today = startOfDay(new Date());
  const tomorrow = addDays(today, 1);

  const data = await getCalendarData(today, tomorrow);

  return (
    <Container title="Calendar" description="Company schedule">
      <CalendarView
        initialData={data}
        initialDate={today.toISOString()}
      />
    </Container>
  );
};

export default CalendarPage;
