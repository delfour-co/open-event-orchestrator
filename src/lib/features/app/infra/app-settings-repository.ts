import type PocketBase from 'pocketbase'
import type { RecordModel } from 'pocketbase'
import type { AppSettings, CreateAppSettings, UpdateAppSettings } from '../domain/app-settings'

export class AppSettingsRepository {
  constructor(private pb: PocketBase) {}

  async getByEdition(editionId: string): Promise<AppSettings | null> {
    try {
      const record = await this.pb
        .collection('pwa_settings')
        .getFirstListItem(`editionId = "${editionId}"`)
      return this.mapRecord(record)
    } catch {
      return null
    }
  }

  async create(data: CreateAppSettings): Promise<AppSettings> {
    const record = await this.pb.collection('pwa_settings').create({
      editionId: data.editionId,
      title: data.title,
      subtitle: data.subtitle,
      logoFile: data.logoFile,
      headerImage: data.headerImage,
      primaryColor: data.primaryColor,
      accentColor: data.accentColor,
      showScheduleTab: data.showScheduleTab ?? true,
      showSpeakersTab: data.showSpeakersTab ?? true,
      showTicketsTab: data.showTicketsTab ?? true,
      showFeedbackTab: data.showFeedbackTab ?? true,
      showFavoritesTab: data.showFavoritesTab ?? true
    })
    return this.mapRecord(record)
  }

  async update(data: UpdateAppSettings): Promise<AppSettings> {
    const updateData: Record<string, unknown> = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.subtitle !== undefined) updateData.subtitle = data.subtitle
    if (data.logoFile !== undefined) updateData.logoFile = data.logoFile
    if (data.headerImage !== undefined) updateData.headerImage = data.headerImage
    if (data.primaryColor !== undefined) updateData.primaryColor = data.primaryColor
    if (data.accentColor !== undefined) updateData.accentColor = data.accentColor
    if (data.showScheduleTab !== undefined) updateData.showScheduleTab = data.showScheduleTab
    if (data.showSpeakersTab !== undefined) updateData.showSpeakersTab = data.showSpeakersTab
    if (data.showTicketsTab !== undefined) updateData.showTicketsTab = data.showTicketsTab
    if (data.showFeedbackTab !== undefined) updateData.showFeedbackTab = data.showFeedbackTab
    if (data.showFavoritesTab !== undefined) updateData.showFavoritesTab = data.showFavoritesTab

    const record = await this.pb.collection('pwa_settings').update(data.id, updateData)
    return this.mapRecord(record)
  }

  async updateWithFile(
    id: string,
    data: Record<string, unknown>,
    formData: FormData
  ): Promise<AppSettings> {
    // Merge regular data with form data for file upload
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined && !formData.has(key)) {
        formData.append(key, String(value))
      }
    }

    const record = await this.pb.collection('pwa_settings').update(id, formData)
    return this.mapRecord(record)
  }

  getFileUrl(record: AppSettings, filename: string | undefined): string | undefined {
    if (!filename) return undefined
    return this.pb.files.getURL(
      { id: record.id, collectionId: 'pwa_settings', collectionName: 'pwa_settings' },
      filename
    )
  }

  private mapRecord(record: RecordModel): AppSettings {
    return {
      id: record.id,
      editionId: record.editionId,
      title: record.title || undefined,
      subtitle: record.subtitle || undefined,
      logoFile: record.logoFile || undefined,
      headerImage: record.headerImage || undefined,
      primaryColor: record.primaryColor || undefined,
      accentColor: record.accentColor || undefined,
      showScheduleTab: record.showScheduleTab ?? true,
      showSpeakersTab: record.showSpeakersTab ?? true,
      showTicketsTab: record.showTicketsTab ?? true,
      showFeedbackTab: record.showFeedbackTab ?? true,
      showFavoritesTab: record.showFavoritesTab ?? true
    }
  }
}
