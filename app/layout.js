import './globals.css'

export const metadata = {
  title: 'Urlaubsplaner',
  description: 'Plane deinen Urlaub mit Freunden und Familie',
}

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body>{children}</body>
    </html>
  )
}