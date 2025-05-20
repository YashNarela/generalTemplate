

import React, { useState } from 'react'
import { Link } from 'react-router'
import { GiHamburgerMenu } from "react-icons/gi";
import { RxCross1 } from "react-icons/rx";

import "../css/Navbar.css"
import { useRef } from 'react';
const TopNavbar = () => {

    const href = useRef(null);
    const dref = useRef(null);

    const [isOpen, setIsOpen] = useState(false);




    const handleMenuClick = () => {


        setIsOpen(!isOpen);

        href.current.classList.toggle("active");

        dref.current.classList.toggle("active");

    }


    return (
        <>

            <header className="header">

                <Link to="/" className="logo">

                    <span>Logo</span>

                </Link>

                {

                    isOpen ? (

                        <>
                            <RxCross1 className='menu-icon' onClick={handleMenuClick} />
                        </>
                    ) : (
                        <>
                            <GiHamburgerMenu className='menu-icon' onClick={handleMenuClick} />
                        </>
                    )

                }



                <nav className="navbar" ref={href} >


                    <Link to="home" className="nav-link">Home</Link>

                    <Link to="about" className="nav-link">About</Link>

                    <Link to="insert" className="nav-link">Insert</Link>

                    <Link to="display" className="nav-link">Display</Link>
                    <Link to="login" className="nav-link">Login</Link>
                </nav>




            </header>


            <div className="nav-bg" ref={dref} onClick={handleMenuClick}>

            </div>








        </>
    )
}

export default TopNavbar

// < Navbar bg = "dark" data - bs - theme="dark" >
//     <Container>

//         <Navbar.Brand as={Link} to="home">Navbar</Navbar.Brand>

//         <Nav className="me-auto">

//             <Nav.Link as={Link} to="home">Home</Nav.Link>
//             <Nav.Link as={Link} to="insert">Insert</Nav.Link>
//             <Nav.Link as={Link} to="display">Display</Nav.Link>
//             <Nav.Link as={Link} to="login">Login</Nav.Link>
//             <Nav.Link as={Link} to="logout">Logout</Nav.Link>

//         </Nav>
//     </Container>

