import React from 'react'
import Login from './pages/login'
 import { ToastContainer, toast } from 'react-toastify';
 import 'react-toastify/dist/ReactToastify.css';
import { useContext } from 'react';
import { AdminContext } from './context/AdminContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/admin/Dashboard';
import AllAppointments from './pages/admin/AllAppointments';
import DoctorsList from './pages/admin/DoctorsList';
import AddDoctor from './pages/admin/AddDoctor';


const App = () => {

  const {aToken} = useContext(AdminContext)


  return aToken ? (
    <div className='bg-[#F8F9FD]' >
      <Navbar />
      <div className = 'flex items-start'>
        <Sidebar />
        <Routes>
          <Route path ='/' element ={<></>} />
          <Route path ='/admin-dashboard' element ={<Dashboard />} />
          <Route path ='/all-appointments' element ={<AllAppointments />} />
          <Route path ='/doctor-list' element ={<DoctorsList />} />
          <Route path ='/add-doctor' element ={<AddDoctor />} />


        </Routes>
      </div>
     
      <ToastContainer />
    </div>
  ) : (
    <>

     <Login />
      <ToastContainer />
    
    
    </>
  )
}

export default App