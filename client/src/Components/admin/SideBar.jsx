import React, { useRef, useState,useEffect } from 'react'
import "../../css/Sidebar.css"

import { CiSearch } from "react-icons/ci";
import { Link } from 'react-router';
import { MdDashboard } from "react-icons/md";
import { FaMoon } from "react-icons/fa";
const SideBar = () => {

    const href = useRef(null)

    const tref = useRef(null)



    const [toggle, setToggle] = useState(true);


    const handleThemeToggle = () => {


        document.body.classList.toggle('dark-theme');
    }


    useEffect(() => {


        handleToggle()
    },[])



    const handleToggle = () => {


        href.current.classList.toggle('collapsed')



    }


    return (


        <>

          

            <aside className='sidebar' ref={href}>

                <header className='sidebar-header' >

                    <img src="" alt="yashNarela" className='header-logo' />

                    <button className="sidebar-toggle" onClick={handleToggle} >
                        <span className="material-symbols-outlined">
                            chevron_backward
                        </span>

                    </button>


                </header>

                <div className="sidebar-content">


                    <form action="" className='search-form'>
                        <CiSearch />

                        <input type="search" placeholder='...search' />





                    </form>


                    <ul className='menu-list'>

                        <li className="menu-item">
                            <Link className='menu-link active'   >
                                <MdDashboard />

                                <span className="menu-label">products</span>

                            </Link>

                        </li>

                        <li className="menu-item">
                            <Link className='menu-link'   >
                                <MdDashboard />

                                <span className="menu-label">Favourites</span>

                            </Link>

                        </li>

                        <li className="menu-item">
                            <Link className='menu-link'   >
                                <MdDashboard />

                                <span className="menu-label">Notifications</span>

                            </Link>

                        </li>

                        <li className="menu-item">
                            <Link className='menu-link'   >
                                <MdDashboard />

                                <span className="menu-label">Orders</span>

                            </Link>

                        </li>

                        <li className="menu-item">
                            <Link className='menu-link'   >
                                <MdDashboard />

                                <span className="menu-label">Analytics</span>

                            </Link>

                        </li>

                        <li className="menu-item">
                            <Link className='menu-link'   >
                                <MdDashboard />

                                <span className="menu-label">Dashboard</span>

                            </Link>

                        </li>


                    </ul>


                    {/* sidebar footer */}


                    <div className="sidebar-footer">

                        <button className="theme-toggle" onClick={handleThemeToggle} >

                            <div className="theme-label">
                                <FaMoon />
                                <span className="theme-text">Dark Mode</span>


                            </div>

                            <div className="theme-toggle-track">
                                <div className="theme-toggle-indicator">


                                </div>
                            </div>
                        </button>


                    </div>

                </div>



            </aside>
     
        </>
    )
}

export default SideBar