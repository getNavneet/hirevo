import Header from './components/Header/Header'
import Footer from './components/Footer/Footer'
import { Outlet, useLocation } from 'react-router-dom'

function Layout() {
  const location = useLocation();
  const hideLayout = location.pathname.startsWith('/interviewRoom');

  return (
    <>
     {!hideLayout && <Header />}
      <Outlet />
      {!hideLayout && <Footer />}
    </>
  )
}

export default Layout
//header aur footer hamesha rahega bus "outlet" ki help se beech ka content change hoga 