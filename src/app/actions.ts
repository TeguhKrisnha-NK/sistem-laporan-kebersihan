'use server'

import { v2 as cloudinary } from 'cloudinary'

// Konfigurasi Dapur (Server Side)
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
})

export async function deleteCloudinaryImage(url: string) {
  try {
    // URL Contoh: https://res.cloudinary.com/demo/image/upload/v12345/laporan_sekolah/abcde.jpg
    
    // 1. Kita harus ambil "public_id" dari URL tersebut.
    // public_id adalah: "laporan_sekolah/abcde" (tanpa ekstensi .jpg)
    
    const splitUrl = url.split('/')
    // Ambil nama file paling belakang (abcde.jpg)
    const filenameWithExt = splitUrl[splitUrl.length - 1]
    // Ambil nama folder (laporan_sekolah) - asumsi folder ada di urutan kedua terakhir
    const folder = splitUrl[splitUrl.length - 2]
    
    // Gabungkan folder + nama file tanpa ekstensi
    const publicId = `${folder}/${filenameWithExt.split('.')[0]}`

    console.log("Menghapus Cloudinary ID:", publicId)

    // 2. Perintah Hapus ke Cloudinary
    await cloudinary.uploader.destroy(publicId)
    
    return { success: true }
  } catch (error) {
    console.error("Gagal hapus Cloudinary:", error)
    return { success: false }
  }
}
