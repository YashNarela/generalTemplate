import { useState } from 'react'
import './App.css'

import { BrowserRouter, Routes, Route } from "react-router";
import Layout from './Layout';
import Home from './Pages/Home';
import Insert from './Pages/Insert';
import Display from './Pages/Display';
import Login from './Pages/Login';
import Logout from './Pages/Logout';
import Slice from './Pages/Slice';
import SideBar from './Components/admin/SideBar';
import TopNavbar from './Components/Navbar';
import CardGui from './Pages/CardGui';
function App() {
  const [count, setCount] = useState(0)

  return (
    <>

      <BrowserRouter>


        <Routes>

          <Route path='/' element={<CardGui/>}>

            {/* <Route index element={<Home />} />
            <Route path='home' element={<Home />} />
            <Route path='insert' element={<Insert />} />
            <Route path='display' element={<Display />} />
            <Route path='login' element={<Login />} />
            <Route path='logout' element={<Logout />} />
         
            <Route path='/slice' element={<Slice />} /> */}


          </Route>
        </Routes>
      </BrowserRouter>


    </>
  )
}

export default App
