import React, { useContext } from 'react'
import { AppContext } from '../context/AppContext'
import { useState } from 'react'
import { useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'


const MyAppointments = () => {

  const {backendUrl, token, getDoctorsData} = useContext(AppContext)

  const [appoitnments, setAppointments] = useState([])

  const navigate = useNavigate();

  const months = [" ", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

  const slotDateformat = (slotDate) => {

    const dateArray = slotDate.split('_')
    return dateArray[0]+ " " + months[Number(dateArray[1])] + " " + dateArray[2]

  }

  const getUserAppointments = async () => {

    try {
      const {data} = await axios.get(backendUrl + '/api/user/appointments', {headers:{token}})
      if(data.success){
        //storing the appoiintment data

        setAppointments(data.appointments.reverse()) //get the appointments from the backend and store in the state variable
        // we are getting the appoitnments in the reverse order means the recent one at the bottom so we will reverse it

        console.log(data.appointments)


      }
    } catch (error) {

      console.log(error)
      toast.error(error.message)

    }
  }

  const cancelAppointment = async (appointmentId) => {
    try {
  //    console.log(appointmentId)  //getting the appointment id on clicking cancel button
  const {data} = await axios.post(backendUrl + '/api/user/cancel-appointment', {appointmentId}, {headers: {token}})
  
  if(data.success){
    toast.success(data.message)

    getUserAppointments() // to refresh the appointments list after cancelling an appointment
    getDoctorsData() // to refresh the doctors data to update the slots booked

  }else{
    toast.error(data.message)
  }
      
    } catch (error) {

      console.log(error)
      toast.error(error.message)
      
    }
  }

  const initPay = (order) => {

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: order.amount,
      currency: order.currency,
      name:'Appointment Payment',
      description:'Appointment Payment',
      order_id: order.id,
      receipt: order.receipt,

      //whenever the payments get successfull this handler will be called
      handler: async (response) => {

        console.log(response)

        try {

          const {data} = await axios.post(backendUrl + '/api/user/verify-razorpay', response, {headers: {token}})

          if(data.success){
            toast.success("Payment Successful!")
            getUserAppointments() // to refresh the appointments data after successful payment
          } else {
            toast.error(data.message || "Payment verification failed")
          }
          
        } catch (error) {
          console.log(error)
          toast.error(error.message)
        }



      }
    }

    const rzp = new window.Razorpay(options)
    rzp.open()


  }

  const appointmentRazorpay = async (appointmentId) => {
    try {

      const {data} = await axios.post(backendUrl + '/api/user/payment-razorpay', {appointmentId}, {headers: {token}})

      if(data.success){
       initPay(data.order)
      }
      
    } catch (error) {
      
    }

  }

  useEffect(() => {
    if(token){
      getUserAppointments()
    }

  }, [token])
  return (
    <div>
      <p className ='pb-3 mt-12 font-medium text-zinc-700 border-b'>My Appointments</p>

      <div>
        {
          appoitnments.map((item, index)=>(
            <div className ='grid grid-cols-[1fr_2fr] gap-4 sm:flex sm:gap-6 py-2 border-b' key={index}>
              <div>
                <img className ='w-32 bg-indigo-50' src ={item.docData.image} alt="" />
              </div>

              <div className='flex-1 text-sm text-zinc-600'>

                <p className='text-neutral-800 font-semibold'>{item.docData.name}</p>
                <p>{item.docData.speciality}</p>
                <p className='text-zinc-700 font-medium mt-1'> Address:</p>
                <p className ='text-xs'>{item.docData.address.line1}</p>
                <p className ='text-xs'>{item.docData.address.line2}</p>
                <p className='text-xs mt-1'><span className='text-sm text-neutral-700 font-medium'>Date & Time:</span> {slotDateformat(item.slotDate)} | {item.slotTime}</p>
                
              </div>
              
              {/* we have added this empty div at bottom left on image on mobile using grid thats why we will get our buttons at right side */}

              <div></div>

              <div className='flex flex-col gap-2 justify-end'>
                {/* Completed Appointment */}
                {item.isCompleted && <button className='sm:min-w-48 py-2 border border-green-500 rounded text-green-500'>Completed</button>}
                
                {/* Cancelled Appointment */}
                {item.cancelled && !item.isCompleted && <button className = 'sm:min-w-48 py-2 border border-red-500 text-red-500'>Appointment Cancelled</button>}
                
                {/* Active Appointments - Show Pay Online and Cancel */}
                {!item.cancelled && !item.isCompleted && !item.payment && (
                  <>
                    <button onClick ={() => appointmentRazorpay(item._id)} className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-primary hover:text-white transition-all duration-300'>Pay Online</button>
                    <button onClick = {() => cancelAppointment(item._id)} className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300'>Cancel Appointment</button>
                  </>
                )}
                
                {/* Paid Appointments - Show Paid and Cancel */}
                {!item.cancelled && !item.isCompleted && item.payment && (
                  <>
                    <button className ='sm:min-w-48 py-2 border rounded text-stone-500 bg-indigo-100'>Paid</button>
                    <button onClick = {() => cancelAppointment(item._id)} className='text-sm text-stone-500 text-center sm:min-w-48 py-2 border rounded hover:bg-red-600 hover:text-white transition-all duration-300'>Cancel Appointment</button>
                  </>
                )}

              </div>
              


            </div>

          ))
        }


      </div>
    </div>
  )
}

export default MyAppointments