/**
 * Routes where the shell {@link Header} should be hidden on small viewports so the page
 * can use its own full-width chrome (same idea as the mobile {@link ChatModal} drawer).
 */
export function shouldHideMobileDashboardHeader(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  const normalized = pathname.replace(/\/$/, "") || pathname;

  // Grading: detail view or grade editor
  if (/\/learning\/grading\/[^/]+\/grade$/.test(normalized)) return true;
  if (/\/learning\/grading\/[^/]+$/.test(normalized)) return true;

  // /admin|staff/learning/curriculum/:id — exclude static segments
  const curriculumMatch = /^\/(admin|staff)\/learning\/curriculum\/([^/]+)$/.exec(normalized);
  if (curriculumMatch) {
    const slug = curriculumMatch[2];
    if (["create", "templates", "my-library"].includes(slug)) return false;
    return true;
  }

  if (/\/billing\/invoices\/[^/]+\/view$/.test(normalized)) return true;
  if (/\/parent\/invoicing\/invoices\/[^/]+\/view$/.test(normalized)) return true;

  // Create / edit invoice (full-height form)
  if (/\/billing\/invoices\/create$/.test(normalized)) return true;
  if (/\/billing\/invoices\/[^/]+\/edit$/.test(normalized)) return true;

  // Attendance child / teacher profile (admin or staff)
  if (/\/attendance\/[^/]+\/(child|teacher)$/.test(normalized)) return true;
  if (/\/(staff|parent)\/communication\/announcement\/[^/]+$/.test(normalized)) return true;
  // Child details (admin/staff)
  if (/^\/(admin|staff)\/children\/[^/]+(\/profile)?$/.test(normalized)) return true;
  // Teacher details (admin)
  if (/^\/admin\/teachers\/[^/]+(\/view)?$/.test(normalized)) return true;
  // Parent details (admin)
  if (/^\/admin\/parents\/[^/]+$/.test(normalized)) return true;
  // Classroom details (admin)
  if (/^\/admin\/rooms\/classes\/[^/]+(\/view)?$/.test(normalized)) return true;
  // Subject details (admin)
  if (/^\/admin\/learning\/subjects\/[^/]+$/.test(normalized)) return true;
  // Learning report details (admin/staff/parent)
  if (/^\/(admin|staff|parent)\/learning\/report\/[^/]+$/.test(normalized)) return true;

  return false;
}
