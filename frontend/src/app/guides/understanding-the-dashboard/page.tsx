/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
import { Typography } from "@mui/material";

// ─── Shared Primitives ─────────────────────────────────────────────────────────

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#E4E7EC]">
        <span className="text-xl">{icon}</span>
        <Typography className="!text-base !font-semibold !text-text-primary">{title}</Typography>
      </div>
      {children}
    </section>
  );
}

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <Typography className="!text-sm !font-semibold !text-text-primary !mb-2">{title}</Typography>
      {children}
    </div>
  );
}

function Callout({
  children,
  variant = "info",
  label,
}: {
  children: React.ReactNode;
  variant?: "info" | "tip" | "warning";
  label?: string;
}) {
  const styles = {
    info: {
      wrap: "bg-[#EFF8FF] border-[#2E90FA] text-[#1849A9]",
      badge: "bg-[#D1E9FF] text-[#1849A9]",
    },
    tip: {
      wrap: "bg-[#F0FDF9] border-[#00897B] text-[#065F46]",
      badge: "bg-[#CCFBEF] text-[#065F46]",
    },
    warning: {
      wrap: "bg-[#FFFAEB] border-[#FDB022] text-[#7A2E0E]",
      badge: "bg-[#FEF0C7] text-[#7A2E0E]",
    },
  };
  const icons = { info: "ℹ️", tip: "💡", warning: "⚠️" };
  const s = styles[variant];
  return (
    <div className={`border-l-4 rounded-r-lg px-4 py-3 text-sm leading-relaxed mb-4 ${s.wrap}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span>{icons[variant]}</span>
        {label && (
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${s.badge}`}>{label}</span>
        )}
      </div>
      {children}
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-[#E4E7EC] rounded-xl overflow-hidden mb-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-start px-4 py-3.5 text-sm font-medium text-text-primary bg-white hover:bg-gray-50 transition-colors text-left gap-3"
      >
        <span className="leading-snug text-[#344054]">{question}</span>
        <svg
          className={`w-4 h-4 text-[#98A2B3] flex-shrink-0 mt-0.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <div className="px-4 py-3.5 text-sm text-[#475467] leading-relaxed border-t border-[#E4E7EC] bg-gray-50 space-y-2">
          {answer}
        </div>
      )}
    </div>
  );
}

function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-2 mb-4 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-[#475467] leading-relaxed">
          <span
            className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: "#00897B" }}
          ></span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="overflow-x-auto mb-4">
      <table className="w-full text-sm border border-[#E4E7EC] rounded-xl overflow-hidden">
        <thead>
          <tr className="bg-gray-50 text-left">
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-2.5 font-medium border-b border-[#E4E7EC] text-[#344054]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#E4E7EC]">
          {rows.map((row, ri) => (
            <tr key={ri} className="text-[#475467]">
              {row.map((cell, ci) => (
                <td key={ci} className="px-4 py-3">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Guide Tabs ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "overview", label: "Overview", icon: "🏠" },
  { id: "cards", label: "Summary Cards", icon: "🧒" },
  { id: "charts", label: "Charts & Visualizations", icon: "📊" },
  { id: "filters", label: "Filters & Controls", icon: "📅" },
  { id: "faq", label: "FAQs", icon: "❓" },
];

// ─── Guide 1: Understanding the Dashboard ──────────────────────────────────────

function Guide1() {
  return (
    <>
      <p className="text-sm text-gray-500 leading-relaxed mb-8">
        Discover your administration dashboard with all its charts and graphs. Stay up-to-date on
        everything happening in your school — all on a single page.
      </p>

      <Section title="Overview" icon="🏠">
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          The <strong>Dashboard</strong> is the first page you see when you log in to WhitePenguin
          as an Admin. It gives you a real-time, bird&apos;s-eye view of your school&apos;s key
          metrics — students, teachers, classrooms, admissions, attendance, and earnings — without
          needing to navigate through multiple sections.
        </p>

        <img
          src="/images/dashboard-overview.png"
          className="sm:w-auto h-auto pb-2"
          alt="Dashboard overview"
        />
      </Section>

      <Section title="Features & Benefits" icon="✨">
        <BulletList
          items={[
            <>
              <strong>Instant school snapshot</strong> — See the most important numbers at a glance
              the moment you log in.
            </>,
            <>
              <strong>Real-time data</strong> — All cards, charts, and graphs reflect live data from
              your school&apos;s records.
            </>,
            <>
              <strong>Flexible filtering</strong> — Narrow down data by a specific date range or
              classroom to focus on what matters.
            </>,
            <>
              <strong>Attendance visibility</strong> — Monitor daily attendance trends for both
              children and teachers in one place.
            </>,
            <>
              <strong>Earnings tracking</strong> — Keep an eye on your school&apos;s weekly revenue
              without opening the Invoicing section.
            </>,
            <>
              <strong>No extra setup needed</strong> — The dashboard populates automatically as you
              add children, teachers, classrooms, and admissions.
            </>,
          ]}
        />
      </Section>

      <Section title="What's on the Dashboard?" icon="🗂️">
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          The dashboard is divided into several distinct zones. Here is a quick map of what lives
          where:
        </p>
        <DataTable
          headers={["Section", "Location", "What it shows"]}
          rows={[
            [
              "Summary Cards",
              "Top row",
              "High-level counts: Students, Teachers, Classrooms, Admissions",
            ],
            [
              "Students Donut Chart",
              "Middle-left",
              "Breakdown of enrolled children by gender (Boys / Girls)",
            ],
            [
              "Attendance Summary",
              "Middle-right",
              "Daily present/absent trend for children or teachers",
            ],
            ["Earnings Bar Chart", "Bottom", "Daily revenue across the selected week"],
            [
              "Filters (Date & Classroom)",
              "Top-right of page",
              "Controls what data period and classroom is shown across all sections",
            ],
          ]}
        />

        <img
          src="/images/dashboard-full.png"
          className="sm:w-auto h-auto pb-2"
          alt="Dashboard layout"
        />
      </Section>

      <Section title="Navigation Overview" icon="🧭">
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          The left sidebar gives you access to every module in WhitePenguin. From the Dashboard you
          can navigate to:
        </p>
        <BulletList
          items={[
            "Children — manage enrolled students and their profiles",
            "Parents — view and manage parent accounts",
            "Teachers — view teaching staff, add/edit staff records",
            "Classrooms — configure room capacity and assignments",
            "Admission — manage tour scheduling and pipeline",
            "Attendance — log and review daily attendance",
            "Learning — curriculum, milestones, grading",
            "Communication — messaging and announcements",
            "Invoicing — billing, tuition, fee payments",
            "Reports — downloadable attendance and billing reports",
            "Guides — this documentation section",
            "Settings — profile, security, permissions, payment methods",
          ]}
        />
        <Callout variant="info" label="Note">
          Sidebar items are role-based. Admins see all items. Staff and parents see a reduced set
          relevant to their role.
        </Callout>
      </Section>
    </>
  );
}

// ─── Guide 2: Summary Cards ────────────────────────────────────────────────────

function Guide2() {
  return (
    <>
      <p className="text-sm text-gray-500 leading-relaxed mb-8">
        At the top of the dashboard, you will find four summary cards. Each card displays a count
        for the current filter period and a percentage change compared to the previous period.
      </p>

      <img
        src="/images/dashboard-card.png"
        className="sm:w-auto h-auto pb-2"
        alt="Dashboard Cards"
      />

      <Callout variant="tip" label="Tip">
        The <strong>percentage badge</strong> on each card (e.g., -100% or 0%) shows the change
        compared to the previous equivalent period. A green arrow means growth; a red arrow means a
        decline.
      </Callout>

      <DataTable
        headers={["Card", "What it shows", "Why it matters"]}
        rows={[
          [
            <strong key="s">Students</strong>,
            "Total number of enrolled children",
            "Track enrollment growth or drops over time.",
          ],
          [
            <strong key="t">Teachers</strong>,
            "Total number of active teachers",
            "Monitor staffing levels at a glance.",
          ],
          [
            <strong key="c">Classrooms</strong>,
            "Total number of active classrooms",
            "Understand your school's operational capacity.",
          ],
          [
            <strong key="a">Admissions</strong>,
            "Total number of new admissions in the period",
            "Gauge how many new students joined recently.",
          ],
        ]}
      />

      <Section title="Students Card" icon="🧒">
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          Displays the total number of active children enrolled across all classrooms. The number
          updates in real-time as children are added, archived, or transferred.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          The percentage badge below the number compares this period&apos;s enrollment count to the
          previous equivalent period. For example, if you&apos;re viewing &quot;This Week&quot; and
          the badge shows{" "}
          <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full">
            +18% ↑
          </span>
          , enrollment grew by 18% compared to last week.
        </p>
        <Callout variant="tip" label="Tip">
          Click the Students card to jump directly to the Children management section for a detailed
          breakdown.
        </Callout>
      </Section>

      <Section title="Teachers Card" icon="👩‍🏫">
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          Shows the total count of active teaching staff members in your school. Only accounts with
          the &quot;staff&quot; or &quot;teacher&quot; role are counted — admin accounts are
          excluded.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          If a staff member is deactivated or removed, the count decreases accordingly. Use this
          card to monitor whether your staffing levels match your student-to-teacher ratio goals.
        </p>
      </Section>

      <Section title="Classrooms Card" icon="🏫">
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          Reflects the number of active, configured classrooms in your school system. Archived
          classrooms are not counted. This gives you an at-a-glance sense of your school&apos;s
          operational capacity.
        </p>
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          Adding a new classroom in the Classrooms section updates this card automatically — no
          manual refresh needed.
        </p>
      </Section>

      <Section title="Admissions Card" icon="📋">
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          Shows the total number of new admission applications or enrolled admissions within the
          selected period. Use this card to track pipeline momentum — particularly useful after open
          days or tour events when new applications come in.
        </p>
        <Callout variant="tip" label="Tip">
          Combine the Admissions card with the &quot;This Month&quot; date filter to see exactly how
          many new families applied or enrolled this month.
        </Callout>
      </Section>

      <Section title="Reading the Trend Badges" icon="📉">
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          Every summary card displays a small badge in the bottom-left corner showing the percentage
          change from the previous period. Here is how to read them:
        </p>
        <DataTable
          headers={["Badge appearance", "What it means"]}
          rows={[
            [
              <span
                key="g"
                className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full"
              >
                +18% ↑
              </span>,
              "Increased by 18% compared to the previous equivalent period",
            ],
            [
              <span
                key="r"
                className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full"
              >
                -100% ↓
              </span>,
              "Decreased by 100% — no records in this period vs. last period",
            ],
            [
              <span
                key="z"
                className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full"
              >
                0%
              </span>,
              "No change compared to the previous period",
            ],
          ]}
        />
        <Callout variant="warning" label="Note">
          A badge of <strong>-100%</strong> does not mean your school lost all students — it means
          there were <em>no new additions</em> in the current period compared to the previous
          period. Check the date filter if you see unexpected values.
        </Callout>
      </Section>
    </>
  );
}

// ─── Guide 3: Charts & Visualizations ──────────────────────────────────────────

function Guide3() {
  return (
    <>
      <p className="text-sm text-gray-500 leading-relaxed mb-8">
        The dashboard contains three main charts below the summary cards: the Students Donut Chart,
        the Attendance Summary, and the Earnings Bar Chart. Each responds to the date and classroom
        filters you apply.
      </p>

      <Callout variant="tip" label="Tip">
        All charts respond to the Date Range filter and the Classroom filter at the top right of the
        dashboard. Change either filter to update every chart simultaneously.
      </Callout>

      <Section title="Students Donut Chart" icon="🍩">
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          The <strong>Students</strong> section displays a donut chart that breaks down your
          enrolled children <strong>by gender</strong>:
        </p>
        <BulletList
          items={[
            <>
              <span className="font-semibold text-teal-600">🔵 Boys</span> — shown in teal with a
              count and percentage
            </>,
            <>
              <span className="font-semibold text-yellow-500">🟡 Girls</span> — shown in yellow with
              a count and percentage
            </>,
          ]}
        />
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          The center of the donut shows the total enrolled students. This chart updates
          automatically as you add or update children profiles. An empty grey ring appears when no
          children exist for the selected filters.
        </p>

        <img
          src="/images/student-chart.png"
          className="sm:w-auto h-[200px] pb-2"
          alt="Student Chart"
        />

        <Callout variant="info" label="Info">
          The donut chart does not change when you switch classrooms via the classroom filter — it
          always shows the gender breakdown across all enrolled students. Use the Classrooms section
          for per-room enrollment detail.
        </Callout>
      </Section>

      <Section title="Earnings Bar Chart" icon="💰">
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          The <strong>Earnings</strong> chart displays your school&apos;s revenue over the selected
          period, broken down day by day (Monday through Saturday by default when viewing &quot;This
          Week&quot;). Use this chart to:
        </p>
        <BulletList
          items={[
            "Spot high-revenue days — useful for identifying when bulk payments hit",
            "Identify weeks with low billing activity and investigate unpaid invoices",
            "Track the financial impact of new admissions or recurring tuition invoices",
          ]}
        />

        <img
          src="/images/earnings-chart.png"
          className="sm:w-auto h-auto pb-2"
          alt="Earnings Chart"
        />

        <Subsection title="Chart Granularity by Period">
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            The X-axis labels and bar groupings change based on the date filter you select:
          </p>
          <DataTable
            headers={["Date filter selected", "Bar grouping (X-axis)"]}
            rows={[
              ["Today", "Hourly breakdowns"],
              ["This week", "One bar per day (Mon–Sat)"],
              ["This month", "One bar per week"],
              ["This year / Last year", "One bar per month (Jan–Dec)"],
              ["Custom range", "Auto-selected based on range length"],
            ]}
          />
        </Subsection>
        <Callout variant="warning" label="Note">
          The Earnings chart only reflects <strong>paid invoices</strong>. Pending or overdue
          invoices are not included. If the chart appears empty, check the Invoicing section to
          confirm payments have been processed.
        </Callout>
      </Section>

      <Section title="Attendance Summary Chart" icon="✅">
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          The <strong>Attendance Summary</strong> chart shows daily attendance trends for the
          selected period. It is located in the top-right area of the dashboard, next to the
          Students donut chart.
        </p>

        <img
          src="/images/attendance-chart.png"
          className="sm:w-auto h-[240px] pb-2"
          alt="Attendance Chart"
        />

        <Subsection title="How to Read the Chart">
          <BulletList
            items={[
              <>
                <strong>X-axis:</strong> Shows the days of the week (Mon → Fri)
              </>,
              <>
                <strong>Y-axis:</strong> Shows the number of attendees (0–10 by default, scaling
                automatically with your data)
              </>,
              <>
                <span className="font-semibold">🟠 Total Absent</span> — children or teachers who
                were marked absent for that day
              </>,
              <>
                <span className="font-semibold">🟢 Total Present</span> — children or teachers who
                were marked present for that day
              </>,
            ]}
          />
        </Subsection>

        <Subsection title="Switching Between Children and Teachers">
          <p className="text-sm text-gray-600 leading-relaxed mb-3">
            Use the <strong>dropdown on the top-right of the chart</strong> to switch the view:
          </p>
          <BulletList
            items={[
              <>
                <strong>Student</strong> — shows attendance data for enrolled children
              </>,
              <>
                <strong>Teacher</strong> — shows attendance data for your teaching staff
              </>,
            ]}
          />

          <img
            src="/images/attendance-dropdown.png"
            className="sm:w-auto h-[240px] pb-2"
            alt="Attendance dropdown"
          />

          <Callout variant="warning" label="Warning">
            Attendance data only appears after teachers or admins have logged attendance for the
            day. If the chart is empty, make sure attendance has been recorded for the selected
            period via the <strong>Attendance</strong> section.
          </Callout>
        </Subsection>
      </Section>

      <Section title="Tips for Using Charts Effectively" icon="💡">
        <BulletList
          items={[
            "Use 'This Week' for a quick operational snapshot — compare today's numbers to earlier in the week",
            "Switch to 'This Month' on the Earnings chart to spot which weeks generated the most revenue",
            "Toggle the attendance view between Student and Teacher to compare both groups after a school event or holiday",
            "Combine the classroom filter with 'This Month' to audit attendance specifically for a struggling classroom",
          ]}
        />
      </Section>
    </>
  );
}

// ─── Guide 4: Filters & Controls ───────────────────────────────────────────────

function Guide4() {
  return (
    <>
      <p className="text-sm text-gray-500 leading-relaxed mb-8">
        You can control what data appears across all dashboard sections using two filters at the
        top-right of the Dashboard page: the Date Filter and the Classroom Filter.
      </p>

      <Callout variant="tip" label="Key Point">
        Both filters affect <strong>all</strong> summary cards, charts, and graphs simultaneously.
        You do not need to configure them separately for each section.
      </Callout>

      <Section title="Date Filter" icon="📅">
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          Click the <strong>&quot;This week&quot;</strong> dropdown (or whichever period label is
          currently active) to change the time window across the entire dashboard. Available
          options:
        </p>
        <DataTable
          headers={["Filter option", "What it covers"]}
          rows={[
            ["Today", "Data from the current day only"],
            ["This week", "Data from Monday to the current day of the week (rolling 7-day)"],
            ["This month", "Data from the 1st of the current month to today"],
            ["Last month", "Full previous calendar month"],
            ["This year", "January 1st to today of the current year"],
            ["Last year", "Full previous calendar year"],
            ["Custom", "Pick any specific start and end date using the date picker"],
          ]}
        />

        <img src="/images/date-filter.png" className="sm:w-auto h-[240px] pb-2" alt="Date Filter" />

        <Callout variant="info" label="Custom Range">
          When using the <strong>Custom</strong> date range, a date picker appears. Select your
          start date, then your end date, then click <strong>&quot;OK&quot;</strong> to apply. All
          dashboard data will filter to that exact window.
        </Callout>
        <p className="text-sm text-gray-600 leading-relaxed">
          All summary cards, the earnings chart, the attendance chart, and any aggregated counts
          update <strong>instantly</strong> as soon as you select a new period — no page reload
          required.
        </p>
      </Section>

      <Section title="Classroom Filter" icon="🏛️">
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          Click the <strong>&quot;All Classrooms&quot;</strong> dropdown (or whichever classroom is
          selected) to filter all dashboard data to a specific classroom group:
        </p>
        <BulletList
          items={[
            <>
              <strong>All Classrooms</strong> (default) — aggregates data from every classroom in
              your school
            </>,
            <>
              <strong>[Classroom name]</strong> — select any classroom from the list to see metrics
              only for that group. For example, selecting &quot;Nursery A&quot; shows only the
              students, attendance, and earnings attributed to Nursery A.
            </>,
          ]}
        />

        <img
          src="/images/class-filter.png"
          className="sm:w-auto h-[240px] pb-2"
          alt="Classroom Filter"
        />

        <Subsection title="When to Use the Classroom Filter">
          <BulletList
            items={[
              "Monitoring attendance trends for a specific class without the noise of other classrooms",
              "Comparing earnings contributions by classroom to understand which rooms generate the most revenue",
              "Checking enrolment numbers for a single room during a staff review",
              "Isolating a specific class period during or after a classroom reshuffle",
            ]}
          />
        </Subsection>
        <Callout variant="tip" label="Tip">
          To return to the full-school view, open the classroom dropdown and select{" "}
          <strong>&quot;All Classrooms&quot;</strong>. Both the classroom filter and date filter can
          be reset independently.
        </Callout>
      </Section>

      <Section title="Combining Both Filters" icon="🔗">
        <p className="text-sm text-gray-600 leading-relaxed mb-3">
          Both filters work in combination. For example:
        </p>
        <DataTable
          headers={["Date filter", "Classroom filter", "Result"]}
          rows={[
            ["This month", "All Classrooms", "School-wide metrics for the current month"],
            ["This week", "Nursery A", "Nursery A data for the current week only"],
            ["Last month", "Reception B", "Reception B's performance from last month"],
            ["Custom (Jan 1 – Mar 31)", "All Classrooms", "Q1 data across the whole school"],
          ]}
        />
        <Callout variant="tip" label="Best Practice">
          Start with <strong>This Month + All Classrooms</strong> for your daily check-in, then
          drill down into individual classrooms if you spot something that needs investigation.
        </Callout>

        <img
          src="/images/date-class-filter.png"
          className="sm:w-auto h-auto pb-2"
          alt="Date and Class Filter"
        />
      </Section>
    </>
  );
}

// ─── Guide 5: FAQs ─────────────────────────────────────────────────────────────

function Guide5() {
  const faqs = [
    {
      icon: "📊",
      question: "Why are my summary cards showing 0?",
      answer: (
        <>
          <p>
            This usually means no records exist for the selected date range. Try switching the date
            filter to <strong>&quot;This month&quot;</strong> or{" "}
            <strong>&quot;This year&quot;</strong>. If counts are still zero, make sure you have
            added children, teachers, or classrooms in their respective sections.
          </p>
          <p className="mt-2">Common causes:</p>
          <ul className="list-disc pl-5 space-y-1 mt-1 text-sm">
            <li>
              The date range is set to a future period or a period when the school wasn&apos;t
              active
            </li>
            <li>A classroom filter is applied that has no associated records</li>
            <li>Children or teachers haven&apos;t been added to the system yet</li>
          </ul>
        </>
      ),
    },
    {
      icon: "📈",
      question: "Why is the Attendance Summary chart empty?",
      answer: (
        <>
          <p>
            The chart is empty when no attendance has been logged for the selected period. Ask your
            teachers or admins to record daily attendance via the <strong>Attendance</strong>{" "}
            section, then return to the Dashboard to see it reflected.
          </p>
          <p className="mt-2">Steps to fix:</p>
          <ol className="list-decimal pl-5 space-y-1 mt-1 text-sm">
            <li>
              Go to <strong>Attendance</strong> in the sidebar
            </li>
            <li>Select the date and classroom</li>
            <li>Mark students as present, absent, or late</li>
            <li>Return to the Dashboard — the chart should now show data</li>
          </ol>
        </>
      ),
    },
    {
      icon: "🔢",
      question: "What does the percentage badge on each card mean?",
      answer: (
        <>
          <p>
            It shows the <strong>percentage change</strong> compared to the previous equivalent
            period. For example, if you are viewing <em>&quot;This week&quot;</em> and the Students
            card shows <strong>-100%</strong>, it means there were no new students enrolled this
            week compared to last week — not that your school lost all its students.
          </p>
          <p className="mt-2">
            This comparison is always relative to the period before the one you selected:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-1 text-sm">
            <li>
              <strong>This week</strong> compares to last week
            </li>
            <li>
              <strong>This month</strong> compares to last month
            </li>
            <li>
              <strong>This year</strong> compares to last year
            </li>
          </ul>
        </>
      ),
    },
    {
      icon: "👤",
      question: "Can I see attendance for teachers and children at the same time?",
      answer: (
        <p>
          Not simultaneously on the same chart — the Attendance Summary chart shows either{" "}
          <strong>Student</strong> or <strong>Teacher</strong> attendance at a time. Use the
          dropdown on the top-right of the attendance chart to switch between the two views. For a
          combined view, head to the <strong>Attendance</strong> section in the sidebar which has
          separate tabs for Children and Teachers.
        </p>
      ),
    },
    {
      icon: "👫",
      question: "Can I export dashboard data?",
      answer: (
        <>
          <p>
            Direct export from the main dashboard is not currently available. To download reports,
            navigate to the <strong>Reports</strong> section in the sidebar, where you can export:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-1 text-sm">
            <li>Billing and deposit reports</li>
            <li>Attendance reports by child or teacher</li>
            <li>Staff and child summary reports</li>
          </ul>
        </>
      ),
    },
    {
      icon: "💰",
      question: "The Earnings chart shows no data — what should I check?",
      answer: (
        <>
          <p>
            An empty earnings chart means <strong>no invoices were paid</strong> in the selected
            period. Here&apos;s what to check:
          </p>
          <ol className="list-decimal pl-5 space-y-1 mt-1 text-sm">
            <li>
              Go to <strong>Invoicing → Invoices</strong> and confirm that payments exist and are
              marked as paid
            </li>
            <li>Check that the date filter covers a period during which payments were processed</li>
            <li>
              Try switching to <strong>This Year</strong> for a broader view — if revenue appears,
              your current period is just narrower than your billing cycle
            </li>
          </ol>
        </>
      ),
    },
    {
      icon: "📂",
      question:
        'Why does the "All Classrooms" filter show different numbers than a specific classroom filter?',
      answer: (
        <p>
          This is expected behaviour. <strong>All Classrooms</strong> aggregates data from every
          classroom in the system. When you select a specific classroom, only the children,
          attendance events, and invoices <em>attributed to that classroom</em> are shown. Some
          children may be enrolled but not yet assigned to a classroom, which means they appear in
          the &quot;All Classrooms&quot; count but not in any individual classroom&apos;s count.
        </p>
      ),
    },
    {
      icon: "🔄",
      question: "The charts look different from yesterday — is the data real-time?",
      answer: (
        <p>
          Yes. The dashboard pulls live data on every page load. Any changes made overnight — new
          students enrolled, payments processed, attendance logged — are reflected automatically the
          next time you visit the dashboard. If something looks wrong, do a hard refresh (
          <kbd className="bg-gray-200 rounded px-1 text-xs">Cmd + Shift + R</kbd> on Mac,{" "}
          <kbd className="bg-gray-200 rounded px-1 text-xs">Ctrl + Shift + R</kbd> on Windows) to
          clear any cached state.
        </p>
      ),
    },
  ];

  return (
    <>
      <p className="text-sm text-gray-500 leading-relaxed mb-8">
        Answers to the most common questions about the dashboard — from missing data and chart
        discrepancies to attendance toggles and export queries.
      </p>

      <Callout variant="info" label="Can't find your answer?">
        If your question isn&apos;t listed here, check the other guide pages for detailed feature
        explanations, or contact your system administrator.
      </Callout>

      <div className="mt-6">
        {faqs.map((faq) => (
          <FAQItem
            key={faq.question}
            question={`${faq.icon}  ${faq.question}`}
            answer={faq.answer}
          />
        ))}
      </div>
    </>
  );
}

// ─── Content Map ───────────────────────────────────────────────────────────────

const GUIDE_CONTENT: Record<string, React.FC> = {
  overview: Guide1,
  cards: Guide2,
  charts: Guide3,
  filters: Guide4,
  faq: Guide5,
};

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function UnderstandingTheDashboardPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const ActiveGuide = GUIDE_CONTENT[activeTab];

  return (
    <div className="flex flex-col gap-6">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-[#E4E7EC] pb-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[#00897B] text-white shadow-sm"
                : "bg-gray-100 text-[#475467] hover:bg-gray-200"
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div>
        {ActiveGuide && <ActiveGuide />}
      </div>
    </div>
  );
}
