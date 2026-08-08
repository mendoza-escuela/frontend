import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy, Suspense, type ReactNode } from "react";
import { ProtectedRoute } from "../components/auth/ProtectedRoute";
import { AdminLayout } from "../components/layout/AdminLayout";
import { AppLayout } from "../components/layout/AppLayout";
import { SchoolLayout } from "../components/layout/SchoolLayout";
const AccessDeniedPage = lazy(() =>
  import("../pages/AccessDeniedPage").then((module) => ({
    default: module.AccessDeniedPage,
  })),
);
const ChangePasswordPage = lazy(() =>
  import("../pages/ChangePasswordPage").then((module) => ({
    default: module.ChangePasswordPage,
  })),
);
const ForgotPasswordPage = lazy(() =>
  import("../pages/ForgotPasswordPage").then((module) => ({
    default: module.ForgotPasswordPage,
  })),
);
const HomePage = lazy(() =>
  import("../pages/HomePage").then((module) => ({
    default: module.HomePage,
  })),
);
const LoginPage = lazy(() =>
  import("../pages/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);
const ResetPasswordPage = lazy(() =>
  import("../pages/ResetPasswordPage").then((module) => ({
    default: module.ResetPasswordPage,
  })),
);
const AdminHomePage = lazy(() =>
  import("../pages/admin/AdminHomePage").then((module) => ({
    default: module.AdminHomePage,
  })),
);
const BulkUserImportPage = lazy(() =>
  import("../pages/admin/BulkUserImportPage").then((module) => ({
    default: module.BulkUserImportPage,
  })),
);
const UserFormPage = lazy(() =>
  import("../pages/admin/UserFormPage").then((module) => ({
    default: module.UserFormPage,
  })),
);
const UsersAdminPage = lazy(() =>
  import("../pages/admin/UsersAdminPage").then((module) => ({
    default: module.UsersAdminPage,
  })),
);
const SchoolsAdminPage = lazy(() =>
  import("../pages/admin/SchoolsAdminPage").then((module) => ({
    default: module.SchoolsAdminPage,
  })),
);
const SchoolFormPage = lazy(() =>
  import("../pages/admin/SchoolFormPage").then((module) => ({
    default: module.SchoolFormPage,
  })),
);
const SchoolDetailPage = lazy(() =>
  import("../pages/admin/SchoolDetailPage").then((module) => ({
    default: module.SchoolDetailPage,
  })),
);
const BulkSchoolImportPage = lazy(() =>
  import("../pages/admin/BulkSchoolImportPage").then((module) => ({
    default: module.BulkSchoolImportPage,
  })),
);
const SurveysAdminPage = lazy(() =>
  import("../pages/admin/SurveysAdminPage").then((module) => ({
    default: module.SurveysAdminPage,
  })),
);
const SurveyFormPage = lazy(() =>
  import("../pages/admin/SurveyFormPage").then((module) => ({
    default: module.SurveyFormPage,
  })),
);
const SurveyDetailPage = lazy(() =>
  import("../pages/admin/SurveyDetailPage").then((module) => ({
    default: module.SurveyDetailPage,
  })),
);
const SurveyVersionEditorPage = lazy(() =>
  import("../pages/admin/SurveyVersionEditorPage").then((module) => ({
    default: module.SurveyVersionEditorPage,
  })),
);
const SurveyVersionPreviewPage = lazy(() =>
  import("../pages/admin/SurveyVersionPreviewPage").then((module) => ({
    default: module.SurveyVersionPreviewPage,
  })),
);
const SurveyVersionComparePage = lazy(() =>
  import("../pages/admin/SurveyVersionComparePage").then((module) => ({
    default: module.SurveyVersionComparePage,
  })),
);
const SurveyImportPage = lazy(() =>
  import("../pages/admin/SurveyImportPage").then((module) => ({
    default: module.SurveyImportPage,
  })),
);
const SurveyApplicabilityRulesPage = lazy(() =>
  import("../pages/admin/SurveyApplicabilityRulesPage").then((module) => ({
    default: module.SurveyApplicabilityRulesPage,
  })),
);
const CampaignsAdminPage = lazy(() =>
  import("../pages/admin/CampaignsAdminPage").then((module) => ({
    default: module.CampaignsAdminPage,
  })),
);
const CampaignFormPage = lazy(() =>
  import("../pages/admin/CampaignFormPage").then((module) => ({
    default: module.CampaignFormPage,
  })),
);
const ParticipationDashboardPage = lazy(() =>
  import("../pages/admin/ParticipationDashboardPage").then((module) => ({
    default: module.ParticipationDashboardPage,
  })),
);
const EvaluationConfigurationsPage = lazy(() =>
  import("../pages/admin/EvaluationConfigurationsPage").then((module) => ({
    default: module.EvaluationConfigurationsPage,
  })),
);
const CampaignTrackingPage = lazy(() =>
  import("../pages/admin/CampaignTrackingPage").then((module) => ({
    default: module.CampaignTrackingPage,
  })),
);
const AdminSchoolResultDetailPage = lazy(() =>
  import("../pages/admin/AdminSchoolResultDetailPage").then((module) => ({
    default: module.AdminSchoolResultDetailPage,
  })),
);
const SchoolHomePage = lazy(() =>
  import("../pages/school/SchoolHomePage").then((module) => ({
    default: module.SchoolHomePage,
  })),
);
const SchoolProfilePage = lazy(() =>
  import("../pages/school/SchoolProfilePage").then((module) => ({
    default: module.SchoolProfilePage,
  })),
);
const SchoolSurveyPage = lazy(() =>
  import("../pages/school/SchoolSurveyPage").then((module) => ({
    default: module.SchoolSurveyPage,
  })),
);
const SchoolResultsPage = lazy(() =>
  import("../pages/school/SchoolResultsPage").then((module) => ({
    default: module.SchoolResultsPage,
  })),
);

function lazyPage(page: ReactNode) {
  return (
    <Suspense
      fallback={<div className="p-8 text-mendoza-blue">Cargando módulo…</div>}
    >
      {page}
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: lazyPage(<HomePage />) },
      { path: "login", element: lazyPage(<LoginPage />) },
      { path: "recuperar-clave", element: lazyPage(<ForgotPasswordPage />) },
      {
        path: "restablecer-clave",
        element: lazyPage(<ResetPasswordPage />),
      },
    ],
  },
  {
    element: <ProtectedRoute allowPasswordChange />,
    children: [
      { path: "cambiar-clave", element: lazyPage(<ChangePasswordPage />) },
      { path: "acceso-denegado", element: lazyPage(<AccessDeniedPage />) },
    ],
  },
  {
    element: <ProtectedRoute roles={["admin"]} />,
    children: [
      {
        path: "admin",
        element: <AdminLayout />,
        children: [
          { index: true, element: lazyPage(<AdminHomePage />) },
          {
            path: "participacion",
            element: lazyPage(<ParticipationDashboardPage />),
          },
          {
            path: "configuracion-evaluacion",
            element: lazyPage(<EvaluationConfigurationsPage />),
          },
          { path: "usuarios", element: lazyPage(<UsersAdminPage />) },
          { path: "usuarios/nuevo", element: lazyPage(<UserFormPage />) },
          { path: "usuarios/:id/editar", element: lazyPage(<UserFormPage />) },
          {
            path: "usuarios/importar",
            element: lazyPage(<BulkUserImportPage />),
          },
          { path: "colegios", element: lazyPage(<SchoolsAdminPage />) },
          { path: "colegios/nuevo", element: lazyPage(<SchoolFormPage />) },
          {
            path: "colegios/importar",
            element: lazyPage(<BulkSchoolImportPage />),
          },
          { path: "colegios/:id", element: lazyPage(<SchoolDetailPage />) },
          {
            path: "colegios/:id/editar",
            element: lazyPage(<SchoolFormPage />),
          },
          { path: "cuestionarios", element: lazyPage(<SurveysAdminPage />) },
          {
            path: "cuestionarios/nuevo",
            element: lazyPage(<SurveyFormPage />),
          },
          {
            path: "cuestionarios/:id/editar",
            element: lazyPage(<SurveyFormPage />),
          },
          {
            path: "cuestionarios/:surveyId/versiones/:versionId/editar",
            element: lazyPage(<SurveyVersionEditorPage />),
          },
          {
            path: "cuestionarios/:surveyId/versiones/:versionId/vista-previa",
            element: lazyPage(<SurveyVersionPreviewPage />),
          },
          {
            path: "cuestionarios/:surveyId/versiones/:versionId/reglas",
            element: lazyPage(<SurveyApplicabilityRulesPage />),
          },
          {
            path: "cuestionarios/:surveyId/comparar",
            element: lazyPage(<SurveyVersionComparePage />),
          },
          {
            path: "cuestionarios/:surveyId/importar",
            element: lazyPage(<SurveyImportPage />),
          },
          {
            path: "cuestionarios/:id",
            element: lazyPage(<SurveyDetailPage />),
          },
          {
            path: "campanas",
            element: lazyPage(<CampaignsAdminPage />),
          },
          {
            path: "campanas/nueva",
            element: lazyPage(<CampaignFormPage />),
          },
          {
            path: "campanas/:id/editar",
            element: lazyPage(<CampaignFormPage />),
          },
          {
            path: "seguimiento",
            element: lazyPage(<CampaignTrackingPage />),
          },
          {
            path: "campanas/:campaignId/colegios/:schoolId/resultado",
            element: lazyPage(<AdminSchoolResultDetailPage />),
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={["school"]} />,
    children: [
      {
        path: "colegio",
        element: <SchoolLayout />,
        children: [
          { index: true, element: lazyPage(<SchoolHomePage />) },
          {
            path: "establecimiento",
            element: lazyPage(<SchoolProfilePage />),
          },
          {
            path: "cuestionario",
            element: lazyPage(<SchoolSurveyPage />),
          },
          {
            path: "resultados",
            element: lazyPage(<SchoolResultsPage />),
          },
          {
            path: "resultados/:campaignId",
            element: lazyPage(<SchoolResultsPage />),
          },
        ],
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
