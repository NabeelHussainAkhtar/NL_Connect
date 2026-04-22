import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.connect.nl',
  appName: 'NL Connect',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  plugins: {
    StatusBar: {
      style: 'Dark',
      backgroundColor: '#00000000',
      overlaysWebView: true,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '266726340387-s2ht6si4jc48qe0l3aoami187mcb4lb2.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
}

export default config
