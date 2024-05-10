const title = 'Crypto Idol'
const url = 'https://cryptoidol.tech/'
const description = 'Are you the next crypto idol?'
const author = 'ezkl'
const twitter = '@ezklxyz'

export default function Head() {
  return (
    <>
      {/* Recommended Meta Tags */}
      <meta charSet='utf-8' />
      <meta name='language' content='english' />
      <meta httpEquiv='content-type' content='text/html' />
      <meta name='author' content={author} />
      <meta name='designer' content={author} />
      <meta name='publisher' content={author} />

      {/* Search Engine Optimization Meta Tags */}
      <title>{title}</title>
      <meta name='description' content={description} />
      <meta
        name='keywords'
        content='AI,Competition,Fun'
      />
      <meta name='robots' content='index,follow' />
      <meta name='distribution' content='web' />
      {/* 
      Facebook Open Graph meta tags
        documentation: https://developers.facebook.com/docs/sharing/opengraph */}
      <meta property='og:title' content={title} />
      <meta property='og:type' content='website' />
      <meta property='og:url' content={url} />
      <meta property='og:image' content={`${url}icons/share.png`} />
      <meta property='og:site_name' content={title} />
      <meta property='og:description' content={description} />

      <link rel='apple-touch-icon' href='/icons/apple-touch-icon.png' />
      <link rel='apple-touch-icon' sizes='16x16' href='/icons/favicon-16x16.png' />
      <link rel='apple-touch-icon' sizes='32x32' href='/icons/favicon-32x32.png' />
      <link rel='apple-touch-icon' sizes='180x180' href='/icons/apple-touch-icon.png' />

      <link rel='manifest' href='/manifest.json' />
      <link rel='mask-icon' color='#000000' href='/icons/safari-pinned-tab.svg' />
      <link rel='apple-touch-startup-image' href='/icons/share.png' />
      <link rel="icon" type="image/x-icon" href="favicon.ico" />

      {/* Meta Tags for Mobile */}
      <meta name='viewport' content='width=device-width, initial-scale=1.0, viewport-fit=cover' />
      <meta name='theme-color' content='#000' />
      <link rel='apple-touch-startup-image' href='/icons/share.png' />

      {/* Twitter Summary Card */}
      <meta name='twitter:card' content='summary_large_image' />
      <meta name='twitter:site' content={twitter} />
      <meta name='twitter:title' content={title} />
      <meta name='twitter:description' content={description} />
      <meta name='twitter:image' content={`${url}icons/share.png`} />

    </>
  )
}
