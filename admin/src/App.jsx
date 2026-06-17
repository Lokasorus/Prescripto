import React from 'react'
import Login from './pages/Login'
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
import { DoctorContext } from './context/DoctorContext';
import DoctorAppointments from './pages/doctor/DoctorAppointments';
import DoctorProfile from './pages/doctor/DoctorProfile';
import DoctorDashboard from './pages/doctor/DoctorDashboard';


const App = () => {

  const {aToken} = useContext(AdminContext)
  const {dToken} = useContext(DoctorContext)


  return aToken || dToken? (
    <div className='bg-[#F8F9FD]' >
      <Navbar />
      <div className = 'flex items-start'>
        <Sidebar />
        <Routes>

          {/* ADMIN ROUTE*/ }
          <Route path ='/' element ={<></>} />
          <Route path ='/admin-dashboard' element ={<Dashboard />} />
          <Route path ='/all-appointments' element ={<AllAppointments />} />
          <Route path ='/doctor-list' element ={<DoctorsList />} />
          <Route path ='/add-doctor' element ={<AddDoctor />} />

          {/* DOCTOR ROUTE*/ }
           <Route path ='/doctor-appointments' element ={<DoctorAppointments />} />
           <Route path ='/doctor-profile' element ={<DoctorProfile />} />
           <Route path ='/doctor-dashboard' element ={<DoctorDashboard />} />


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
