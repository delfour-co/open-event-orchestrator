import { describe, expect, it, vi } from 'vitest'

vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue('data:image/png;base64,mockQrCode')
  }
}))

// Import after mock setup
const { generateQrCodeDataUrl } = await import('./qr-code-service')
const QRCode = (await import('qrcode')).default

describe('generateQrCodeDataUrl', () => {
  it('should call QRCode.toDataURL with correct parameters', async () => {
    await generateQrCodeDataUrl('test-data')

    expect(QRCode.toDataURL).toHaveBeenCalledWith('test-data', {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      margin: 2,
      width: 300
    })
  })

  it('should return the data URL from qrcode library', async () => {
    const result = await generateQrCodeDataUrl('test-data')

    expect(result).toBe('data:image/png;base64,mockQrCode')
  })

  it('should pass JSON payload to qrcode library', async () => {
    const payload = JSON.stringify({
      ticketId: 'TKT-123',
      ticketNumber: 'TKT-123',
      editionId: 'ed-1'
    })

    await generateQrCodeDataUrl(payload)

    expect(QRCode.toDataURL).toHaveBeenCalledWith(payload, expect.any(Object))
  })

  it('should propagate errors from qrcode library', async () => {
    vi.mocked(QRCode.toDataURL).mockRejectedValueOnce(new Error('QR generation failed'))

    await expect(generateQrCodeDataUrl('data')).rejects.toThrow('QR generation failed')
  })
})
