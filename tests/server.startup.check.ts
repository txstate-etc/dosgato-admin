import waitOn from 'wait-on'

const adminurl = process.env.DOSGATO_ADMIN_BASE
const authurl = process.env.AUTH_REDIRECT
const apiurl = process.env.API_BASE
const renderurl = `${process.env.RENDER_BASE}/.token`

const opts = {
  resources: [
    adminurl,
    authurl,
    apiurl,
    renderurl
  ],
  delay: 1000, // initial delay in ms, default 0
  interval: 100, // poll interval in ms, default 250ms
  simultaneous: 1, // limit to 1 connection per resource at a time
  timeout: 40000, // timeout in ms, default Infinity
  tcpTimeout: 1000, // tcp timeout in ms, default 300ms
  window: 1000, // stabilization time in ms, default 750ms
  log: true,
  proxy: false,
  strictSSL: false,
  followRedirect: true,
  headers: {
    'x-custom': 'headers'
  },
  validateStatus: function (status) {
    return status >= 200 && status < 300 // default if not provided
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
