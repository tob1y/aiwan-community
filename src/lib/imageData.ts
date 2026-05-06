const MAX_IMAGE_BYTES = 900_000

export async function fileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件（JPEG / PNG / WebP / GIF）。')
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('单张图片请控制在 900KB 以内，避免占满浏览器存储。')
  }
  return await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const r = reader.result
      if (typeof r === 'string') resolve(r)
      else reject(new Error('读取失败'))
    }
    reader.onerror = () => reject(new Error('读取失败'))
    reader.readAsDataURL(file)
  })
}
