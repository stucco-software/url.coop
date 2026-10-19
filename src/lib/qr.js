import QRCode from 'qrcode'

export const qrify = async (url) => {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: 'L',
    margin: 1,
    color: {
      dark: '#2e2e2e',
      light: '#fbfbfb'
    }
  })
}
