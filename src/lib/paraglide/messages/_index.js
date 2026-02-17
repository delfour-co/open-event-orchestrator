/* eslint-disable */
import { getLocale, experimentalStaticLocale } from "../runtime.js"

/** @typedef {import('../runtime.js').LocalizedString} LocalizedString */
/** @typedef {{}} Common_App_NameInputs */
/** @typedef {{}} Common_App_Short_NameInputs */
/** @typedef {{}} Nav_DashboardInputs */
/** @typedef {{}} Nav_OrganizationsInputs */
/** @typedef {{}} Nav_EventsInputs */
/** @typedef {{}} Nav_CfpInputs */
/** @typedef {{}} Nav_PlanningInputs */
/** @typedef {{}} Nav_Attendee_AppInputs */
/** @typedef {{}} Nav_BillingInputs */
/** @typedef {{}} Nav_SponsoringInputs */
/** @typedef {{}} Nav_BudgetInputs */
/** @typedef {{}} Nav_CrmInputs */
/** @typedef {{}} Nav_EmailsInputs */
/** @typedef {{}} Nav_ReportingInputs */
/** @typedef {{}} Nav_ApiInputs */
/** @typedef {{}} Nav_SettingsInputs */
/** @typedef {{}} Sidebar_ExpandInputs */
/** @typedef {{}} Sidebar_CollapseInputs */
/** @typedef {{}} Header_NotificationsInputs */
/** @typedef {{}} Header_Toggle_MenuInputs */
/** @typedef {{}} Header_LogoutInputs */
/** @typedef {{}} Header_Toggle_ThemeInputs */
/** @typedef {{}} Section_DashboardInputs */
/** @typedef {{}} Section_OrganizationsInputs */
/** @typedef {{}} Section_EventsInputs */
/** @typedef {{}} Section_EditionsInputs */
/** @typedef {{}} Section_CfpInputs */
/** @typedef {{}} Section_PlanningInputs */
/** @typedef {{}} Section_Attendee_AppInputs */
/** @typedef {{}} Section_BillingInputs */
/** @typedef {{}} Section_SponsoringInputs */
/** @typedef {{}} Section_BudgetInputs */
/** @typedef {{}} Section_CrmInputs */
/** @typedef {{}} Section_EmailsInputs */
/** @typedef {{}} Section_ReportingInputs */
/** @typedef {{}} Section_ApiInputs */
/** @typedef {{}} Section_SettingsInputs */
/** @typedef {{}} Action_SaveInputs */
/** @typedef {{}} Action_CancelInputs */
/** @typedef {{}} Action_DeleteInputs */
/** @typedef {{}} Action_EditInputs */
/** @typedef {{}} Action_CreateInputs */
/** @typedef {{}} Action_AddInputs */
/** @typedef {{}} Action_RemoveInputs */
/** @typedef {{}} Action_UpdateInputs */
/** @typedef {{}} Action_SearchInputs */
/** @typedef {{}} Action_FilterInputs */
/** @typedef {{}} Action_ExportInputs */
/** @typedef {{}} Action_ImportInputs */
/** @typedef {{}} Action_DownloadInputs */
/** @typedef {{}} Action_UploadInputs */
/** @typedef {{}} Action_SubmitInputs */
/** @typedef {{}} Action_ConfirmInputs */
/** @typedef {{}} Action_CloseInputs */
/** @typedef {{}} Action_BackInputs */
/** @typedef {{}} Action_NextInputs */
/** @typedef {{}} Action_PreviousInputs */
/** @typedef {{}} Action_RefreshInputs */
/** @typedef {{}} Action_ResetInputs */
/** @typedef {{}} Action_ViewInputs */
/** @typedef {{}} Action_CopyInputs */
/** @typedef {{}} Action_DuplicateInputs */
/** @typedef {{}} Action_ArchiveInputs */
/** @typedef {{}} Action_RestoreInputs */
/** @typedef {{}} Status_LoadingInputs */
/** @typedef {{}} Status_SavingInputs */
/** @typedef {{}} Status_DeletingInputs */
/** @typedef {{}} Status_SuccessInputs */
/** @typedef {{}} Status_ErrorInputs */
/** @typedef {{}} Status_WarningInputs */
/** @typedef {{}} Status_InfoInputs */
/** @typedef {{}} Status_PendingInputs */
/** @typedef {{}} Status_ActiveInputs */
/** @typedef {{}} Status_InactiveInputs */
/** @typedef {{}} Status_DraftInputs */
/** @typedef {{}} Status_PublishedInputs */
/** @typedef {{}} Status_ArchivedInputs */
/** @typedef {{}} Message_Saved_SuccessfullyInputs */
/** @typedef {{}} Message_Deleted_SuccessfullyInputs */
/** @typedef {{}} Message_Created_SuccessfullyInputs */
/** @typedef {{}} Message_Updated_SuccessfullyInputs */
/** @typedef {{}} Message_Error_GenericInputs */
/** @typedef {{}} Message_Error_Not_FoundInputs */
/** @typedef {{}} Message_Error_UnauthorizedInputs */
/** @typedef {{}} Message_Error_ValidationInputs */
/** @typedef {{}} Message_Confirm_DeleteInputs */
/** @typedef {{}} Message_No_ResultsInputs */
/** @typedef {{}} Message_No_DataInputs */
/** @typedef {{}} Form_RequiredInputs */
/** @typedef {{}} Form_Invalid_EmailInputs */
/** @typedef {{}} Form_Invalid_UrlInputs */
/** @typedef {{ min: NonNullable<unknown> }} Form_Min_LengthInputs */
/** @typedef {{ max: NonNullable<unknown> }} Form_Max_LengthInputs */
/** @typedef {{ min: NonNullable<unknown> }} Form_Min_ValueInputs */
/** @typedef {{ max: NonNullable<unknown> }} Form_Max_ValueInputs */
/** @typedef {{}} Pagination_PageInputs */
/** @typedef {{}} Pagination_OfInputs */
/** @typedef {{}} Pagination_Items_Per_PageInputs */
/** @typedef {{ from: NonNullable<unknown>, to: NonNullable<unknown>, total: NonNullable<unknown> }} Pagination_ShowingInputs */
/** @typedef {{}} Pagination_FirstInputs */
/** @typedef {{}} Pagination_LastInputs */
/** @typedef {{}} Time_TodayInputs */
/** @typedef {{}} Time_YesterdayInputs */
/** @typedef {{}} Time_TomorrowInputs */
/** @typedef {{ count: NonNullable<unknown> }} Time_Days_AgoInputs */
/** @typedef {{ count: NonNullable<unknown> }} Time_Hours_AgoInputs */
/** @typedef {{ count: NonNullable<unknown> }} Time_Minutes_AgoInputs */
/** @typedef {{}} Auth_LoginInputs */
/** @typedef {{}} Auth_LogoutInputs */
/** @typedef {{}} Auth_RegisterInputs */
/** @typedef {{}} Auth_EmailInputs */
/** @typedef {{}} Auth_PasswordInputs */
/** @typedef {{}} Auth_Forgot_PasswordInputs */
/** @typedef {{}} Auth_Remember_MeInputs */
/** @typedef {{}} Language_Selector_LabelInputs */
/** @typedef {{}} Language_EnglishInputs */
/** @typedef {{}} Language_FrenchInputs */
import * as __en from "./en.js"
import * as __fr from "./fr.js"
/**
* | output |
* | --- |
* | "Open Event Orchestrator" |
*
* @param {Common_App_NameInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const common_app_name = /** @type {((inputs?: Common_App_NameInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_App_NameInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.common_app_name(inputs)
	return __fr.common_app_name(inputs)
});
/**
* | output |
* | --- |
* | "OEO" |
*
* @param {Common_App_Short_NameInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const common_app_short_name = /** @type {((inputs?: Common_App_Short_NameInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Common_App_Short_NameInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.common_app_short_name(inputs)
	return __fr.common_app_short_name(inputs)
});
/**
* | output |
* | --- |
* | "Dashboard" |
*
* @param {Nav_DashboardInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const nav_dashboard = /** @type {((inputs?: Nav_DashboardInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_DashboardInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.nav_dashboard(inputs)
	return __fr.nav_dashboard(inputs)
});
/**
* | output |
* | --- |
* | "Organizations" |
*
* @param {Nav_OrganizationsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const nav_organizations = /** @type {((inputs?: Nav_OrganizationsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_OrganizationsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.nav_organizations(inputs)
	return __fr.nav_organizations(inputs)
});
/**
* | output |
* | --- |
* | "Events" |
*
* @param {Nav_EventsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const nav_events = /** @type {((inputs?: Nav_EventsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_EventsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.nav_events(inputs)
	return __fr.nav_events(inputs)
});
/**
* | output |
* | --- |
* | "CFP" |
*
* @param {Nav_CfpInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const nav_cfp = /** @type {((inputs?: Nav_CfpInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_CfpInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.nav_cfp(inputs)
	return __fr.nav_cfp(inputs)
});
/**
* | output |
* | --- |
* | "Planning" |
*
* @param {Nav_PlanningInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const nav_planning = /** @type {((inputs?: Nav_PlanningInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_PlanningInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.nav_planning(inputs)
	return __fr.nav_planning(inputs)
});
/**
* | output |
* | --- |
* | "Attendee App" |
*
* @param {Nav_Attendee_AppInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const nav_attendee_app = /** @type {((inputs?: Nav_Attendee_AppInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_Attendee_AppInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.nav_attendee_app(inputs)
	return __fr.nav_attendee_app(inputs)
});
/**
* | output |
* | --- |
* | "Billing" |
*
* @param {Nav_BillingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const nav_billing = /** @type {((inputs?: Nav_BillingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_BillingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.nav_billing(inputs)
	return __fr.nav_billing(inputs)
});
/**
* | output |
* | --- |
* | "Sponsoring" |
*
* @param {Nav_SponsoringInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const nav_sponsoring = /** @type {((inputs?: Nav_SponsoringInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_SponsoringInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.nav_sponsoring(inputs)
	return __fr.nav_sponsoring(inputs)
});
/**
* | output |
* | --- |
* | "Budget" |
*
* @param {Nav_BudgetInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const nav_budget = /** @type {((inputs?: Nav_BudgetInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_BudgetInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.nav_budget(inputs)
	return __fr.nav_budget(inputs)
});
/**
* | output |
* | --- |
* | "CRM" |
*
* @param {Nav_CrmInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const nav_crm = /** @type {((inputs?: Nav_CrmInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_CrmInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.nav_crm(inputs)
	return __fr.nav_crm(inputs)
});
/**
* | output |
* | --- |
* | "Emails" |
*
* @param {Nav_EmailsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const nav_emails = /** @type {((inputs?: Nav_EmailsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_EmailsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.nav_emails(inputs)
	return __fr.nav_emails(inputs)
});
/**
* | output |
* | --- |
* | "Reporting" |
*
* @param {Nav_ReportingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const nav_reporting = /** @type {((inputs?: Nav_ReportingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_ReportingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.nav_reporting(inputs)
	return __fr.nav_reporting(inputs)
});
/**
* | output |
* | --- |
* | "API" |
*
* @param {Nav_ApiInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const nav_api = /** @type {((inputs?: Nav_ApiInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_ApiInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.nav_api(inputs)
	return __fr.nav_api(inputs)
});
/**
* | output |
* | --- |
* | "Settings" |
*
* @param {Nav_SettingsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const nav_settings = /** @type {((inputs?: Nav_SettingsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Nav_SettingsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.nav_settings(inputs)
	return __fr.nav_settings(inputs)
});
/**
* | output |
* | --- |
* | "Expand sidebar" |
*
* @param {Sidebar_ExpandInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const sidebar_expand = /** @type {((inputs?: Sidebar_ExpandInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_ExpandInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_expand(inputs)
	return __fr.sidebar_expand(inputs)
});
/**
* | output |
* | --- |
* | "Collapse sidebar" |
*
* @param {Sidebar_CollapseInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const sidebar_collapse = /** @type {((inputs?: Sidebar_CollapseInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Sidebar_CollapseInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.sidebar_collapse(inputs)
	return __fr.sidebar_collapse(inputs)
});
/**
* | output |
* | --- |
* | "Notifications" |
*
* @param {Header_NotificationsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const header_notifications = /** @type {((inputs?: Header_NotificationsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Header_NotificationsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.header_notifications(inputs)
	return __fr.header_notifications(inputs)
});
/**
* | output |
* | --- |
* | "Toggle menu" |
*
* @param {Header_Toggle_MenuInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const header_toggle_menu = /** @type {((inputs?: Header_Toggle_MenuInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Header_Toggle_MenuInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.header_toggle_menu(inputs)
	return __fr.header_toggle_menu(inputs)
});
/**
* | output |
* | --- |
* | "Logout" |
*
* @param {Header_LogoutInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const header_logout = /** @type {((inputs?: Header_LogoutInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Header_LogoutInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.header_logout(inputs)
	return __fr.header_logout(inputs)
});
/**
* | output |
* | --- |
* | "Toggle theme" |
*
* @param {Header_Toggle_ThemeInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const header_toggle_theme = /** @type {((inputs?: Header_Toggle_ThemeInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Header_Toggle_ThemeInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.header_toggle_theme(inputs)
	return __fr.header_toggle_theme(inputs)
});
/**
* | output |
* | --- |
* | "Dashboard" |
*
* @param {Section_DashboardInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const section_dashboard = /** @type {((inputs?: Section_DashboardInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Section_DashboardInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.section_dashboard(inputs)
	return __fr.section_dashboard(inputs)
});
/**
* | output |
* | --- |
* | "Organizations" |
*
* @param {Section_OrganizationsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const section_organizations = /** @type {((inputs?: Section_OrganizationsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Section_OrganizationsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.section_organizations(inputs)
	return __fr.section_organizations(inputs)
});
/**
* | output |
* | --- |
* | "Events" |
*
* @param {Section_EventsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const section_events = /** @type {((inputs?: Section_EventsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Section_EventsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.section_events(inputs)
	return __fr.section_events(inputs)
});
/**
* | output |
* | --- |
* | "Editions" |
*
* @param {Section_EditionsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const section_editions = /** @type {((inputs?: Section_EditionsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Section_EditionsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.section_editions(inputs)
	return __fr.section_editions(inputs)
});
/**
* | output |
* | --- |
* | "Call for Papers" |
*
* @param {Section_CfpInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const section_cfp = /** @type {((inputs?: Section_CfpInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Section_CfpInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.section_cfp(inputs)
	return __fr.section_cfp(inputs)
});
/**
* | output |
* | --- |
* | "Planning" |
*
* @param {Section_PlanningInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const section_planning = /** @type {((inputs?: Section_PlanningInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Section_PlanningInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.section_planning(inputs)
	return __fr.section_planning(inputs)
});
/**
* | output |
* | --- |
* | "Attendee App" |
*
* @param {Section_Attendee_AppInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const section_attendee_app = /** @type {((inputs?: Section_Attendee_AppInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Section_Attendee_AppInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.section_attendee_app(inputs)
	return __fr.section_attendee_app(inputs)
});
/**
* | output |
* | --- |
* | "Billing" |
*
* @param {Section_BillingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const section_billing = /** @type {((inputs?: Section_BillingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Section_BillingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.section_billing(inputs)
	return __fr.section_billing(inputs)
});
/**
* | output |
* | --- |
* | "Sponsoring" |
*
* @param {Section_SponsoringInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const section_sponsoring = /** @type {((inputs?: Section_SponsoringInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Section_SponsoringInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.section_sponsoring(inputs)
	return __fr.section_sponsoring(inputs)
});
/**
* | output |
* | --- |
* | "Budget" |
*
* @param {Section_BudgetInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const section_budget = /** @type {((inputs?: Section_BudgetInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Section_BudgetInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.section_budget(inputs)
	return __fr.section_budget(inputs)
});
/**
* | output |
* | --- |
* | "CRM" |
*
* @param {Section_CrmInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const section_crm = /** @type {((inputs?: Section_CrmInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Section_CrmInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.section_crm(inputs)
	return __fr.section_crm(inputs)
});
/**
* | output |
* | --- |
* | "Emails" |
*
* @param {Section_EmailsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const section_emails = /** @type {((inputs?: Section_EmailsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Section_EmailsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.section_emails(inputs)
	return __fr.section_emails(inputs)
});
/**
* | output |
* | --- |
* | "Reporting" |
*
* @param {Section_ReportingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const section_reporting = /** @type {((inputs?: Section_ReportingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Section_ReportingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.section_reporting(inputs)
	return __fr.section_reporting(inputs)
});
/**
* | output |
* | --- |
* | "API" |
*
* @param {Section_ApiInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const section_api = /** @type {((inputs?: Section_ApiInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Section_ApiInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.section_api(inputs)
	return __fr.section_api(inputs)
});
/**
* | output |
* | --- |
* | "Settings" |
*
* @param {Section_SettingsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const section_settings = /** @type {((inputs?: Section_SettingsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Section_SettingsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.section_settings(inputs)
	return __fr.section_settings(inputs)
});
/**
* | output |
* | --- |
* | "Save" |
*
* @param {Action_SaveInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_save = /** @type {((inputs?: Action_SaveInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_SaveInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_save(inputs)
	return __fr.action_save(inputs)
});
/**
* | output |
* | --- |
* | "Cancel" |
*
* @param {Action_CancelInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_cancel = /** @type {((inputs?: Action_CancelInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_CancelInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_cancel(inputs)
	return __fr.action_cancel(inputs)
});
/**
* | output |
* | --- |
* | "Delete" |
*
* @param {Action_DeleteInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_delete = /** @type {((inputs?: Action_DeleteInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_DeleteInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_delete(inputs)
	return __fr.action_delete(inputs)
});
/**
* | output |
* | --- |
* | "Edit" |
*
* @param {Action_EditInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_edit = /** @type {((inputs?: Action_EditInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_EditInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_edit(inputs)
	return __fr.action_edit(inputs)
});
/**
* | output |
* | --- |
* | "Create" |
*
* @param {Action_CreateInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_create = /** @type {((inputs?: Action_CreateInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_CreateInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_create(inputs)
	return __fr.action_create(inputs)
});
/**
* | output |
* | --- |
* | "Add" |
*
* @param {Action_AddInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_add = /** @type {((inputs?: Action_AddInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_AddInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_add(inputs)
	return __fr.action_add(inputs)
});
/**
* | output |
* | --- |
* | "Remove" |
*
* @param {Action_RemoveInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_remove = /** @type {((inputs?: Action_RemoveInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_RemoveInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_remove(inputs)
	return __fr.action_remove(inputs)
});
/**
* | output |
* | --- |
* | "Update" |
*
* @param {Action_UpdateInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_update = /** @type {((inputs?: Action_UpdateInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_UpdateInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_update(inputs)
	return __fr.action_update(inputs)
});
/**
* | output |
* | --- |
* | "Search" |
*
* @param {Action_SearchInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_search = /** @type {((inputs?: Action_SearchInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_SearchInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_search(inputs)
	return __fr.action_search(inputs)
});
/**
* | output |
* | --- |
* | "Filter" |
*
* @param {Action_FilterInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_filter = /** @type {((inputs?: Action_FilterInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_FilterInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_filter(inputs)
	return __fr.action_filter(inputs)
});
/**
* | output |
* | --- |
* | "Export" |
*
* @param {Action_ExportInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_export = /** @type {((inputs?: Action_ExportInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_ExportInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_export(inputs)
	return __fr.action_export(inputs)
});
/**
* | output |
* | --- |
* | "Import" |
*
* @param {Action_ImportInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_import = /** @type {((inputs?: Action_ImportInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_ImportInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_import(inputs)
	return __fr.action_import(inputs)
});
/**
* | output |
* | --- |
* | "Download" |
*
* @param {Action_DownloadInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_download = /** @type {((inputs?: Action_DownloadInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_DownloadInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_download(inputs)
	return __fr.action_download(inputs)
});
/**
* | output |
* | --- |
* | "Upload" |
*
* @param {Action_UploadInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_upload = /** @type {((inputs?: Action_UploadInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_UploadInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_upload(inputs)
	return __fr.action_upload(inputs)
});
/**
* | output |
* | --- |
* | "Submit" |
*
* @param {Action_SubmitInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_submit = /** @type {((inputs?: Action_SubmitInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_SubmitInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_submit(inputs)
	return __fr.action_submit(inputs)
});
/**
* | output |
* | --- |
* | "Confirm" |
*
* @param {Action_ConfirmInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_confirm = /** @type {((inputs?: Action_ConfirmInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_ConfirmInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_confirm(inputs)
	return __fr.action_confirm(inputs)
});
/**
* | output |
* | --- |
* | "Close" |
*
* @param {Action_CloseInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_close = /** @type {((inputs?: Action_CloseInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_CloseInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_close(inputs)
	return __fr.action_close(inputs)
});
/**
* | output |
* | --- |
* | "Back" |
*
* @param {Action_BackInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_back = /** @type {((inputs?: Action_BackInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_BackInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_back(inputs)
	return __fr.action_back(inputs)
});
/**
* | output |
* | --- |
* | "Next" |
*
* @param {Action_NextInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_next = /** @type {((inputs?: Action_NextInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_NextInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_next(inputs)
	return __fr.action_next(inputs)
});
/**
* | output |
* | --- |
* | "Previous" |
*
* @param {Action_PreviousInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_previous = /** @type {((inputs?: Action_PreviousInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_PreviousInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_previous(inputs)
	return __fr.action_previous(inputs)
});
/**
* | output |
* | --- |
* | "Refresh" |
*
* @param {Action_RefreshInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_refresh = /** @type {((inputs?: Action_RefreshInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_RefreshInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_refresh(inputs)
	return __fr.action_refresh(inputs)
});
/**
* | output |
* | --- |
* | "Reset" |
*
* @param {Action_ResetInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_reset = /** @type {((inputs?: Action_ResetInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_ResetInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_reset(inputs)
	return __fr.action_reset(inputs)
});
/**
* | output |
* | --- |
* | "View" |
*
* @param {Action_ViewInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_view = /** @type {((inputs?: Action_ViewInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_ViewInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_view(inputs)
	return __fr.action_view(inputs)
});
/**
* | output |
* | --- |
* | "Copy" |
*
* @param {Action_CopyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_copy = /** @type {((inputs?: Action_CopyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_CopyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_copy(inputs)
	return __fr.action_copy(inputs)
});
/**
* | output |
* | --- |
* | "Duplicate" |
*
* @param {Action_DuplicateInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_duplicate = /** @type {((inputs?: Action_DuplicateInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_DuplicateInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_duplicate(inputs)
	return __fr.action_duplicate(inputs)
});
/**
* | output |
* | --- |
* | "Archive" |
*
* @param {Action_ArchiveInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_archive = /** @type {((inputs?: Action_ArchiveInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_ArchiveInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_archive(inputs)
	return __fr.action_archive(inputs)
});
/**
* | output |
* | --- |
* | "Restore" |
*
* @param {Action_RestoreInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const action_restore = /** @type {((inputs?: Action_RestoreInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Action_RestoreInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.action_restore(inputs)
	return __fr.action_restore(inputs)
});
/**
* | output |
* | --- |
* | "Loading..." |
*
* @param {Status_LoadingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const status_loading = /** @type {((inputs?: Status_LoadingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Status_LoadingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.status_loading(inputs)
	return __fr.status_loading(inputs)
});
/**
* | output |
* | --- |
* | "Saving..." |
*
* @param {Status_SavingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const status_saving = /** @type {((inputs?: Status_SavingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Status_SavingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.status_saving(inputs)
	return __fr.status_saving(inputs)
});
/**
* | output |
* | --- |
* | "Deleting..." |
*
* @param {Status_DeletingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const status_deleting = /** @type {((inputs?: Status_DeletingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Status_DeletingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.status_deleting(inputs)
	return __fr.status_deleting(inputs)
});
/**
* | output |
* | --- |
* | "Success" |
*
* @param {Status_SuccessInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const status_success = /** @type {((inputs?: Status_SuccessInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Status_SuccessInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.status_success(inputs)
	return __fr.status_success(inputs)
});
/**
* | output |
* | --- |
* | "Error" |
*
* @param {Status_ErrorInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const status_error = /** @type {((inputs?: Status_ErrorInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Status_ErrorInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.status_error(inputs)
	return __fr.status_error(inputs)
});
/**
* | output |
* | --- |
* | "Warning" |
*
* @param {Status_WarningInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const status_warning = /** @type {((inputs?: Status_WarningInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Status_WarningInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.status_warning(inputs)
	return __fr.status_warning(inputs)
});
/**
* | output |
* | --- |
* | "Info" |
*
* @param {Status_InfoInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const status_info = /** @type {((inputs?: Status_InfoInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Status_InfoInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.status_info(inputs)
	return __fr.status_info(inputs)
});
/**
* | output |
* | --- |
* | "Pending" |
*
* @param {Status_PendingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const status_pending = /** @type {((inputs?: Status_PendingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Status_PendingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.status_pending(inputs)
	return __fr.status_pending(inputs)
});
/**
* | output |
* | --- |
* | "Active" |
*
* @param {Status_ActiveInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const status_active = /** @type {((inputs?: Status_ActiveInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Status_ActiveInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.status_active(inputs)
	return __fr.status_active(inputs)
});
/**
* | output |
* | --- |
* | "Inactive" |
*
* @param {Status_InactiveInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const status_inactive = /** @type {((inputs?: Status_InactiveInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Status_InactiveInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.status_inactive(inputs)
	return __fr.status_inactive(inputs)
});
/**
* | output |
* | --- |
* | "Draft" |
*
* @param {Status_DraftInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const status_draft = /** @type {((inputs?: Status_DraftInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Status_DraftInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.status_draft(inputs)
	return __fr.status_draft(inputs)
});
/**
* | output |
* | --- |
* | "Published" |
*
* @param {Status_PublishedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const status_published = /** @type {((inputs?: Status_PublishedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Status_PublishedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.status_published(inputs)
	return __fr.status_published(inputs)
});
/**
* | output |
* | --- |
* | "Archived" |
*
* @param {Status_ArchivedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const status_archived = /** @type {((inputs?: Status_ArchivedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Status_ArchivedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.status_archived(inputs)
	return __fr.status_archived(inputs)
});
/**
* | output |
* | --- |
* | "Changes saved successfully" |
*
* @param {Message_Saved_SuccessfullyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const message_saved_successfully = /** @type {((inputs?: Message_Saved_SuccessfullyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Message_Saved_SuccessfullyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.message_saved_successfully(inputs)
	return __fr.message_saved_successfully(inputs)
});
/**
* | output |
* | --- |
* | "Item deleted successfully" |
*
* @param {Message_Deleted_SuccessfullyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const message_deleted_successfully = /** @type {((inputs?: Message_Deleted_SuccessfullyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Message_Deleted_SuccessfullyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.message_deleted_successfully(inputs)
	return __fr.message_deleted_successfully(inputs)
});
/**
* | output |
* | --- |
* | "Item created successfully" |
*
* @param {Message_Created_SuccessfullyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const message_created_successfully = /** @type {((inputs?: Message_Created_SuccessfullyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Message_Created_SuccessfullyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.message_created_successfully(inputs)
	return __fr.message_created_successfully(inputs)
});
/**
* | output |
* | --- |
* | "Item updated successfully" |
*
* @param {Message_Updated_SuccessfullyInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const message_updated_successfully = /** @type {((inputs?: Message_Updated_SuccessfullyInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Message_Updated_SuccessfullyInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.message_updated_successfully(inputs)
	return __fr.message_updated_successfully(inputs)
});
/**
* | output |
* | --- |
* | "An error occurred. Please try again." |
*
* @param {Message_Error_GenericInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const message_error_generic = /** @type {((inputs?: Message_Error_GenericInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Message_Error_GenericInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.message_error_generic(inputs)
	return __fr.message_error_generic(inputs)
});
/**
* | output |
* | --- |
* | "The requested item was not found." |
*
* @param {Message_Error_Not_FoundInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const message_error_not_found = /** @type {((inputs?: Message_Error_Not_FoundInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Message_Error_Not_FoundInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.message_error_not_found(inputs)
	return __fr.message_error_not_found(inputs)
});
/**
* | output |
* | --- |
* | "You are not authorized to perform this action." |
*
* @param {Message_Error_UnauthorizedInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const message_error_unauthorized = /** @type {((inputs?: Message_Error_UnauthorizedInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Message_Error_UnauthorizedInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.message_error_unauthorized(inputs)
	return __fr.message_error_unauthorized(inputs)
});
/**
* | output |
* | --- |
* | "Please check the form for errors." |
*
* @param {Message_Error_ValidationInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const message_error_validation = /** @type {((inputs?: Message_Error_ValidationInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Message_Error_ValidationInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.message_error_validation(inputs)
	return __fr.message_error_validation(inputs)
});
/**
* | output |
* | --- |
* | "Are you sure you want to delete this item? This action cannot be undone." |
*
* @param {Message_Confirm_DeleteInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const message_confirm_delete = /** @type {((inputs?: Message_Confirm_DeleteInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Message_Confirm_DeleteInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.message_confirm_delete(inputs)
	return __fr.message_confirm_delete(inputs)
});
/**
* | output |
* | --- |
* | "No results found" |
*
* @param {Message_No_ResultsInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const message_no_results = /** @type {((inputs?: Message_No_ResultsInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Message_No_ResultsInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.message_no_results(inputs)
	return __fr.message_no_results(inputs)
});
/**
* | output |
* | --- |
* | "No data available" |
*
* @param {Message_No_DataInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const message_no_data = /** @type {((inputs?: Message_No_DataInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Message_No_DataInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.message_no_data(inputs)
	return __fr.message_no_data(inputs)
});
/**
* | output |
* | --- |
* | "This field is required" |
*
* @param {Form_RequiredInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const form_required = /** @type {((inputs?: Form_RequiredInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Form_RequiredInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.form_required(inputs)
	return __fr.form_required(inputs)
});
/**
* | output |
* | --- |
* | "Please enter a valid email address" |
*
* @param {Form_Invalid_EmailInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const form_invalid_email = /** @type {((inputs?: Form_Invalid_EmailInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Form_Invalid_EmailInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.form_invalid_email(inputs)
	return __fr.form_invalid_email(inputs)
});
/**
* | output |
* | --- |
* | "Please enter a valid URL" |
*
* @param {Form_Invalid_UrlInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const form_invalid_url = /** @type {((inputs?: Form_Invalid_UrlInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Form_Invalid_UrlInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.form_invalid_url(inputs)
	return __fr.form_invalid_url(inputs)
});
/**
* | output |
* | --- |
* | "Must be at least {min} characters" |
*
* @param {Form_Min_LengthInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const form_min_length = /** @type {((inputs: Form_Min_LengthInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Form_Min_LengthInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.form_min_length(inputs)
	return __fr.form_min_length(inputs)
});
/**
* | output |
* | --- |
* | "Must be at most {max} characters" |
*
* @param {Form_Max_LengthInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const form_max_length = /** @type {((inputs: Form_Max_LengthInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Form_Max_LengthInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.form_max_length(inputs)
	return __fr.form_max_length(inputs)
});
/**
* | output |
* | --- |
* | "Must be at least {min}" |
*
* @param {Form_Min_ValueInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const form_min_value = /** @type {((inputs: Form_Min_ValueInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Form_Min_ValueInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.form_min_value(inputs)
	return __fr.form_min_value(inputs)
});
/**
* | output |
* | --- |
* | "Must be at most {max}" |
*
* @param {Form_Max_ValueInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const form_max_value = /** @type {((inputs: Form_Max_ValueInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Form_Max_ValueInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.form_max_value(inputs)
	return __fr.form_max_value(inputs)
});
/**
* | output |
* | --- |
* | "Page" |
*
* @param {Pagination_PageInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const pagination_page = /** @type {((inputs?: Pagination_PageInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pagination_PageInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.pagination_page(inputs)
	return __fr.pagination_page(inputs)
});
/**
* | output |
* | --- |
* | "of" |
*
* @param {Pagination_OfInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const pagination_of = /** @type {((inputs?: Pagination_OfInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pagination_OfInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.pagination_of(inputs)
	return __fr.pagination_of(inputs)
});
/**
* | output |
* | --- |
* | "Items per page" |
*
* @param {Pagination_Items_Per_PageInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const pagination_items_per_page = /** @type {((inputs?: Pagination_Items_Per_PageInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pagination_Items_Per_PageInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.pagination_items_per_page(inputs)
	return __fr.pagination_items_per_page(inputs)
});
/**
* | output |
* | --- |
* | "Showing {from} to {to} of {total} items" |
*
* @param {Pagination_ShowingInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const pagination_showing = /** @type {((inputs: Pagination_ShowingInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pagination_ShowingInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.pagination_showing(inputs)
	return __fr.pagination_showing(inputs)
});
/**
* | output |
* | --- |
* | "First" |
*
* @param {Pagination_FirstInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const pagination_first = /** @type {((inputs?: Pagination_FirstInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pagination_FirstInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.pagination_first(inputs)
	return __fr.pagination_first(inputs)
});
/**
* | output |
* | --- |
* | "Last" |
*
* @param {Pagination_LastInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const pagination_last = /** @type {((inputs?: Pagination_LastInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Pagination_LastInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.pagination_last(inputs)
	return __fr.pagination_last(inputs)
});
/**
* | output |
* | --- |
* | "Today" |
*
* @param {Time_TodayInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const time_today = /** @type {((inputs?: Time_TodayInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Time_TodayInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.time_today(inputs)
	return __fr.time_today(inputs)
});
/**
* | output |
* | --- |
* | "Yesterday" |
*
* @param {Time_YesterdayInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const time_yesterday = /** @type {((inputs?: Time_YesterdayInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Time_YesterdayInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.time_yesterday(inputs)
	return __fr.time_yesterday(inputs)
});
/**
* | output |
* | --- |
* | "Tomorrow" |
*
* @param {Time_TomorrowInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const time_tomorrow = /** @type {((inputs?: Time_TomorrowInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Time_TomorrowInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.time_tomorrow(inputs)
	return __fr.time_tomorrow(inputs)
});
/**
* | output |
* | --- |
* | "{count} days ago" |
*
* @param {Time_Days_AgoInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const time_days_ago = /** @type {((inputs: Time_Days_AgoInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Time_Days_AgoInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.time_days_ago(inputs)
	return __fr.time_days_ago(inputs)
});
/**
* | output |
* | --- |
* | "{count} hours ago" |
*
* @param {Time_Hours_AgoInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const time_hours_ago = /** @type {((inputs: Time_Hours_AgoInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Time_Hours_AgoInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.time_hours_ago(inputs)
	return __fr.time_hours_ago(inputs)
});
/**
* | output |
* | --- |
* | "{count} minutes ago" |
*
* @param {Time_Minutes_AgoInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const time_minutes_ago = /** @type {((inputs: Time_Minutes_AgoInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Time_Minutes_AgoInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.time_minutes_ago(inputs)
	return __fr.time_minutes_ago(inputs)
});
/**
* | output |
* | --- |
* | "Log in" |
*
* @param {Auth_LoginInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const auth_login = /** @type {((inputs?: Auth_LoginInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_LoginInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.auth_login(inputs)
	return __fr.auth_login(inputs)
});
/**
* | output |
* | --- |
* | "Log out" |
*
* @param {Auth_LogoutInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const auth_logout = /** @type {((inputs?: Auth_LogoutInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_LogoutInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.auth_logout(inputs)
	return __fr.auth_logout(inputs)
});
/**
* | output |
* | --- |
* | "Register" |
*
* @param {Auth_RegisterInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const auth_register = /** @type {((inputs?: Auth_RegisterInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_RegisterInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.auth_register(inputs)
	return __fr.auth_register(inputs)
});
/**
* | output |
* | --- |
* | "Email" |
*
* @param {Auth_EmailInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const auth_email = /** @type {((inputs?: Auth_EmailInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_EmailInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.auth_email(inputs)
	return __fr.auth_email(inputs)
});
/**
* | output |
* | --- |
* | "Password" |
*
* @param {Auth_PasswordInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const auth_password = /** @type {((inputs?: Auth_PasswordInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_PasswordInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.auth_password(inputs)
	return __fr.auth_password(inputs)
});
/**
* | output |
* | --- |
* | "Forgot password?" |
*
* @param {Auth_Forgot_PasswordInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const auth_forgot_password = /** @type {((inputs?: Auth_Forgot_PasswordInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Forgot_PasswordInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.auth_forgot_password(inputs)
	return __fr.auth_forgot_password(inputs)
});
/**
* | output |
* | --- |
* | "Remember me" |
*
* @param {Auth_Remember_MeInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const auth_remember_me = /** @type {((inputs?: Auth_Remember_MeInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Auth_Remember_MeInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.auth_remember_me(inputs)
	return __fr.auth_remember_me(inputs)
});
/**
* | output |
* | --- |
* | "Language" |
*
* @param {Language_Selector_LabelInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const language_selector_label = /** @type {((inputs?: Language_Selector_LabelInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Language_Selector_LabelInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.language_selector_label(inputs)
	return __fr.language_selector_label(inputs)
});
/**
* | output |
* | --- |
* | "English" |
*
* @param {Language_EnglishInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const language_english = /** @type {((inputs?: Language_EnglishInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Language_EnglishInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.language_english(inputs)
	return __fr.language_english(inputs)
});
/**
* | output |
* | --- |
* | "French" |
*
* @param {Language_FrenchInputs} inputs
* @param {{ locale?: "en" | "fr" }} options
* @returns {LocalizedString}
*/
export const language_french = /** @type {((inputs?: Language_FrenchInputs, options?: { locale?: "en" | "fr" }) => LocalizedString) & import('../runtime.js').MessageMetadata<Language_FrenchInputs, { locale?: "en" | "fr" }, {}>} */ ((inputs = {}, options = {}) => {
	const locale = experimentalStaticLocale ?? options.locale ?? getLocale()
	if (locale === "en") return __en.language_french(inputs)
	return __fr.language_french(inputs)
});