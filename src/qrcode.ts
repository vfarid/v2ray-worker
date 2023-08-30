import QRCode from 'qrcode'

const generateQR = async (conf: string) => {
  return await QRCode.toDataURL(conf)
}
