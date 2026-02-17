/* eslint-disable */
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


export const common_app_name = /** @type {(inputs: Common_App_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Open Event Orchestrator`)
};

export const common_app_short_name = /** @type {(inputs: Common_App_Short_NameInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`OEO`)
};

export const nav_dashboard = /** @type {(inputs: Nav_DashboardInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tableau de bord`)
};

export const nav_organizations = /** @type {(inputs: Nav_OrganizationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organisations`)
};

export const nav_events = /** @type {(inputs: Nav_EventsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Evenements`)
};

export const nav_cfp = /** @type {(inputs: Nav_CfpInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CFP`)
};

export const nav_planning = /** @type {(inputs: Nav_PlanningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Planning`)
};

export const nav_attendee_app = /** @type {(inputs: Nav_Attendee_AppInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App Participants`)
};

export const nav_billing = /** @type {(inputs: Nav_BillingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Billetterie`)
};

export const nav_sponsoring = /** @type {(inputs: Nav_SponsoringInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parrainage`)
};

export const nav_budget = /** @type {(inputs: Nav_BudgetInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Budget`)
};

export const nav_crm = /** @type {(inputs: Nav_CrmInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CRM`)
};

export const nav_emails = /** @type {(inputs: Nav_EmailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emails`)
};

export const nav_reporting = /** @type {(inputs: Nav_ReportingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rapports`)
};

export const nav_api = /** @type {(inputs: Nav_ApiInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`API`)
};

export const nav_settings = /** @type {(inputs: Nav_SettingsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parametres`)
};

export const sidebar_expand = /** @type {(inputs: Sidebar_ExpandInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deployer la barre laterale`)
};

export const sidebar_collapse = /** @type {(inputs: Sidebar_CollapseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reduire la barre laterale`)
};

export const header_notifications = /** @type {(inputs: Header_NotificationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Notifications`)
};

export const header_toggle_menu = /** @type {(inputs: Header_Toggle_MenuInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Basculer le menu`)
};

export const header_logout = /** @type {(inputs: Header_LogoutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deconnexion`)
};

export const header_toggle_theme = /** @type {(inputs: Header_Toggle_ThemeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Changer de theme`)
};

export const section_dashboard = /** @type {(inputs: Section_DashboardInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Tableau de bord`)
};

export const section_organizations = /** @type {(inputs: Section_OrganizationsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Organisations`)
};

export const section_events = /** @type {(inputs: Section_EventsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Evenements`)
};

export const section_editions = /** @type {(inputs: Section_EditionsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Editions`)
};

export const section_cfp = /** @type {(inputs: Section_CfpInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Appel a communications`)
};

export const section_planning = /** @type {(inputs: Section_PlanningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Planning`)
};

export const section_attendee_app = /** @type {(inputs: Section_Attendee_AppInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`App Participants`)
};

export const section_billing = /** @type {(inputs: Section_BillingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Billetterie`)
};

export const section_sponsoring = /** @type {(inputs: Section_SponsoringInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parrainage`)
};

export const section_budget = /** @type {(inputs: Section_BudgetInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Budget`)
};

export const section_crm = /** @type {(inputs: Section_CrmInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`CRM`)
};

export const section_emails = /** @type {(inputs: Section_EmailsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Emails`)
};

export const section_reporting = /** @type {(inputs: Section_ReportingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rapports`)
};

export const section_api = /** @type {(inputs: Section_ApiInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`API`)
};

export const section_settings = /** @type {(inputs: Section_SettingsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Parametres`)
};

export const action_save = /** @type {(inputs: Action_SaveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrer`)
};

export const action_cancel = /** @type {(inputs: Action_CancelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Annuler`)
};

export const action_delete = /** @type {(inputs: Action_DeleteInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Supprimer`)
};

export const action_edit = /** @type {(inputs: Action_EditInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifier`)
};

export const action_create = /** @type {(inputs: Action_CreateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Creer`)
};

export const action_add = /** @type {(inputs: Action_AddInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ajouter`)
};

export const action_remove = /** @type {(inputs: Action_RemoveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retirer`)
};

export const action_update = /** @type {(inputs: Action_UpdateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mettre a jour`)
};

export const action_search = /** @type {(inputs: Action_SearchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Rechercher`)
};

export const action_filter = /** @type {(inputs: Action_FilterInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Filtrer`)
};

export const action_export = /** @type {(inputs: Action_ExportInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Exporter`)
};

export const action_import = /** @type {(inputs: Action_ImportInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Importer`)
};

export const action_download = /** @type {(inputs: Action_DownloadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Telecharger`)
};

export const action_upload = /** @type {(inputs: Action_UploadInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Envoyer`)
};

export const action_submit = /** @type {(inputs: Action_SubmitInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Soumettre`)
};

export const action_confirm = /** @type {(inputs: Action_ConfirmInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Confirmer`)
};

export const action_close = /** @type {(inputs: Action_CloseInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Fermer`)
};

export const action_back = /** @type {(inputs: Action_BackInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Retour`)
};

export const action_next = /** @type {(inputs: Action_NextInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suivant`)
};

export const action_previous = /** @type {(inputs: Action_PreviousInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Precedent`)
};

export const action_refresh = /** @type {(inputs: Action_RefreshInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actualiser`)
};

export const action_reset = /** @type {(inputs: Action_ResetInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Reinitialiser`)
};

export const action_view = /** @type {(inputs: Action_ViewInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Voir`)
};

export const action_copy = /** @type {(inputs: Action_CopyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Copier`)
};

export const action_duplicate = /** @type {(inputs: Action_DuplicateInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dupliquer`)
};

export const action_archive = /** @type {(inputs: Action_ArchiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archiver`)
};

export const action_restore = /** @type {(inputs: Action_RestoreInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Restaurer`)
};

export const status_loading = /** @type {(inputs: Status_LoadingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Chargement...`)
};

export const status_saving = /** @type {(inputs: Status_SavingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Enregistrement...`)
};

export const status_deleting = /** @type {(inputs: Status_DeletingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Suppression...`)
};

export const status_success = /** @type {(inputs: Status_SuccessInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Succes`)
};

export const status_error = /** @type {(inputs: Status_ErrorInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Erreur`)
};

export const status_warning = /** @type {(inputs: Status_WarningInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Avertissement`)
};

export const status_info = /** @type {(inputs: Status_InfoInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Information`)
};

export const status_pending = /** @type {(inputs: Status_PendingInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`En attente`)
};

export const status_active = /** @type {(inputs: Status_ActiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Actif`)
};

export const status_inactive = /** @type {(inputs: Status_InactiveInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inactif`)
};

export const status_draft = /** @type {(inputs: Status_DraftInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Brouillon`)
};

export const status_published = /** @type {(inputs: Status_PublishedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Publie`)
};

export const status_archived = /** @type {(inputs: Status_ArchivedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Archive`)
};

export const message_saved_successfully = /** @type {(inputs: Message_Saved_SuccessfullyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Modifications enregistrees avec succes`)
};

export const message_deleted_successfully = /** @type {(inputs: Message_Deleted_SuccessfullyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Element supprime avec succes`)
};

export const message_created_successfully = /** @type {(inputs: Message_Created_SuccessfullyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Element cree avec succes`)
};

export const message_updated_successfully = /** @type {(inputs: Message_Updated_SuccessfullyInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Element mis a jour avec succes`)
};

export const message_error_generic = /** @type {(inputs: Message_Error_GenericInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Une erreur s'est produite. Veuillez reessayer.`)
};

export const message_error_not_found = /** @type {(inputs: Message_Error_Not_FoundInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`L'element demande n'a pas ete trouve.`)
};

export const message_error_unauthorized = /** @type {(inputs: Message_Error_UnauthorizedInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Vous n'etes pas autorise a effectuer cette action.`)
};

export const message_error_validation = /** @type {(inputs: Message_Error_ValidationInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez verifier les erreurs dans le formulaire.`)
};

export const message_confirm_delete = /** @type {(inputs: Message_Confirm_DeleteInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Etes-vous sur de vouloir supprimer cet element ? Cette action est irreversible.`)
};

export const message_no_results = /** @type {(inputs: Message_No_ResultsInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucun resultat trouve`)
};

export const message_no_data = /** @type {(inputs: Message_No_DataInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aucune donnee disponible`)
};

export const form_required = /** @type {(inputs: Form_RequiredInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Ce champ est obligatoire`)
};

export const form_invalid_email = /** @type {(inputs: Form_Invalid_EmailInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez entrer une adresse email valide`)
};

export const form_invalid_url = /** @type {(inputs: Form_Invalid_UrlInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Veuillez entrer une URL valide`)
};

export const form_min_length = /** @type {(inputs: Form_Min_LengthInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Doit contenir au moins ${i?.min} caracteres`)
};

export const form_max_length = /** @type {(inputs: Form_Max_LengthInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Doit contenir au maximum ${i?.max} caracteres`)
};

export const form_min_value = /** @type {(inputs: Form_Min_ValueInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Doit etre au moins ${i?.min}`)
};

export const form_max_value = /** @type {(inputs: Form_Max_ValueInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Doit etre au maximum ${i?.max}`)
};

export const pagination_page = /** @type {(inputs: Pagination_PageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Page`)
};

export const pagination_of = /** @type {(inputs: Pagination_OfInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`sur`)
};

export const pagination_items_per_page = /** @type {(inputs: Pagination_Items_Per_PageInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Elements par page`)
};

export const pagination_showing = /** @type {(inputs: Pagination_ShowingInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`Affichage de ${i?.from} a ${i?.to} sur ${i?.total} elements`)
};

export const pagination_first = /** @type {(inputs: Pagination_FirstInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Premier`)
};

export const pagination_last = /** @type {(inputs: Pagination_LastInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Dernier`)
};

export const time_today = /** @type {(inputs: Time_TodayInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Aujourd'hui`)
};

export const time_yesterday = /** @type {(inputs: Time_YesterdayInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Hier`)
};

export const time_tomorrow = /** @type {(inputs: Time_TomorrowInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Demain`)
};

export const time_days_ago = /** @type {(inputs: Time_Days_AgoInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`il y a ${i?.count} jours`)
};

export const time_hours_ago = /** @type {(inputs: Time_Hours_AgoInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`il y a ${i?.count} heures`)
};

export const time_minutes_ago = /** @type {(inputs: Time_Minutes_AgoInputs) => LocalizedString} */ (i) => {
	return /** @type {LocalizedString} */ (`il y a ${i?.count} minutes`)
};

export const auth_login = /** @type {(inputs: Auth_LoginInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Connexion`)
};

export const auth_logout = /** @type {(inputs: Auth_LogoutInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Deconnexion`)
};

export const auth_register = /** @type {(inputs: Auth_RegisterInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Inscription`)
};

export const auth_email = /** @type {(inputs: Auth_EmailInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Email`)
};

export const auth_password = /** @type {(inputs: Auth_PasswordInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mot de passe`)
};

export const auth_forgot_password = /** @type {(inputs: Auth_Forgot_PasswordInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Mot de passe oublie ?`)
};

export const auth_remember_me = /** @type {(inputs: Auth_Remember_MeInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Se souvenir de moi`)
};

export const language_selector_label = /** @type {(inputs: Language_Selector_LabelInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Langue`)
};

export const language_english = /** @type {(inputs: Language_EnglishInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Anglais`)
};

export const language_french = /** @type {(inputs: Language_FrenchInputs) => LocalizedString} */ () => {
	return /** @type {LocalizedString} */ (`Francais`)
};