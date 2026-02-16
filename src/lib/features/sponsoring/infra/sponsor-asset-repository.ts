import { safeFilter } from '$lib/server/safe-filter'
import type PocketBase from 'pocketbase'
import type {
  CreateSponsorAsset,
  SponsorAsset,
  SponsorAssetCategory,
  UpdateSponsorAsset
} from '../domain/sponsor-asset'

const COLLECTION = 'sponsor_assets'

export const createSponsorAssetRepository = (pb: PocketBase) => ({
  async findById(id: string): Promise<SponsorAsset | null> {
    try {
      const record = await pb.collection(COLLECTION).getOne(id)
      return mapRecordToAsset(record)
    } catch {
      return null
    }
  },

  async findByEditionSponsor(editionSponsorId: string): Promise<SponsorAsset[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionSponsorId = ${editionSponsorId}`,
      sort: 'category,name'
    })
    return records.map(mapRecordToAsset)
  },

  async findByEditionSponsorAndCategory(
    editionSponsorId: string,
    category: SponsorAssetCategory
  ): Promise<SponsorAsset[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionSponsorId = ${editionSponsorId} && category = ${category}`,
      sort: 'name'
    })
    return records.map(mapRecordToAsset)
  },

  async findByEdition(editionId: string): Promise<SponsorAsset[]> {
    const records = await pb.collection(COLLECTION).getFullList({
      filter: safeFilter`editionSponsorId.editionId = ${editionId}`,
      sort: 'editionSponsorId,category,name',
      expand: 'editionSponsorId,editionSponsorId.sponsorId'
    })
    return records.map(mapRecordToAsset)
  },

  async create(data: CreateSponsorAsset, file: File): Promise<SponsorAsset> {
    const formData = new FormData()
    formData.append('editionSponsorId', data.editionSponsorId)
    formData.append('category', data.category)
    formData.append('name', data.name)
    formData.append('file', file)
    formData.append('fileSize', String(data.fileSize))
    formData.append('mimeType', data.mimeType)

    if (data.description) {
      formData.append('description', data.description)
    }
    if (data.width !== undefined) {
      formData.append('width', String(data.width))
    }
    if (data.height !== undefined) {
      formData.append('height', String(data.height))
    }
    if (data.usage) {
      formData.append('usage', data.usage)
    }

    const record = await pb.collection(COLLECTION).create(formData)
    return mapRecordToAsset(record)
  },

  async update(id: string, data: UpdateSponsorAsset): Promise<SponsorAsset> {
    const updateData: Record<string, unknown> = {}
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description || null
    if (data.category !== undefined) updateData.category = data.category
    if (data.usage !== undefined) updateData.usage = data.usage || null

    const record = await pb.collection(COLLECTION).update(id, updateData)
    return mapRecordToAsset(record)
  },

  async delete(id: string): Promise<void> {
    await pb.collection(COLLECTION).delete(id)
  },

  async deleteByEditionSponsor(editionSponsorId: string): Promise<void> {
    const assets = await this.findByEditionSponsor(editionSponsorId)
    for (const asset of assets) {
      await pb.collection(COLLECTION).delete(asset.id)
    }
  },

  getFileUrl(asset: SponsorAsset): string {
    return pb.files.getURL(
      { id: asset.id, collectionId: COLLECTION, collectionName: COLLECTION },
      asset.file
    )
  },

  getThumbUrl(asset: SponsorAsset, size: '100x100' | '200x200' | '400x400' = '200x200'): string {
    return pb.files.getURL(
      { id: asset.id, collectionId: COLLECTION, collectionName: COLLECTION },
      asset.file,
      { thumb: size }
    )
  },

  async getFileBlob(asset: SponsorAsset): Promise<Blob> {
    const url = this.getFileUrl(asset)
    const response = await fetch(url)
    return response.blob()
  }
})

const mapRecordToAsset = (record: Record<string, unknown>): SponsorAsset => ({
  id: record.id as string,
  editionSponsorId: record.editionSponsorId as string,
  category: record.category as SponsorAssetCategory,
  name: record.name as string,
  description: (record.description as string) || undefined,
  file: record.file as string,
  fileSize: record.fileSize as number,
  mimeType: record.mimeType as string,
  width: (record.width as number) || undefined,
  height: (record.height as number) || undefined,
  usage: (record.usage as string) || undefined,
  createdAt: new Date(record.created as string),
  updatedAt: new Date(record.updated as string)
})

export type SponsorAssetRepository = ReturnType<typeof createSponsorAssetRepository>
