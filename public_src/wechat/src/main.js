import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'
import route from './routers'
import App from './wechatApp'
import * as filters from './filters'

Vue.use(VueResource)
Vue.use(VueRouter)
var router = new VueRouter()

let token = window.localStorage.getItem('token')

Vue.http.options.root = 'http://localhost:3000/api'
// Vue.http.options.xmly = 'http://localhost:3000/api/ximalaya'
Vue.http.options.xmly = 'http://192.168.100.16:3000/api/ximalaya'

Vue.http.headers.common['Authorization'] = 'Basic ' + token

// register filters
Object.keys(filters).forEach(function (k) {
  Vue.filter(k, filters[k])
})

// config router
router.map(route)
router.start(App, '#app')
