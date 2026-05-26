/* eslint-disable react/no-unescaped-entities */
import React from "react";
import { Typography } from "@mui/material";

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <Typography className="!text-xl !font-bold !text-[#101828] !mb-4">{title}</Typography>
      {children}
    </section>
  );
}

export function SubSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 mt-4">
      <Typography className="!text-base !font-semibold !text-[#344054] !mb-2">{title}</Typography>
      {children}
    </div>
  );
}

export function BulletList({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="space-y-3 mb-6 pl-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-[#475467] leading-relaxed">
          <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0 bg-[#00897B]"></span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function NumberedList({ items }: { items: React.ReactNode[] }) {
  return (
    <ol className="space-y-4 mb-6 pl-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-[#475467] leading-relaxed">
          <span className="flex items-center justify-center min-w-[24px] h-6 rounded-full bg-[#E0F2F1] text-[#00897B] font-bold text-xs">
            {i + 1}
          </span>
          <span className="pt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
}

export function Callout({
  title,
  children,
  type = "info",
}: {
  title: string;
  children: React.ReactNode;
  type?: "info" | "warning" | "success";
}) {
  const styles = {
    info: "border-[#00897B] bg-[#F0FDF9] text-[#065F46]",
    warning: "border-[#F59E0B] bg-[#FFFBEB] text-[#92400E]",
    success: "border-[#10B981] bg-[#ECFDF5] text-[#065F46]",
  };

  const currentStyle = styles[type];

  return (
    <div className={`border-l-4 rounded-r-xl px-5 py-4 mb-6 shadow-sm ${currentStyle}`}>
      <Typography className="!text-sm !font-bold !mb-1.5">{title}</Typography>
      <div className="text-sm leading-relaxed opacity-90">{children}</div>
    </div>
  );
}

export function ImagePlaceholder({ description }: { description: string }) {
  return (
    <div className="w-full h-64 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center text-gray-400 my-8 shadow-sm transition-all hover:bg-gray-100 hover:border-gray-300">
      <div className="flex flex-col items-center gap-3 max-w-md text-center px-6">
        <svg
          className="w-10 h-10 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          ></path>
        </svg>
        <span className="text-sm font-medium text-gray-500">Image Placeholder: {description}</span>
      </div>
    </div>
  );
}

export const guidesContentRegistry: Record<string, Record<string, React.ReactNode>> = {
  "get-started-admin": {
    "sign-up-and-getting-started": (
      <>
        <Section title="Welcome to Your Command Center">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Congratulations on creating your admin account. The "Get Started" phase helps you set up
            your school's core structure in the platform so staff and parents can work from one
            connected system.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            When configured correctly, the platform can reduce manual work, centralize attendance
            and billing records, and improve communication with parents. Your role during onboarding
            is to set up these foundations so daily operations run consistently.
          </p>
          <ImagePlaceholder description="Detailed Infographic showing the ecosystem: Admin Dashboard at the center, automating connections to Teacher Apps and Parent Dashboards." />
        </Section>

        <Section title="The Process and Mechanics of Onboarding">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            The onboarding phase is your initial transition from a physical or legacy system into a
            fully automated digital environment. It is not merely about filling out registration
            forms; it is a strategic process of establishing the structural rules that will govern
            how data flows through your school.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            <strong>The Structural Phase:</strong> Start by configuring your School Profile and
            creating Classrooms. Classrooms act as core groupings for teachers and students, so
            creating them early makes later setup steps clearer and easier.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            <strong>The Operational Phase:</strong> Next, configure academic and operational
            settings such as grading structures, curriculum frameworks, and billing preferences
            (including payment setup, where available). Completing these settings early helps keep
            grading and billing behavior consistent.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            <strong>The Population Phase:</strong> The final stage is adding people and
            relationships: inviting staff, enrolling children, and linking parents. Because
            structure and settings are already in place, assignments and visibility are usually more
            predictable for each user role.
          </p>
          <Callout title="Why Sequence Matters" type="warning">
            Onboarding is designed in sequence because many records depend on earlier setup steps.
            For example, importing students before classrooms exist can create incomplete
            assignments. Following the guided order helps keep data linked correctly from day one.
          </Callout>
        </Section>

        <Section title="Understanding the Ecosystem Architecture">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Before diving into adding your data, it's essential to understand how everything in the
            system connects. The platform uses a hierarchical data structure. This means certain
            profiles are reliant on the existence of others. If you skip a step in the hierarchy,
            the system won't know where to route your data.
          </p>
          <Callout title="The Chain of Dependency" type="info">
            <ul className="list-disc pl-4 mt-2 space-y-2">
              <li>
                <strong>School Profile:</strong> This is your base configuration, including branding
                and key school-level settings.
              </li>
              <li>
                <strong>Classrooms:</strong> These represent learning groups (for example,
                "Toddlers" or "Pre-K") and help organize children and staff.
              </li>
              <li>
                <strong>Teachers & Staff:</strong> Staff are assigned to classrooms so
                responsibilities and visibility are scoped appropriately.
              </li>
              <li>
                <strong>Children:</strong> Children are enrolled into classrooms, and records such
                as attendance, learning updates, and billing links are tied to each child's profile.
              </li>
              <li>
                <strong>Parents:</strong> Parents are linked to one or more children so they can
                view relevant information from their parent account.
              </li>
            </ul>
          </Callout>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Because of these dependencies, it is best to follow this sequence during setup.
            Configuring school settings and classrooms first improves assignment accuracy when staff
            and families are added.
          </p>
        </Section>
      </>
    ),
    "understanding-the-dashboard": (
      <>
        <Section title="The Philosophy of Your Dashboard">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Think of the dashboard as a quick operational snapshot for your school. It brings key
            metrics into one place so you can answer three important day-to-day questions:
            <br />
            <br />
            <strong>1. Who is present today?</strong> (Attendance monitoring)
            <br />
            <strong>2. How is enrollment and capacity trending?</strong> (Admissions and capacity
            tracking)
            <br />
            <strong>3. What is the current billing status?</strong> (Financial visibility)
          </p>
          <ImagePlaceholder description="Full, high-resolution view of the Admin Dashboard with annotations pointing to the 3 main questions and their corresponding widgets." />
        </Section>

        <Section title="How Real-Time Data Drives the Dashboard">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            The dashboard does not require manual data entry to populate. It is a live reflection of
            actions taken across the entire platform.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            <strong>Attendance Flow:</strong> As check-ins and attendance updates are recorded, the
            dashboard attendance widget reflects current status. This helps you spot unmarked
            records quickly and follow up when needed.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            <strong>Financial Flow:</strong> The financial widget summarizes invoice and payment
            activity over time. As invoices are created, paid, or left outstanding, the dashboard
            updates those totals so your team can monitor collections and cash flow trends.
          </p>
          <Callout title="Strategic Capacity Planning" type="success">
            The Capacity widget compares active enrollment with the classroom limits configured in
            your settings. Use this signal to plan staffing and space before capacity becomes a
            constraint.
          </Callout>
        </Section>
      </>
    ),
    "using-full-search-feature": (
      <>
        <Section title="The Power of Global Search">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            In a fast-paced school environment, navigating through multiple menu levels can be slow.
            The Global Search bar helps you find records quickly from one place.
          </p>
          <ImagePlaceholder description="Close-up of the Global Search bar showing live search results categorised dynamically into 'Children', 'Parents', and 'Invoices'." />
        </Section>

        <Section title="An Intelligent, Relational Index">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Search is not limited to names. Depending on your configured data, it can also match
            details such as phone numbers, invoice references, and profile fields.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            <strong>Practical Scenarios:</strong>
          </p>
          <ul className="list-disc pl-5 mb-4 text-sm text-[#475467] space-y-2">
            <li>
              <strong>Unknown Caller:</strong> Search the incoming phone number to find a matching
              family record, if that number is saved in the system.
            </li>
            <li>
              <strong>Billing Questions:</strong> Search by invoice reference to find the relevant
              billing record faster than manual navigation.
            </li>
            <li>
              <strong>Urgent Care Checks:</strong> Search by health-related tags or notes (if
              maintained in profiles) to quickly review relevant student records.
            </li>
          </ul>
        </Section>
      </>
    ),
    "using-quick-actions": (
      <>
        <Section title="Speeding Up Repetitive Tasks">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            During high-traffic periods like drop-off and pick-up, Quick Actions reduce clicks for
            common tasks.
          </p>
          <ImagePlaceholder description="Screenshot of the Quick Actions widget on the dashboard, emphasizing the large, touch-friendly buttons tailored for fast execution." />
        </Section>

        <Section title="Bypassing the Workflow">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Quick Actions open common workflows directly so you can complete tasks faster.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            <strong>Common Use Cases:</strong>
          </p>
          <ul className="list-disc pl-5 mb-4 text-sm text-[#475467] space-y-2">
            <li>
              <strong>Walk-in Enrollments:</strong> Use "Add Child" to open the enrollment form
              directly for immediate intake.
            </li>
            <li>
              <strong>Desk Billing:</strong> Use "Create Invoice" to generate and send a charge
              without navigating through the full billing module.
            </li>
            <li>
              <strong>Urgent Notices:</strong> Use "Broadcast Message" to quickly send school-wide
              communications through available notification channels.
            </li>
          </ul>
        </Section>
      </>
    ),
    "using-notification-panel": (
      <>
        <Section title="Your Digital Nervous System">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            The Notification Panel centralizes updates from across the platform so you can review
            new activity without checking every module manually.
          </p>
          <ImagePlaceholder description="The notification panel side-drawer showing categorized alerts: Financial, Messages, and System warnings." />
        </Section>

        <Section title="Smart Routing and The Inbox Zero Philosophy">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Notifications are typically filtered by role and context so users see the alerts that
            are most relevant to their responsibilities.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            For example, billing-related alerts are visible to finance-focused roles, while
            classroom messages are routed to the relevant teaching team. Admin visibility depends on
            your role setup and notification rules.
          </p>
          <Callout title="Actionability is Key" type="info">
            Notifications usually include direct links to the related record or module. Treat this
            panel like an inbox: review items, take action, and mark them as read so critical
            updates are not missed.
          </Callout>
        </Section>
      </>
    ),
  },
  "learning-management": {
    "add-and-manage-milestones": (
      <>
        <Section title="Adding and Managing Milestones">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Milestones are outcomes you track over a period for specific classrooms. In this
            project, milestones are managed from the Learning module and can be created manually or
            added from the library.
          </p>
          <ImagePlaceholder description="The Milestones creation modal highlighting the Title, Description, and Age Group fields." />
        </Section>

        <Section title="Step-by-Step Instructions">
          <SubSection title="Creating a New Milestone">
            <NumberedList
              items={[
                "Go to 'Admin > Learning > Milestones'. This is the default landing tab for Learning.",
                "Use the page action to choose either '+ Add Milestone' (new) or '+ Add from library' (template-based).",
                "Enter a clear milestone title and assign the relevant classroom(s).",
                "Select or confirm the milestone period and status as required by your workflow.",
                "Save the milestone, then verify it appears in the milestone table with the expected class and status.",
              ]}
            />
          </SubSection>

          <SubSection title="Editing or Deleting a Milestone">
            <NumberedList
              items={[
                "Use the search field ('Search milestone') to locate the milestone quickly.",
                "Open the action menu on the row (or mobile bottom-sheet actions) and select 'Edit' to update details.",
                "Use activate/deactivate when you need to control visibility without removing history.",
                "Use delete only when you are certain the milestone is no longer needed; deletion is irreversible.",
              ]}
            />
          </SubSection>

          <SubSection title="How Teachers Use Milestones">
            <NumberedList
              items={[
                "Teachers and admins can view milestone-linked grading records from the Grading tab in Learning.",
                "Milestones are associated with classes and used as the basis for grading rows and progress entries.",
                "Keep milestone names specific and period-based so grading and reports remain easy to audit later.",
              ]}
            />
          </SubSection>
        </Section>
      </>
    ),
    "add-and-manage-subjects": (
      <>
        <Section title="Configuring Learning Subjects">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Subjects define what is taught, for which class and age range, and under which
            curriculum. In this project, subject records also hold skills, schedule, and milestone
            links.
          </p>
          <ImagePlaceholder description="The Subjects list view showing color-coded subjects and the 'Add Subject' button." />
        </Section>

        <Section title="Step-by-Step Instructions">
          <SubSection title="Adding a New Subject">
            <NumberedList
              items={[
                "Go to 'Admin > Learning > Subjects'.",
                "Use the add action to open the subject form.",
                "Provide core details: Subject Name, Curriculum, Class, and Assigned Teacher.",
                "Set age range and duration, then add relevant skill tags.",
                "Optionally add schedule rows and description before saving.",
                "After save, open the subject details view to confirm milestones, schedule, and teacher assignment.",
              ]}
            />
          </SubSection>

          <SubSection title="Managing Existing Subjects">
            <NumberedList
              items={[
                "Open a subject from the list to view full details, including curriculum, class, skills, and schedule.",
                "Use 'Edit' from the details screen to update metadata or assignments.",
                "Before deleting a subject, check for linked milestones or planning dependencies and reassign them if needed.",
              ]}
            />
          </SubSection>
        </Section>
      </>
    ),
    "add-and-manage-curriculum": (
      <>
        <Section title="Creating Curriculums">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Curriculum is the top-level learning structure that subjects and milestones build on.
            The page includes My Library and Template Library so you can create from scratch or
            start from predefined structures.
          </p>
          <ImagePlaceholder description="The Curriculum List view showing active frameworks." />
        </Section>

        <Section title="Step-by-Step Instructions">
          <SubSection title="Creating a New Curriculum">
            <NumberedList
              items={[
                "Go to 'Admin > Learning > Curriculum'.",
                "Use the add action to open the curriculum modal.",
                "Enter curriculum title and description with enough clarity for staff reuse.",
                "Save and confirm it appears in 'My Library'.",
                "Use template library when you want to accelerate setup and then adapt to your school context.",
              ]}
            />
          </SubSection>

          <SubSection title="Managing Existing Curriculums">
            <NumberedList
              items={[
                "Open a curriculum card to review its detail view and linked structure.",
                "Edit when framework details change; keep naming stable to avoid downstream confusion in subject mapping.",
                "Delete only after confirming the curriculum is not required by active subject or milestone flows.",
              ]}
            />
          </SubSection>
        </Section>
      </>
    ),
    "view-and-manage-grading": (
      <>
        <Section title="Executing the Grading Process">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Grading in this project is milestone-driven. The Grading tab lists rows by milestone,
            class, number of students, and grading status, then routes you into grade-entry and
            detail screens.
          </p>
          <ImagePlaceholder description="The Grading Interface showing a student's progress and the review/publish buttons." />
        </Section>

        <Section title="Step-by-Step Instructions">
          <SubSection title="Reviewing Class Milestones">
            <NumberedList
              items={[
                "Go to 'Admin > Learning > Grading'.",
                "Use search to find grading rows by milestone title, class, or status.",
                "Open a row to access grading actions (View / Grade) depending on your role and route.",
                "Enter or review learner-level grades and observations in the grading flow.",
                "Use status and completion checks to ensure each grading cycle is finalized before reporting.",
              ]}
            />
          </SubSection>
        </Section>
      </>
    ),
    "add-and-manage-portfolio": (
      <>
        <Section title="Managing Digital Portfolios">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Portfolio records are managed in Learning and tracked by child, class, date range,
            sections, and publication status (Published/Draft/Archived).
          </p>
          <ImagePlaceholder description="The Portfolio upload screen showing media selection, child tagging, and milestone linking." />
        </Section>

        <Section title="Step-by-Step Instructions">
          <SubSection title="Uploading Portfolio Items">
            <NumberedList
              items={[
                "Go to 'Admin > Learning > Portfolio'.",
                "Use the create action to open the portfolio modal.",
                "Select class, child, and reporting period, then add required sections/content.",
                "Save as draft while reviewing, or publish when content is complete and parent-ready.",
                "Confirm the new record appears in the portfolio table with the expected status.",
              ]}
            />
          </SubSection>

          <SubSection title="Editing or Deleting Portfolio Media">
            <NumberedList
              items={[
                "Use row actions (desktop table or mobile action sheet) to View or Edit a portfolio entry.",
                "Toggle status between Published and Draft when you need to control visibility timing.",
                "Use delete only when a record should be permanently removed.",
                "After edits, re-open the item to verify period, child mapping, and status are correct.",
              ]}
            />
          </SubSection>
        </Section>
      </>
    ),
  },
  "reports-and-charts": {
    "billings-reports": (
      <>
        <Section title="Understanding Billings Reports">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            In this project, Billings reports are split into sub-views: Deposit, Transactions, and
            Summary. Use them together to monitor incoming payments, transaction history, and
            aggregate financial performance.
          </p>
          <ImagePlaceholder description="A comprehensive view of the Billings Report dashboard showing revenue trends and outstanding invoices." />
        </Section>
        <Section title="How to Interpret the Data">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Use the global report filters (classroom and time) plus deposit status to narrow
            analysis before making decisions. A practical workflow is:
          </p>
          <BulletList
            items={[
              "Start in Deposit to review payment-state buckets and identify pending or delayed collections.",
              "Move to Transactions for operational traceability when reconciling specific charges or receipts.",
              "Review Summary for trend-level decisions, such as fee policy updates or collection process changes.",
              "Apply consistent date windows before comparing periods so your reports are decision-grade.",
            ]}
          />
        </Section>
        <Section title="Controls, Criteria, and Validation">
          <BulletList
            items={[
              "Filter discipline: always set classroom and time filters before interpreting totals.",
              "Reconciliation criteria: any unexplained variance between Deposit and Transactions should be investigated before closing finance reviews.",
              "Collection priority: treat overdue/pending groups as action queues for follow-up.",
              "Decision validation: compare at least two equivalent periods (for example, month-over-month) before changing billing policy.",
            ]}
          />
          <Callout title="Common Restriction to Respect" type="warning">
            Do not mix different time windows when presenting a single conclusion. Inconsistent time
            scope is the most common source of misleading billing insights.
          </Callout>
        </Section>
      </>
    ),
    "attendance-reports": (
      <>
        <Section title="The Value of Attendance Analytics">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Attendance reporting is grouped into Check in/out, Attendance Hours, and Classrooms.
            This structure supports both daily supervision and longer-term staffing/compliance
            analysis.
          </p>
          <ImagePlaceholder description="An analytical chart showing daily, weekly, and monthly attendance trends across different classrooms." />
        </Section>
        <Section title="Turning Data into Action">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Use the status filter in Check in/out and combine it with time and classroom filters for
            targeted investigation. Recommended usage:
          </p>
          <BulletList
            items={[
              "Use Check in/out for day-level audit of attendance states (Checked In, Checked Out, Absent).",
              "Use Attendance Hours to evaluate duration-based attendance trends across selected periods.",
              "Use Classrooms view to compare attendance behavior by room and detect imbalance or anomalies.",
              "Standardize date ranges during review meetings so attendance KPIs are interpreted consistently.",
            ]}
          />
        </Section>
        <Section title="Review Criteria and Safeguards">
          <BulletList
            items={[
              "Daily control: unresolved Absent or missing transitions should be reviewed on the same day.",
              "Pattern criteria: flag repeated low attendance hours for the same classroom or child cohort.",
              "Staffing validation: use Attendance Hours and Classrooms together before making schedule changes.",
              "Audit readiness: keep status and time filters explicit when exporting or presenting attendance evidence.",
            ]}
          />
        </Section>
      </>
    ),
    "children-reports": (
      <>
        <Section title="Comprehensive Student Insights">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            In Reports, the Children section contains Activities and Learnings sub-tabs. This gives
            you separate visibility into daily activity logging and academic/learning progress.
          </p>
          <ImagePlaceholder description="A dashboard visualizing student enrollment statuses, age distributions, and classroom allocations." />
        </Section>
        <Section title="Strategic Utilization">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Use Children reports as an operational quality layer, not just a static dashboard. Key
            review checks:
          </p>
          <BulletList
            items={[
              "Activities: validate consistency of classroom logs and identify where activity capture is incomplete.",
              "Learnings: review progress patterns to ensure milestones and grading cadence are being followed.",
              "Filter by classroom and date before escalation to isolate issues to a specific cohort.",
              "Use findings to coach classroom teams and improve record quality before parent/reporting cycles.",
            ]}
          />
        </Section>
        <Section title="Data Quality Checks">
          <BulletList
            items={[
              "Completeness check: verify each active classroom has expected activity and learning entries.",
              "Consistency check: ensure naming and tagging patterns are stable across teachers and periods.",
              "Exception handling: investigate classrooms with sudden drops in logged activities or learning records.",
              "Readiness check: confirm data quality before report cards, parent meetings, or compliance reviews.",
            ]}
          />
        </Section>
      </>
    ),
    "staff-reports": (
      <>
        <Section title="Managing Your Educational Workforce">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Staff reports help validate staffing distribution against classroom demand and
            operational timelines. Use classroom and time filters to view patterns by team and
            period.
          </p>
          <ImagePlaceholder description="A report view showing staff distribution, qualification statuses, and role assignments." />
        </Section>
        <Section title="Key Insights Provided">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Use this tab to support people operations decisions with data:
          </p>
          <BulletList
            items={[
              "Coverage checks: verify classroom staffing levels across selected dates.",
              "Role distribution checks: identify concentration gaps between teaching and support responsibilities.",
              "Operational follow-up: use trend changes as triggers for staffing adjustments and schedule review.",
            ]}
          />
        </Section>
        <Section title="Workforce Decision Criteria">
          <BulletList
            items={[
              "Capacity alignment: staffing levels should reflect classroom load and attendance patterns.",
              "Role clarity: where overlap is high, define responsibility boundaries to reduce execution gaps.",
              "Escalation trigger: repeated under-coverage in the same classrooms should trigger schedule redesign.",
              "Validation cycle: review staffing reports on a fixed cadence (weekly or bi-weekly) for stability.",
            ]}
          />
        </Section>
      </>
    ),
    "admission-reports": (
      <>
        <Section title="Optimizing Your Enrollment Funnel">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Admission reports are available under Reports with Tours and Forms views. They provide a
            summary perspective of inbound demand and conversion activity, complementing the
            operational Admission module.
          </p>
          <ImagePlaceholder description="A funnel chart visualizing the journey from initial lead to active enrollment." />
        </Section>
        <Section title="Measuring Success">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Recommended analysis sequence:
          </p>
          <BulletList
            items={[
              "Tours view: track booking completion, reschedules, and completion quality.",
              "Forms view: monitor submission volume, status progression, and response quality.",
              "Cross-check with Admissions tab to verify that accepted/offer flows convert into enrolled child records.",
            ]}
          />
        </Section>
        <Section title="Funnel Validation and Restrictions">
          <BulletList
            items={[
              "Source clarity: confirm referral/source fields are maintained so conversion analysis remains useful.",
              "Stage accuracy: statuses should represent real lifecycle stage, not temporary assumptions.",
              "Leak detection: investigate high drop-off between form submission and completed admission actions.",
              "Evidence standard: use consistent date/classroom filters when reporting funnel performance.",
            ]}
          />
          <Callout title="Flow Integrity Rule" type="info">
            Admission reports are analytical views. Always cross-check outliers in the operational
            Admission and Leads modules before taking policy actions.
          </Callout>
        </Section>
      </>
    ),
  },
  "setup-your-school-admin": {
    "how-to-create-a-new-classroom": (
      <>
        <Section title="Building Your Digital Classrooms">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Classrooms are foundational entities in this project. They drive class assignment for
            teachers and child enrollment mapping, and they feed dashboard metrics such as total
            capacity and total enrolled.
          </p>
          <ImagePlaceholder description="The 'Add Classroom' modal highlighting the Capacity and Age restriction fields." />
        </Section>
        <Section title="Step-by-Step Instructions">
          <SubSection title="Adding a New Classroom">
            <NumberedList
              items={[
                "Go to 'Admin > Rooms > Classes'.",
                "Click 'Add Classroom'.",
                "Enter class name, age range, capacity, and assigned staff.",
                "Save, then confirm the class appears in the class table and metrics cards.",
                "Use deactivate instead of delete when you want to preserve historical references.",
              ]}
            />
          </SubSection>
        </Section>
        <Section title="Criteria and Restrictions">
          <BulletList
            items={[
              "Age range should be logically consistent (minimum must not exceed maximum).",
              "Capacity should represent safe operational limit, not temporary target enrollment.",
              "Assigned staff should be active and role-appropriate for the classroom.",
              "Prefer deactivation over deletion when historical reporting references are needed.",
            ]}
          />
        </Section>
      </>
    ),
    "how-to-add-and-invite-teachers": (
      <>
        <Section title="Onboarding Your Educational Staff">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Teacher setup includes profile data, role, qualification, class assignment, and
            emergency contact details. Correct assignment is important because class visibility and
            responsibilities are class-scoped.
          </p>
          <ImagePlaceholder description="The Teacher creation form showing the General Information and Emergency Contact tabs." />
        </Section>
        <Section title="Step-by-Step Instructions">
          <SubSection title="Adding a Teacher Profile">
            <NumberedList
              items={[
                "Go to staff management and open 'Add Teacher'.",
                "Complete core profile fields: first name, last name, email, phone, role, qualification, and start date.",
                "Assign one or more active classrooms.",
                "Add emergency contact details (name, relationship, phone, and optional notes).",
                "Save and verify the record appears in staff listing with the expected classroom assignments.",
              ]}
            />
          </SubSection>
        </Section>
        <Section title="Validation Checklist">
          <BulletList
            items={[
              "Identity fields: first name, last name, and contact details are complete and correctly formatted.",
              "Class assignment: at least one correct active classroom is selected where required.",
              "Role/qualification mapping: role is accurate for permissions and qualification is recorded consistently.",
              "Emergency contact quality: relationship and reachable phone number are present before save.",
            ]}
          />
        </Section>
      </>
    ),
    "how-to-add-a-children-profile": (
      <>
        <Section title="Enrolling Students into the System">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Child enrollment uses a multi-step flow with Profile, Parent, and Documents tabs (and
            mobile sub-steps for General, Medical, and Emergency sections). Save quality here
            directly impacts attendance, billing, learning, and parent visibility.
          </p>
          <ImagePlaceholder description="The complex multi-tab form for adding a child, highlighting the Profile, Parent, and Documents sections." />
        </Section>
        <Section title="Step-by-Step Instructions">
          <SubSection title="Creating the Child Profile">
            <NumberedList
              items={[
                "Navigate to 'Users' > 'Children' and click '+ Add Child'.",
                "In Profile, complete general details and classroom assignment, then enter medical and emergency information.",
                "Move to Parent and either add a new parent or link from existing parent records.",
                "Move to Documents to upload required files.",
                "Click Save on the final step and confirm no validation errors remain.",
                "After creation, verify child profile data, parent linkage, and classroom assignment in the record view.",
              ]}
            />
          </SubSection>
        </Section>
        <Section title="Enrollment Quality Criteria">
          <BulletList
            items={[
              "Profile integrity: child identity and classroom assignment are complete before parent linking.",
              "Health safety: medical and emergency fields are reviewed for actionable details.",
              "Relationship accuracy: parent links reflect actual guardianship relationships.",
              "Document readiness: required files are uploaded before admission finalization.",
            ]}
          />
          <Callout title="Restriction to Avoid Rework" type="warning">
            Do not finalize child enrollment with placeholder parent contact details. Incomplete
            guardian data causes avoidable failures in communication and billing flows.
          </Callout>
        </Section>
      </>
    ),
    "how-to-add-or-link-parents": (
      <>
        <Section title="Managing Parent Access">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Parent access is linked through child records. You can attach parents during child
            creation or later from the child profile workflow.
          </p>
          <ImagePlaceholder description="The Parent Tab within a child's profile showing linked parents and the Add Parent options." />
        </Section>
        <Section title="Step-by-Step Instructions">
          <SubSection title="Linking an Additional Parent">
            <NumberedList
              items={[
                "Navigate to 'Users' > 'Children' and click to Edit an existing child's profile.",
                "Open the 'Parent' tab.",
                "Use 'Add Parent' for a new profile, or 'Add from Existing' to link an existing parent record.",
                "Verify each linked parent has correct relationship, contact details, and child association.",
                "Save and re-open the profile to confirm links persisted correctly.",
              ]}
            />
          </SubSection>
        </Section>
        <Section title="Parent Linking Validation">
          <BulletList
            items={[
              "Use existing records where possible to prevent duplicate parent profiles.",
              "Verify email/phone for each linked parent before saving.",
              "Confirm relationship labels are correct for each child-parent pair.",
              "Re-open the child profile after save to confirm links persisted and display correctly.",
            ]}
          />
        </Section>
      </>
    ),
  },
  "admission-management": {
    "view-events-calendar": (
      <>
        <Section title="Viewing Admission Events Calendar">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            The Admission Events Calendar is your timeline view for admission-related events and
            scheduling visibility. Use it to monitor upcoming activity and avoid operational
            conflicts before they affect tours or follow-ups.
          </p>
          <ImagePlaceholder description="Admission Events Calendar showing scheduled entries and date navigation controls." />
        </Section>

        <Section title="How to Work with the Calendar">
          <NumberedList
            items={[
              "Go to 'Admin > Admission > Events' to open the calendar view.",
              "Review event placement by date and scan for overlapping or high-density periods.",
              "Use the calendar as a planning layer before creating or rescheduling tours.",
              "Keep event timing aligned with staffing availability so scheduled experiences can be delivered consistently.",
            ]}
          />
          <Callout title="Operational Criteria" type="info">
            Treat the calendar as your source of scheduling truth. Update event timing early when
            plans change to reduce last-minute reschedules and communication gaps.
          </Callout>
        </Section>
      </>
    ),
    "manage-tours-and-forms": (
      <>
        <Section title="Managing Tours and Forms">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Admission intake in this project runs through two connected channels: Tours and Forms.
            Tours handle scheduled visit experiences, while Forms handle information capture and
            submission workflows. Both channels are visible under Admission and eventually feed into
            Leads & Requests, then Admissions.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            In practical usage, this module is the top of the pipeline. What you publish here
            determines what families can access publicly, what records enter your intake queue, and
            how clean your downstream offer/admission operations will be.
          </p>
          <ImagePlaceholder description="Admission module showing Tours and Forms pages with list management actions." />
        </Section>

        <Section title="How Tours Work (Create, Publish, and Booking Flow)">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Tours are created from the admin flow and include multi-step setup: Basic Information,
            Availability, and Notification settings. The system enforces required setup before
            save/publish behavior, and tour URLs are used for the public-facing booking entry point.
          </p>
          <NumberedList
            items={[
              "Go to 'Admin > Admission > Tours' to view all tour and form entries in one listing with status and actions.",
              "Create a tour from the Create Tour flow and complete required tabs (Basic Info, Availability, Notification).",
              "Save the tour, then use the public tour link (`/tour-events/{url}`) to preview what families see.",
              "When families submit a booking through that link, the record appears in your intake queue as a tour booking.",
            ]}
          />
          <Callout title="How Booking Enters Operations" type="info">
            A public tour booking is not the end of the flow. It moves into Leads & Requests where
            staff can view details, mark completion, reschedule, cancel, and send offers.
          </Callout>
        </Section>

        <Section title="How Forms Work (Draft, Publish, Responses)">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Forms support a publish lifecycle. From the Tours/Forms listing, forms can be edited,
            previewed, published/unpublished, and opened for response review. This allows your team
            to control when a form is publicly active without deleting the form definition.
          </p>
          <NumberedList
            items={[
              "Open Forms from Admission and use actions to preview, edit, publish/unpublish, or view responses.",
              "Use published forms for live intake; keep drafts for incomplete or internal iteration.",
              "When a family submits a form, that response enters operational queues where status can be progressed.",
              "Use response views to decide whether to complete follow-up actions or progress toward offer handling.",
            ]}
          />
        </Section>
      </>
    ),
    "manage-leads-and-requests": (
      <>
        <Section title="Managing Leads and Requests">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Leads and Requests is the active operations queue where intake records are worked. It
            combines two record types into one table: tour bookings and form responses. This is
            where your team handles real follow-up actions before records become fully admitted
            outcomes.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            The row actions change by record type and status. For tour bookings, actions include
            view, reschedule, cancel, mark complete, and send offer. For form responses, actions
            include view, mark as completed (from submitted), and send offer after completion.
          </p>
          <ImagePlaceholder description="Leads and Requests table showing parents, source, date, and status columns with action menus." />
        </Section>

        <Section title="Detailed Flow for Tour and Form Records">
          <NumberedList
            items={[
              "Open 'Admin > Admission > Leads & Requests' and filter/search to locate active records quickly.",
              "For a tour booking: open View to inspect details, then choose operational action (reschedule, cancel, mark complete, or send offer).",
              "For a form response: open View to inspect submitted details, mark as completed when reviewed, then send offer from the completed state.",
              "Use Send Offer to open the offer generation flow, then proceed to offer email send from the follow-up modal.",
              "After every action, confirm the status updates in the table so the queue reflects current reality.",
            ]}
          />
        </Section>

        <Section title="How Send Offer Works in This Module">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Send Offer in Leads & Requests opens a guided flow: first you prepare offer details
            (including children and configurable line items), then you proceed to the email modal to
            send the final offer message with optional attachments. This is the operational bridge
            between intake review and formal admission proposal.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            If your team uses this consistently, offers are sent from a single controlled point in
            the pipeline, and records remain easier to track and audit.
          </p>
        </Section>
      </>
    ),
    "manage-admissions": (
      <>
        <Section title="Managing Admissions">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            The Admissions page manages records that have reached decision-stage handling. You can
            view admission entries, send or resend offers depending on current status, and withdraw
            an admission when the process should be closed.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            In this project, the visible admission actions are intentionally operational: View,
            Send/Resend Offer (for non-accepted records), and Withdraw. These actions keep the
            decision lifecycle explicit and traceable in the admissions table.
          </p>
          <ImagePlaceholder description="Admissions table with application date, parent names, status, and offer management actions." />
        </Section>

        <Section title="Offer and Withdrawal Lifecycle">
          <NumberedList
            items={[
              "Go to 'Admin > Admission > Admissions'.",
              "Use search and pagination to locate the relevant application quickly.",
              "Open View first to confirm parent and child details before taking decision actions.",
              "Use 'Send Offer' when no offer has been sent yet, or 'Resend Offer' when status is already 'Offer sent'.",
              "Use 'Withdraw' to formally move that admission record to withdrawn state when the process should stop.",
              "Confirm the table status after each action so admissions history is accurate and current.",
            ]}
          />
        </Section>

        <Section title="About 'Withdraw Offer' vs 'Withdraw Admission'">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            In the current admin flow, the explicit action is to withdraw the admission record
            (status update to withdrawn). There is no separate button labeled "Withdraw Offer" in
            this screen; offer handling is represented through Send/Resend actions and final
            withdrawal through the admission status update path.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            If your process language uses the phrase "withdraw offer," treat it operationally here
            as withdrawing the admission in the platform so downstream teams see the final,
            consistent status.
          </p>
        </Section>
      </>
    ),
  },
  "attendance-reports": {
    "child-attendance-sheet": (
      <>
        <Section title="Child Attendance Sheet Overview">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            The Child Attendance Sheet is the operational source for student presence accuracy. This
            module is designed to answer a simple but critical question at any point in the day:
            "For this date range and classroom scope, do we have complete and trustworthy attendance
            records for every active child?" When this sheet is maintained well, downstream modules
            such as incident logs, parent communication, and attendance reporting remain reliable.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            In practical terms, this view should not be treated as a passive dashboard. It is a
            working queue for attendance verification. Admin users can use it to identify missing
            records early, classroom leads can use it to resolve exceptions before day-end, and
            operations teams can use it as evidence for internal audits and support responses.
          </p>
          <ImagePlaceholder description="Child attendance sheet with attendance status columns and date filters." />
        </Section>

        <Section title="How to Use It Effectively">
          <NumberedList
            items={[
              "Open 'Child Attendance Sheet' and set a clear date range and classroom scope first.",
              "Review each child row to see who is checked in, checked out, absent, or missing an expected status.",
              "Use this sheet during the day for quick exception checks and again at day-close for final attendance confirmation.",
              "After updates are made by the team, refresh and confirm the sheet reflects the latest resolved statuses.",
            ]}
          />
        </Section>

        <Section title="Practical Interpretation Notes">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            This view is best read as a live operational board, not just a historical report. Teams
            typically use it to identify missing records quickly, coordinate corrections with
            classroom staff, and ensure the final daily picture is clear before parent-facing or
            leadership reporting.
          </p>
        </Section>
      </>
    ),
    "teacher-attendance-sheet": (
      <>
        <Section title="Teacher Attendance Sheet Overview">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            The Teacher Attendance Sheet is the staffing reliability layer of attendance operations.
            It connects attendance behavior to classroom coverage outcomes and helps answer: "Do we
            have stable staff presence aligned with classroom demand for this period?" This module
            is especially important when reviewing service quality, substitute patterns, and
            scheduling pressure.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            This sheet should be used as both a daily control and a trend-analysis tool. Daily
            controls help catch immediate coverage risk. Trend analysis helps leaders identify
            repeated instability that requires schedule redesign, escalation coaching, or policy
            adjustment.
          </p>
          <ImagePlaceholder description="Teacher attendance sheet showing staff status by date and classroom mapping." />
        </Section>

        <Section title="Operational Workflow">
          <NumberedList
            items={[
              "Open 'Teacher Attendance Sheet' and apply date/classroom filters to the team you want to review.",
              "Review teacher attendance states and identify patterns that could affect classroom coverage.",
              "Use the sheet for both immediate daily checks and short-term trend observation across recent periods.",
              "Coordinate staffing updates or follow-ups based on what you observe in the attendance records.",
            ]}
          />
        </Section>

        <Section title="How Teams Commonly Use This View">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Admin teams usually rely on this sheet to monitor reliability of staffing presence,
            while academic leads use it to understand whether classroom delivery constraints might
            be linked to attendance patterns. It is especially helpful during periods of schedule
            pressure, substitutions, or repeated absences.
          </p>
        </Section>
      </>
    ),
    "combined-attendance-sheet": (
      <>
        <Section title="Combined Attendance Sheet Overview">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            The Combined Attendance Sheet is the governance view that links child attendance
            outcomes with teacher attendance inputs in one reporting surface. It is best used for
            leadership reviews, compliance preparation, and root-cause analysis where isolated
            attendance views are not enough.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            This module is valuable because it allows you to validate assumptions. For example, when
            child attendance declines in a cluster, you can quickly test whether staffing
            instability occurred in the same period. It supports a more accurate interpretation of
            operational health by reducing siloed analysis.
          </p>
          <ImagePlaceholder description="Combined attendance report showing child and teacher attendance metrics in one view." />
        </Section>

        <Section title="Interpretation Flow">
          <NumberedList
            items={[
              "Open 'Combined Attendance Sheet' and set your reporting period.",
              "Start with broad attendance patterns, then drill into child and teacher records where anomalies appear.",
              "Use the combined perspective to understand whether attendance issues might be isolated or connected across groups.",
              "Document findings and follow-up actions so future reviews can compare improvements over time.",
            ]}
          />
        </Section>

        <Section title="Leadership Usage Context">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            This is usually the most useful attendance view for leadership updates because it brings
            student and staff attendance context together. It helps meetings move from isolated
            observations to operational decisions by showing both sides of the attendance picture in
            one place.
          </p>
          <Callout title="Leadership Reporting Guidance" type="success">
            Use the combined sheet as your meeting summary layer, but keep child and teacher source
            sheets available for audit trail, root-cause checks, and evidence-backed decision logs.
          </Callout>
        </Section>
      </>
    ),
  },
  "communication-and-messaging": {
    "parent-messaging": (
      <>
        <Section title="Parent Messaging Module Overview">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Parent Messaging is the direct communication channel between the school team and
            families. Its purpose is to ensure that sensitive or operationally important updates are
            transmitted clearly, tracked properly, and tied to the right child or context. This
            module should be used for actionable communication, not just general chatter.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Strong parent messaging practice improves trust and reduces avoidable support volume.
            When conversations include clear context, expected next steps, and response windows,
            families receive better service and your internal team spends less time resolving
            ambiguity.
          </p>
          <ImagePlaceholder description="Parent messaging interface showing conversation threads, status, and message context." />
        </Section>

        <Section title="How Parent Messaging Works">
          <NumberedList
            items={[
              "Open the messaging module and search chats by name to find the right conversation quickly.",
              "Use the parent conversation thread to discuss child-related updates, clarifications, and routine communication.",
              "Continue the conversation inside the same thread so communication history stays in one place.",
              "Use message view and chat modal interactions to read, reply, and manage ongoing discussion.",
            ]}
          />
        </Section>

        <Section title="Who You Can Reach as a Parent Communication Flow">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Parent-facing communication in this module is intended for direct school-to-parent
            conversation threads. Depending on how your workspace is configured, these threads can
            include classroom-relevant staff context and parent identity details so communication
            stays tied to the right child and conversation history.
          </p>
        </Section>
      </>
    ),
    "teacher-messaging": (
      <>
        <Section title="Teacher Messaging Module Overview">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Teacher Messaging supports internal coordination between instructional and operational
            teams. It is best used to synchronize class-level actions, clarify responsibilities, and
            escalate blockers early. This module is most effective when messages are concise,
            assignment-based, and outcome-oriented.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Good teacher communication reduces handoff errors across shifts and keeps classroom
            operations predictable. The module should be treated as a coordination workflow, where
            each thread moves from context to action to confirmation.
          </p>
          <ImagePlaceholder description="Teacher messaging view showing team threads and classroom-related communication." />
        </Section>

        <Section title="How Teacher Messaging Works">
          <NumberedList
            items={[
              "Open the teacher communication area and select the relevant conversation thread.",
              "Use this channel for classroom coordination, operational updates, and quick clarifications between staff.",
              "Keep updates in-thread so anyone reviewing later can follow full context and timeline.",
              "Use search and filters to locate active conversations when managing multiple threads.",
            ]}
          />
        </Section>

        <Section title="Who You Can Reach in Teacher Communication">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            This messaging flow is built for team communication among school users in teaching and
            operations contexts. It is the right place for internal coordination that should not be
            broadcast as announcements and does not belong in parent-specific threads.
          </p>
        </Section>
      </>
    ),
    "create-announcements": (
      <>
        <Section title="Create Announcements Module Overview">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            The Create Announcements module is your broadcast communication channel for one-to-many
            updates. Use it when the same message must reach a broad audience consistently, such as
            schedule changes, policy notices, event reminders, or urgent operational updates.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Announcements should be written as operational notices: clear purpose, affected
            audience, action required (if any), effective date/time, and support contact path. The
            quality of this module directly affects parent and staff alignment during high-impact
            changes.
          </p>
          <ImagePlaceholder description="Create Announcement screen showing title, body, targeting options, and send/publish action." />
        </Section>

        <Section title="How Announcements Work">
          <NumberedList
            items={[
              "Open 'Create Announcement' and enter a title plus detailed content in the editor.",
              "Save to Draft when you are still preparing the message, or Publish when it is ready for distribution.",
              "Use the announcements module for one-to-many communication where the same information should reach a broad audience.",
              "After publishing, use the announcement listing and detail views to track and reference what has already been communicated.",
            ]}
          />
        </Section>

        <Section title="When to Use Announcements vs Messaging">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Use announcements when everyone (or a broad group) needs the same message. Use messaging
            when communication is person-to-person or thread-specific. In simple terms:
            announcements broadcast, messaging converses.
          </p>
        </Section>
      </>
    ),
  },
  "billing-and-invoicing": {
    "create-single-invoice": (
      <>
        <Section title="Single Invoice Module Overview">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Single Invoice creation in this project is handled from the Invoicing page and opens a
            structured form where you select classroom and student(s), add line items, configure
            payment settings, and send the invoice through the built-in send flow. The module is
            designed to support both quick invoice generation and controlled financial records.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            The invoicing table also supports day-to-day management actions such as view, edit
            (status-dependent), duplicate, record payment, and delete (status-dependent). This means
            creation and operational follow-up are both tied to the same billing workflow.
          </p>
          <ImagePlaceholder description="Admin invoice list with status cards, create actions, row actions, and payment recording flow." />
        </Section>

        <Section title="How Single Invoice Creation Works">
          <NumberedList
            items={[
              "Go to 'Admin > Billing > Invoices' and use 'Create New' > 'Create Invoice'.",
              "In the invoice form, complete Student Details first by selecting Classroom, then selecting one or more students in that classroom.",
              "Add invoice line items in the Items section (description, quantity, rate, VAT). Subtotal, VAT, discount, total, and balance are calculated in the summary.",
              "Set invoice dates, payment method, and bank account (where applicable), then use 'Save and Send' to open the send modal.",
              "In Send Invoice modal, review recipients (parent emails from selected students), update subject/message, and send.",
              "After creation, manage invoice from table actions: view, edit (when allowed), record payment, duplicate, or delete.",
            ]}
          />
        </Section>

        <Section title="How Payments and Statuses Are Managed">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Invoice statuses in the listing include states such as Paid, Overdue, Partially Paid,
            and Pending-like states depending on backend values. Payment updates are done through
            the Record Payment modal, which updates invoice balances and status behavior in the
            billing table.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            For auditability and consistency, teams typically view invoice details before adjusting
            payments, then return to the table to verify status changes and metadata cards
            (Paid/Overdue/Pending) are updated.
          </p>
        </Section>
      </>
    ),
    "create-recurring-invoice": (
      <>
        <Section title="Recurring Invoice Module Overview">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Recurring Invoice creation uses the same invoice engine with recurring-specific fields
            enabled through the `type=recurring` flow. It is meant for repeating charges (for
            example term-based or periodic tuition structures) where invoice setup should be reused
            and managed as a recurring billing pattern.
          </p>
          <ImagePlaceholder description="Recurring invoice creation screen showing recurring fields and shared invoice summary behavior." />
        </Section>

        <Section title="Recurring Flow and Navigation">
          <NumberedList
            items={[
              "From Invoices page, choose 'Create New' > 'Create Recurring Invoice'.",
              "In recurring mode, complete standard invoice fields plus recurring invoice fields such as Invoice Type and Billing Period.",
              "Configure student selection and line items the same way as single invoices.",
              "Use Preview to inspect output, then 'Save and Send' to dispatch through the invoice send modal.",
              "For recurring edits, use the recurring edit route behavior from table actions when available.",
            ]}
          />
        </Section>

        <Section title="What Is Shared vs Different from Single Invoices">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Shared behavior includes line-item accounting, summary calculations, payment method
            handling, send modal flow, and table-level post-creation actions. Recurring-specific
            behavior adds periodic invoice semantics and recurring metadata fields so billing
            schedules can be represented consistently over time.
          </p>
        </Section>
      </>
    ),
  },
  "using-the-kiosk-app": {
    "clock-in-using-kiosk": (
      <>
        <Section title="Kiosk Clock-In Overview">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Kiosk mode in this project is a controlled check-in/check-out environment accessed from
            `/kiosk/check-in`. Admin authentication gates kiosk access. From there, users choose
            Teacher or Parent flow. Parent flow supports login with email + 4-digit kiosk PIN and
            can also auto-fill from QR token parameters.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Attendance actions are posted to attendance APIs using parent/teacher context and
            child/teacher IDs. Parent clock-in supports bulk child selection with schedule-aware
            checks so children not scheduled for today cannot be clocked in accidentally.
          </p>
          <ImagePlaceholder description="Kiosk role selection leading into parent/teacher check-in flows with PIN verification and attendance actions." />
        </Section>

        <Section title="Parent Clock-In Flow">
          <NumberedList
            items={[
              "Open kiosk flow and choose Parent.",
              "Login using email and 4-digit kiosk PIN, or use QR-linked entry that pre-fills credentials.",
              "On Parent Dashboard, select one or more children (or Select All) and tap Clock In.",
              "Selected children are clocked in via attendance API with parent context and student IDs.",
              "The dashboard refreshes and shows updated signed-in states and clock-in times.",
            ]}
          />
        </Section>

        <Section title="Teacher Clock-In Flow">
          <NumberedList
            items={[
              "Open kiosk flow and choose Teacher.",
              "Search and select teacher profile.",
              "Enter teacher PIN in the PIN modal to open detail actions.",
              "Use Clock In action from teacher detail modal.",
              "Teacher attendance state updates and reflects in kiosk teacher listing.",
            ]}
          />
        </Section>
      </>
    ),
    "clock-out-using-kiosk": (
      <>
        <Section title="Kiosk Clock-Out Overview">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Clock-out uses the same kiosk identity and attendance pipeline as clock-in, but sends
            time-out data and updates signed-out status for selected records. Parent clock-out
            supports bulk child clock-out; teacher clock-out runs through the teacher detail modal
            after PIN verification.
          </p>
          <ImagePlaceholder description="Kiosk clock-out actions from parent bulk bar and teacher detail modal." />
        </Section>

        <Section title="Parent and Teacher Clock-Out Flow">
          <NumberedList
            items={[
              "For parents, open dashboard and select children who are currently signed in, then tap Clock Out.",
              "For teachers, authenticate via PIN and use Clock Out in detail modal.",
              "Clock-out requests submit parent/teacher identity, selected IDs, and time-out where required by endpoint.",
              "After success, dashboard/list views refresh and statuses move to signed-out states.",
            ]}
          />
        </Section>

        <Section title="How Attendance Is Managed After Actions">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Attendance data is persisted through `/api/v1/attendance` endpoints for students and
            staff. Kiosk UI then refetches parent/teacher data so users see latest attendance state
            immediately. This keeps kiosk actions and reporting views synchronized across modules.
          </p>
        </Section>
      </>
    ),
    "reset-kiosk-pin": (
      <>
        <Section title="Reset Kiosk PIN and QR-Assisted Login">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            If you forget your kiosk PIN, use the "Forgot PIN" option on the kiosk login screen.
            This is available in both parent and teacher kiosk flows.
          </p>
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Parents can also use a school-provided QR code to open kiosk access quickly. This helps
            reduce typing during busy drop-off and pick-up times.
          </p>
          <ImagePlaceholder description="Kiosk parent login showing PIN entry, forgot PIN, and QR/query-based auto-login behavior." />
        </Section>

        <Section title="Simple Access Steps">
          <NumberedList
            items={[
              "Open kiosk and choose Parent or Teacher.",
              "Enter your email and kiosk PIN, or scan your QR code if your school provides one.",
              "If you do not remember your PIN, tap Forgot PIN and follow the reset instructions.",
              "After login, continue to dashboard and complete clock-in or clock-out actions.",
            ]}
          />
        </Section>
      </>
    ),
  },
  "classroom-and-activities-management": {
    "add-and-manage-classrooms": (
      <>
        <Section title="Managing Daily Classroom Operations">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Classroom management focuses on day-to-day coordination. While initial setup defines the room and limits, daily management involves adjusting student assignments, monitoring ratios, and overseeing room transitions.
          </p>
          <ImagePlaceholder description="Classroom management dashboard showing active classrooms, current headcount, and staff assignments." />
        </Section>
        <Section title="Step-by-Step Instructions">
          <SubSection title="Managing Classroom Details">
            <NumberedList
              items={[
                "Navigate to 'Admin > Rooms > Classes'.",
                "Select a classroom to view its current roster, assigned staff, and daily schedule.",
                "Use the edit action to update room capacity or assign different teachers for the day.",
                "Monitor the active headcount against the room's maximum capacity to ensure ratio compliance.",
              ]}
            />
          </SubSection>
        </Section>
        <Section title="Best Practices">
          <BulletList
            items={[
              "Always update staff assignments when substitutions occur so activity logs reflect the correct teacher.",
              "Review room capacity regularly, especially during transition periods like moving up from infant to toddler rooms.",
            ]}
          />
        </Section>
      </>
    ),
    "activities-dashboard": (
      <>
        <Section title="Activities Dashboard Overview">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            The Activities Dashboard is the central hub for logging daily child events such as naps, meals, and diaper changes. This dashboard allows teachers to log events in bulk or individually, ensuring parents stay informed in real-time.
          </p>
          <ImagePlaceholder description="Activities dashboard showing a list of children and quick-action icons for logging various activities." />
        </Section>
        <Section title="How to Use the Dashboard">
          <NumberedList
            items={[
              "Open the Activities section for your assigned classroom.",
              "Select one or more children from the roster.",
              "Choose the activity type (e.g., Meal, Nap, Photo) from the quick-action menu.",
              "Fill in the required details and save to instantly update the parent dashboard.",
            ]}
          />
        </Section>
      </>
    ),
    "log-nap-time": (
      <>
        <Section title="Logging Nap Times">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Recording sleep duration helps parents manage their child's routine at home. The nap logger allows you to record both the start and end times, or log a completed nap retroactively.
          </p>
          <ImagePlaceholder description="Nap logging modal with start time, end time, and sleep quality options." />
        </Section>
        <Section title="Logging Process">
          <NumberedList
            items={[
              "From the Activities Dashboard, select the child (or children) going down for a nap.",
              "Select 'Nap' and tap 'Start Nap' to begin a timer, or choose 'Log Past Nap' to enter specific times manually.",
              "When the child wakes, return to the active nap entry and tap 'End Nap'.",
              "Optionally add a note about sleep quality (e.g., 'Slept soundly', 'Restless').",
            ]}
          />
        </Section>
      </>
    ),
    "log-meals": (
      <>
        <Section title="Logging Meals and Snacks">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Meal tracking ensures parents know what their child ate and how much. It is also crucial for monitoring allergies and dietary restrictions.
          </p>
          <ImagePlaceholder description="Meal logging interface showing food type, amount eaten (e.g., None, Some, Most, All), and notes." />
        </Section>
        <Section title="Logging Process">
          <NumberedList
            items={[
              "Select the relevant children and choose the 'Meal' activity.",
              "Specify the meal type (Breakfast, AM Snack, Lunch, PM Snack, etc.).",
              "Select the amount consumed (e.g., All, Most, Some, None).",
              "Add details about what was served, paying special attention to any allergy warnings displayed for the selected children.",
            ]}
          />
        </Section>
      </>
    ),
    "log-water-intake": (
      <>
        <Section title="Logging Water Intake">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Keeping track of hydration is important, especially on hot days or after physical activities.
          </p>
          <ImagePlaceholder description="Water intake logger showing volume options and time." />
        </Section>
        <Section title="Logging Process">
          <NumberedList
            items={[
              "Select the children who were offered water.",
              "Choose the 'Water' activity option.",
              "Record the approximate amount consumed or simply log that water was offered and accepted.",
            ]}
          />
        </Section>
      </>
    ),
    "add-and-upload-photos": (
      <>
        <Section title="Sharing Photos and Media">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Photos are highly engaging for parents. This feature allows you to capture moments throughout the day, tag the children involved, and share them directly to the parent app.
          </p>
          <ImagePlaceholder description="Photo upload screen with child tagging and caption capabilities." />
        </Section>
        <Section title="Uploading Process">
          <NumberedList
            items={[
              "Take a photo using your device or upload an existing one from the gallery.",
              "Select the 'Photo/Video' activity.",
              "Tag the specific children visible in the media. Ensure you only tag the correct children for privacy.",
              "Add a brief, positive caption describing the activity.",
              "Submit to share with the linked parents.",
            ]}
          />
        </Section>
        <Section title="Privacy Reminder">
          <Callout title="Privacy and Consent" type="warning">
            Always verify that the children tagged in photos have media release consent. Avoid sharing photos of children in distress or inappropriate states.
          </Callout>
        </Section>
      </>
    ),
    "log-medication": (
      <>
        <Section title="Administering Medication">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Medication logging is a critical compliance feature. It requires precision and often requires matching the administration against a parent's pre-authorized medication request.
          </p>
          <ImagePlaceholder description="Medication logging form showing dosage, time administered, and staff signature." />
        </Section>
        <Section title="Logging Process">
          <NumberedList
            items={[
              "Select the specific child receiving the medication.",
              "Verify the parent's medication authorization details (dosage, time, route) displayed in the child's health profile.",
              "Log the exact time the medication was administered and the dosage given.",
              "Add any relevant notes, such as the child's reaction.",
            ]}
          />
        </Section>
        <Section title="Critical Compliance">
          <Callout title="Double-Check Details" type="warning">
            Medication entries are permanent health records. Always double-check the child's identity, the medication label, and the dosage before administering and logging.
          </Callout>
        </Section>
      </>
    ),
    "log-bathroom-diaper-changes": (
      <>
        <Section title="Logging Bathroom and Diaper Changes">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Regular diaper change logging keeps infants and toddlers comfortable and helps parents monitor their child's health and schedule.
          </p>
          <ImagePlaceholder description="Diaper/Bathroom logging screen with options for Wet, BM, Dry, and potty attempts." />
        </Section>
        <Section title="Logging Process">
          <NumberedList
            items={[
              "Select the child and choose the 'Bathroom/Diaper' activity.",
              "Select the outcome: Wet, Bowel Movement (BM), Dry, or Potty Attempt.",
              "Add optional notes if there are concerns (e.g., diaper rash, unusual BM).",
              "Save the entry to maintain the scheduled change interval.",
            ]}
          />
        </Section>
      </>
    ),
  },
  "school-settings": {
    "manage-school-profile": (
      <>
        <Section title="Managing the School Profile">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            The School Profile contains your core identity details: name, logo, contact information, and address. These details appear on invoices, parent communications, and public-facing forms.
          </p>
          <ImagePlaceholder description="School profile settings page with fields for logo upload, school name, and contact details." />
        </Section>
        <Section title="Update Process">
          <NumberedList
            items={[
              "Navigate to 'Admin > Settings > School Profile'.",
              "Upload a high-quality logo. This will be used across the app.",
              "Ensure the primary email and phone number are monitored regularly.",
              "Save changes to propagate the new details across all generated documents and portals.",
            ]}
          />
        </Section>
      </>
    ),
    "account-and-security": (
      <>
        <Section title="Account and Security Settings">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Security settings protect sensitive student and financial data. Here, you manage password policies, two-factor authentication (if available), and session timeouts.
          </p>
          <ImagePlaceholder description="Security settings tab showing password reset and session controls." />
        </Section>
        <Section title="Best Practices">
          <BulletList
            items={[
              "Enforce strong password requirements for all staff accounts.",
              "Regularly review active sessions and revoke access from unknown devices.",
              "Ensure staff know how to securely log out of shared devices.",
            ]}
          />
        </Section>
      </>
    ),
    "customize-notification": (
      <>
        <Section title="Customizing Notifications">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Notification preferences allow you to control the volume and type of alerts your admin team receives via email, SMS, or push notifications.
          </p>
          <ImagePlaceholder description="Notification settings matrix allowing toggles for different event types." />
        </Section>
        <Section title="Configuration">
          <NumberedList
            items={[
              "Go to 'Settings > Notifications'.",
              "Toggle alerts for key events like 'New Lead', 'Payment Received', or 'Message from Parent'.",
              "Adjust frequency (e.g., immediate vs. daily digest) to avoid alert fatigue.",
            ]}
          />
        </Section>
      </>
    ),
    "manage-public-links": (
      <>
        <Section title="Managing Public Links">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Public links are URLs you can share on your website or social media to allow parents to book tours, submit inquiries, or apply for admission.
          </p>
          <ImagePlaceholder description="Public links dashboard showing URLs for Tours and Inquiry Forms with copy buttons." />
        </Section>
        <Section title="Usage">
          <NumberedList
            items={[
              "Navigate to 'Settings > Public Links'.",
              "Copy the appropriate link (e.g., 'Book a Tour').",
              "Embed this link on your school's website or link it in your social media bios.",
              "Test the links periodically to ensure the forms are active and routing correctly.",
            ]}
          />
        </Section>
      </>
    ),
    "manage-admin-users": (
      <>
        <Section title="Managing Admin Users">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Control who has access to the administrative dashboard. You can add new admins, edit their permissions, or revoke access when staff leave.
          </p>
          <ImagePlaceholder description="Admin user list showing active users, their roles, and invite actions." />
        </Section>
        <Section title="User Management">
          <NumberedList
            items={[
              "Go to 'Settings > Admin Users'.",
              "Click 'Invite Admin' to send an email invitation to a new team member.",
              "Assign an appropriate role (e.g., Super Admin, Finance Admin) to restrict access to sensitive modules.",
              "Use the deactivate or delete actions immediately when an admin's employment ends.",
            ]}
          />
        </Section>
      </>
    ),
    "setup-payment-methods": (
      <>
        <Section title="Setting Up Payment Methods">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Configure how your school accepts payments. This module integrates with payment gateways to allow parents to pay invoices online securely.
          </p>
          <ImagePlaceholder description="Payment gateway configuration screen showing connected bank accounts and processing fee settings." />
        </Section>
        <Section title="Configuration Steps">
          <NumberedList
            items={[
              "Navigate to 'Settings > Payment Methods'.",
              "Follow the prompts to connect your school's bank account via the supported payment processor.",
              "Decide whether to absorb processing fees or pass them on to parents.",
              "Run a small test transaction to verify funds deposit correctly before launching to all parents.",
            ]}
          />
        </Section>
      </>
    ),
  },
  "parent-dashboard": {
    "understanding-my-dashboard": (
      <>
        <Section title="Navigating the Parent Dashboard">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            The Parent Dashboard is designed to give you a quick overview of your child's day, upcoming events, and any outstanding tasks like unpaid invoices or unread messages.
          </p>
          <ImagePlaceholder description="Parent dashboard home screen showing recent activities, an outstanding invoice alert, and quick links." />
        </Section>
        <Section title="Key Areas">
          <BulletList
            items={[
              "Activity Feed: A timeline of photos, meals, and naps recorded by the teachers today.",
              "Alerts: Urgent notifications, such as new messages from the school or pending payments.",
              "Quick Actions: Easy access to message a teacher or view the full calendar.",
            ]}
          />
        </Section>
      </>
    ),
    "my-childs-profile-and-management": (
      <>
        <Section title="Managing Your Child's Profile">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Keep your child's information up-to-date to ensure the school can provide the best care. You can update medical information, emergency contacts, and authorized pickups here.
          </p>
          <ImagePlaceholder description="Child profile view in the parent app showing tabs for Medical, Contacts, and Documents." />
        </Section>
        <Section title="How to Update Information">
          <NumberedList
            items={[
              "Go to 'My Children' and select your child's profile.",
              "Navigate to the relevant tab (e.g., Emergency Contacts).",
              "Add or edit the contact details.",
              "Note: Some critical changes, like medical conditions, may require school approval before becoming fully active.",
            ]}
          />
        </Section>
      </>
    ),
    "my-childs-activities": (
      <>
        <Section title="Viewing Daily Activities">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Stay connected with your child's day by viewing real-time updates. The Activities section provides a detailed log of everything from learning milestones to lunch.
          </p>
          <ImagePlaceholder description="Detailed activity log filtered by date, showing a mix of photos and routine logs." />
        </Section>
        <Section title="Features">
          <BulletList
            items={[
              "Filter by Date: Look back at previous days to see routines and shared photos.",
              "Save Media: Download photos shared by the teachers directly to your device.",
              "Learning Updates: View notes from teachers regarding academic or developmental progress.",
            ]}
          />
        </Section>
      </>
    ),
    "messaging-and-announcements": (
      <>
        <Section title="Communication Tools">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Communication is key to a strong school-home partnership. Use the messaging center to contact teachers directly, and check announcements for school-wide news.
          </p>
          <ImagePlaceholder description="Messaging inbox and announcements board in the parent app." />
        </Section>
        <Section title="Using Messaging">
          <NumberedList
            items={[
              "Go to the 'Messages' tab.",
              "Start a new conversation or reply to an existing thread.",
              "Messages are routed to the appropriate staff members based on your child's classroom.",
              "Check the 'Announcements' tab regularly for newsletters and school closure notices.",
            ]}
          />
        </Section>
      </>
    ),
    "manage-my-invoices": (
      <>
        <Section title="Handling Billing and Payments">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            View your billing history, download receipts, and pay outstanding invoices securely through the app.
          </p>
          <ImagePlaceholder description="Billing summary screen showing current balance, recent invoices, and a 'Pay Now' button." />
        </Section>
        <Section title="Making a Payment">
          <NumberedList
            items={[
              "Navigate to 'Billing'.",
              "Select an outstanding invoice to view the itemized charges.",
              "Tap 'Pay Now' to enter your credit card or bank details securely.",
              "Once processed, you can download a PDF receipt for your records or tax purposes.",
            ]}
          />
        </Section>
      </>
    ),
    "manage-my-profile": (
      <>
        <Section title="Updating Your Parent Profile">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            Ensure the school can reach you by keeping your personal contact information current.
          </p>
          <ImagePlaceholder description="Parent profile settings showing email, phone number, and password update fields." />
        </Section>
        <Section title="Profile Management">
          <NumberedList
            items={[
              "Go to your account settings.",
              "Update your phone number or email address as needed.",
              "You can also change your login password from this screen.",
            ]}
          />
        </Section>
      </>
    ),
    "add-app-link-to-home-screen": (
      <>
        <Section title="Quick Access: Add to Home Screen">
          <p className="text-sm text-[#475467] leading-relaxed mb-4">
            For the best experience, add the Parent Dashboard to your phone's home screen. This makes it function like a native app.
          </p>
          <ImagePlaceholder description="Visual instructions for iOS (Share > Add to Home Screen) and Android (Menu > Add to Home Screen)." />
        </Section>
        <Section title="Instructions">
          <NumberedList
            items={[
              "Open the Parent Dashboard in your mobile browser (Safari for iOS, Chrome for Android).",
              "On iOS: Tap the 'Share' icon at the bottom, scroll down, and tap 'Add to Home Screen'.",
              "On Android: Tap the three dots (menu) in the top right corner and tap 'Add to Home screen'.",
              "The app icon will now appear alongside your other apps for quick access.",
            ]}
          />
        </Section>
      </>
    ),
  }

};

export function getDefaultTopicContent(topicLabel: string) {
  return (
    <>
      <Section title={topicLabel}>
        <p className="text-sm text-[#475467] leading-relaxed mb-4">
          This guide section is currently being written by our education experts. We are building
          out comprehensive, step-by-step workflows to ensure you get the most out of this platform.
          Please check back later.
        </p>
        <SubSection title="What to expect in this guide:">
          <BulletList
            items={[
              "Detailed explanation of what this feature does and when to use it.",
              "The architectural logic of how it connects to other parts of the platform.",
              "Step-by-step best practices for Admin, Staff, and Parent roles.",
              "Common pitfalls and how to troubleshoot them without calling support.",
            ]}
          />
        </SubSection>
        <ImagePlaceholder description={`${topicLabel} Interface Concept`} />
      </Section>
    </>
  );
}
