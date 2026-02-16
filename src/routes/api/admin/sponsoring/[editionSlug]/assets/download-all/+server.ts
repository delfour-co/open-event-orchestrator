import type { SponsorAsset } from '$lib/features/sponsoring/domain'
import { LOGO_CATEGORIES, getCategoryLabel } from '$lib/features/sponsoring/domain'
import {
  createEditionSponsorRepository,
  createSponsorAssetRepository
} from '$lib/features/sponsoring/infra'
import type { SponsorAssetRepository } from '$lib/features/sponsoring/infra/sponsor-asset-repository'
import { error } from '@sveltejs/kit'
import type JSZip from 'jszip'
import { default as JSZipLib } from 'jszip'
import type { RequestHandler } from './$types'

const sanitizeFolderName = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)
}

const sanitizeFileName = (name: string, originalFile: string): string => {
  const extension = originalFile.split('.').pop() || ''
  const baseName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 50)

  return extension ? `${baseName}.${extension}` : baseName
}

const getCategoryFolderName = (asset: SponsorAsset): string => {
  if (LOGO_CATEGORIES.includes(asset.category)) {
    return 'logos'
  }
  return getCategoryLabel(asset.category)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
}

const fetchAssetBuffer = async (
  asset: SponsorAsset,
  repo: SponsorAssetRepository
): Promise<ArrayBuffer | null> => {
  try {
    const fileUrl = repo.getFileUrl(asset)
    const response = await fetch(fileUrl)

    if (!response.ok) {
      console.error(`Failed to fetch asset ${asset.id}: ${response.statusText}`)
      return null
    }

    const blob = await response.blob()
    return blob.arrayBuffer()
  } catch (err) {
    console.error(`Error fetching asset ${asset.id}:`, err)
    return null
  }
}

const addAssetToFolder = async (
  folder: JSZip,
  asset: SponsorAsset,
  repo: SponsorAssetRepository
): Promise<void> => {
  const buffer = await fetchAssetBuffer(asset, repo)
  if (!buffer) return

  const categoryFolder = getCategoryFolderName(asset)
  const fileName = sanitizeFileName(asset.name, asset.file)
  const filePath = `${categoryFolder}/${fileName}`

  folder.file(filePath, buffer)
}

export const GET: RequestHandler = async ({ params, locals }) => {
  const { editionSlug } = params

  const editions = await locals.pb.collection('editions').getList(1, 1, {
    filter: `slug = "${editionSlug}"`
  })

  if (editions.items.length === 0) {
    throw error(404, 'Edition not found')
  }

  const edition = editions.items[0]
  const editionId = edition.id as string

  const editionSponsorRepo = createEditionSponsorRepository(locals.pb)
  const assetRepo = createSponsorAssetRepository(locals.pb)

  const editionSponsors = await editionSponsorRepo.findByEditionWithExpand(editionId)
  const confirmedSponsors = editionSponsors.filter((es) => es.status === 'confirmed')

  if (confirmedSponsors.length === 0) {
    throw error(404, 'No confirmed sponsors found')
  }

  const zip = new JSZipLib()

  for (const editionSponsor of confirmedSponsors) {
    const sponsorName = sanitizeFolderName(editionSponsor.sponsor?.name || 'unknown-sponsor')
    const assets = await assetRepo.findByEditionSponsor(editionSponsor.id)

    if (assets.length === 0) continue

    const sponsorFolder = zip.folder(sponsorName)
    if (!sponsorFolder) continue

    for (const asset of assets) {
      await addAssetToFolder(sponsorFolder, asset, assetRepo)
    }
  }

  const content = await zip.generateAsync({
    type: 'arraybuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  })

  const filename = `sponsor-assets-${editionSlug}-${new Date().toISOString().split('T')[0]}.zip`

  return new Response(content, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': content.byteLength.toString()
    }
  })
}
