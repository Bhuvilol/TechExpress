import { Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout.jsx';
import { AdminShell } from './components/layout/AdminShell.jsx';
import { CoordinatorShell } from './components/layout/CoordinatorShell.jsx';
import { RequireAuth, RedirectIfAuth } from './components/layout/RouteGuards.jsx';

import { HomePage }            from './pages/public/HomePage.jsx';
import { LoginPage }           from './pages/public/LoginPage.jsx';
import { RegistrationPage }    from './pages/public/RegistrationPage.jsx';
import { LeaderboardPage }     from './pages/public/LeaderboardPage.jsx';
import { AwardsPage }          from './pages/public/AwardsPage.jsx';
import { ProblemStatementsPage } from './pages/public/ProblemStatementsPage.jsx';

import { DashboardPage }       from './pages/student/DashboardPage.jsx';
import { TeamFormationPage }   from './pages/student/TeamFormationPage.jsx';

import { JuryDashboardPage }   from './pages/jury/JuryDashboardPage.jsx';

import { AdminOverviewPage }     from './pages/admin/AdminOverviewPage.jsx';
import { AdminVerificationPage } from './pages/admin/AdminVerificationPage.jsx';
import { AdminTeamsPage }        from './pages/admin/AdminTeamsPage.jsx';
import { AdminRulesPage }        from './pages/admin/AdminRulesPage.jsx';
import { AdminRoundsPage }       from './pages/admin/AdminRoundsPage.jsx';
import { AdminTaxonomyPage }     from './pages/admin/AdminTaxonomyPage.jsx';
import { AdminBroadcastPage }    from './pages/admin/AdminBroadcastPage.jsx';
import { AdminAuditPage }        from './pages/admin/AdminAuditPage.jsx';
import { AdminTestingPage }      from './pages/admin/AdminTestingPage.jsx';
import { CoordinatorVerificationPage } from './pages/coordinator/CoordinatorVerificationPage.jsx';

export const App = () => (
  <Routes>
    <Route element={<AppLayout />}>
      <Route path="/" element={<HomePage />} />

      <Route path="/login"    element={<RedirectIfAuth><LoginPage /></RedirectIfAuth>} />
      <Route path="/register" element={<RedirectIfAuth><RegistrationPage /></RedirectIfAuth>} />

      <Route path="/leaderboard"        element={<LeaderboardPage />} />
      <Route path="/awards"             element={<AwardsPage />} />
      <Route path="/problem-statements" element={<ProblemStatementsPage />} />

      <Route path="/dashboard" element={<RequireAuth role="STUDENT"><DashboardPage /></RequireAuth>} />
      <Route path="/teams"     element={<RequireAuth role="STUDENT"><TeamFormationPage /></RequireAuth>} />
      <Route path="/jury"      element={<RequireAuth role="JURY"><JuryDashboardPage /></RequireAuth>} />
    </Route>

    <Route element={<RequireAuth role="ADMIN"><AdminShell /></RequireAuth>}>
      <Route path="/admin"               element={<AdminOverviewPage />} />
      <Route path="/admin/verification"  element={<AdminVerificationPage />} />
      <Route path="/admin/teams"         element={<AdminTeamsPage />} />
      <Route path="/admin/rules"         element={<AdminRulesPage />} />
      <Route path="/admin/rounds"        element={<AdminRoundsPage />} />
      <Route path="/admin/taxonomy"      element={<AdminTaxonomyPage />} />
      <Route path="/admin/broadcast"     element={<AdminBroadcastPage />} />
      <Route path="/admin/audit"         element={<AdminAuditPage />} />
      <Route path="/admin/testing"       element={<AdminTestingPage />} />
    </Route>

    <Route element={<RequireAuth role="COORDINATOR"><CoordinatorShell /></RequireAuth>}>
      <Route path="/coordinator" element={<CoordinatorVerificationPage />} />
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);
