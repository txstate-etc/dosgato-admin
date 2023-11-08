import waitOn from 'wait-on'

const baseURL = 'http://dosgato-proxy-test'
const adminurl = process.env.DOSGATO_ADMIN_BASE ?? `${baseURL}/.admin`
const authurl = process.env.AUTH_REDIRECT ?? 'http://fakeauth-test/login?clientId=dosgato-admin-test&returnUrl=http%3A%2F%2Fdosgato-proxy-test%2F%2Eadmin'
const apiurl = process.env.API_BASE ?? `${baseURL}/.api`
const renderurl = `${process.env.RENDER_BASE ?? baseURL}/.token`

const opts = {
  resources: [
    adminurl,
    authurl,
    apiurl,
    renderurl
  ],
  delay: 1000,
  interval: 100,
  simultaneous: 1,
  timeout: 40000,
  tcpTimeout: 1000,
  window: 1000, // stabilization time in ms
  log: true,
  proxy: false,
  strictSSL: false,
  followRedirect: true,
  headers: {
    'x-custom': 'headers'
  },
  validateStatus: function (status) {
    return status >= 200 && status < 300
  }
}

export async function serverStartupCheck () {
  try {
    await waitOn(opts)
    console.log('==============================================================\nAll resources are available, servers started successfully.\n==============================================================')
  } catch (err) {
    console.log(err, 'Server startup failed. Exiting ......')
    process.exit(1)
  }
}
