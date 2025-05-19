import React from 'react'
import Navbar from './Components/Navbar'
import { Outlet } from 'react-router'
import Footer from './Components/Footer'

const Layout = () => {
    return (
        <>


            <Navbar />

            <Outlet/>

            <Footer/>

        </>
    )
}

export default Layout
