/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'i.sozcu.com.tr', 
      'i.hurriyet.com.tr', 
      'icdn.turkiyegazetesi.com.tr', 
      'im.haberturk.com', 
      'picsum.photos',
      'foto.haberler.com',
      'img.posta.com.tr',
      'imgrosetta.mynet.com.tr',
      'img.milliyet.com.tr',
      'iatkv.tmgrup.com.tr',
      'i4.hurimg.com',
      'cdnuploads.aa.com.tr',
      'cdnimages.milliyet.com.tr',
      'static.daktilo.com',
      'i01.sozcucdn.com',
      'static-img.haberler.com',
      'img-s-msn-com.akamaized.net',
      'iasbh.tmgrup.com.tr',
      'images.bursadabugun.com'
    ],
  },
}

module.exports = nextConfig 