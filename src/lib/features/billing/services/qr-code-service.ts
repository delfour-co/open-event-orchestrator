import QRCode from 'qrcode'

export const generateQrCodeDataUrl = async (data: string): Promise<string> => {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    margin: 2,
    width: 300
  })
}
