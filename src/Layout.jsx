import React from 'react'
import Header from './components/Header/Headersimple'
import Footer from './components/Footer/Footer'
import { Outlet } from 'react-router-dom'

function Layout() {
  return (
    <>
    <Header/>
    <Outlet />
    <Footer />
    </>
  )
}

export default Layout
//header aur footer hamesha rahega bus "outlet" ki help se beech ka content change hoga 