import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppContext } from '../context/AppContext';
import { assets } from '../assets/assets';
import RelatedDoctors from '../components/RelatedDoctors';
import { toast } from 'react-toastify';
import axios from 'axios';

const Appointment = () => {
  const {docId} =  useParams()
  const {doctors, currencySymbol, backendUrl, token, getDoctorsData} = useContext(AppContext)

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const navigate = useNavigate();

  //creating statevariable to store changing doc variable acc to docID
  const [docInfo, setDocInfo] = useState(null)
  const [docSlots, setDocSlots] = useState([]); //to store the slots of the doctor
  const [slotIndex, setSlotIndex] = useState(0); //to store the index of the selected slot
  const [slotTime, setSlotTime] = useState('') //to store the time of the selected slot




  //finding the particular doctor whose id matches the id in the url

  const fetchDocInfo = async () => {

      const docInfo = doctors.find(doc=> doc._id === docId)
      console.log(docInfo)

      setDocInfo(docInfo)
  }

  //whenever the docInfo get changes we will execute this function there fore creating a useeffect for this purpose
  const getAvailableSlots = async () => {
    //guard clause - don't proceed if docInfo is not available
    if (!docInfo) {
      return;
    }

    //setting the slots of the doctor empty
    setDocSlots([]);
    //getting current date
    let today = new Date();

    for(let i = 0; i<7; i++){
      //getting date with index
      let currentDate = new Date(today);
      currentDate.setDate(today.getDate() + i);

      //setting and time of the date with index
      let endTime = new Date()
      endTime.setDate(today.getDate()+i)
      endTime.setHours(21,0,0,0)

      //setting hours
      if(today.getDate() === currentDate.getDate()){
        //if current time is 1 pm then slots will start from after that
        currentDate.setHours(currentDate.getHours()>10 ? currentDate.getHours()+1 : 10)
        currentDate.setMinutes(currentDate.getMinutes()>30 ? 30:0)
      }else{
        currentDate.setHours(10)
        currentDate.setMinutes(0)
      }

      let timeSlots = []

      while(currentDate <= endTime){
        //creting the slot in every thirty minutes intervals
        let formattedTime = currentDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})

        let day = currentDate.getDate()
        let month = currentDate.getMonth()+1
        let year = currentDate.getFullYear()

        const slotDate = day + "_" + month + "_" + year 
        const slotTime = formattedTime

        const isSlotAvailable = docInfo.slots_booked[slotDate] && docInfo.slots_booked[slotDate].includes(slotTime) ? false: true;
        
        if(isSlotAvailable){


           //add slot to array
           timeSlots.push({
             dateTime: new Date(currentDate),
            time: formattedTime
           })
        }


       

        //incrementing the time by 30 minutes
        currentDate.setMinutes(currentDate.getMinutes() + 30)


      }

      setDocSlots(prev => ([...prev, timeSlots]))
    }

  }

  const bookAppointment =  async () => {
    if(!token) { 
      // checking if token is there or not
      toast.warn('Login to book appoitnment')
      return navigate('/login')


    }
    try {

      const date = docSlots[slotIndex][0].dateTime //getting the date from the selected slot index

      let day = date.getDate()
      let month = date.getMonth()+1 //month is zero based index
      let year = date.getFullYear()

      const slotDate = day + "_" + month + "_" + year

      
      //api call to book the appointment

      const { data } = await axios.post(backendUrl + '/api/user/book-appointment', {docId, slotDate, slotTime}, {headers: { token}}) // providing the body and headers for backend to take from

      if(data.success){
        toast.success(data.message)
        getDoctorsData()
        //send the users on my appointment page
        navigate('/my-appointments')
      } else {
        toast.error(data.message)
      }




      
    } catch (error) {

      console.log(error)
      toast.error(error.message)
      
    }

    //linkiing this function to bookapppointment button




  }

  useEffect(() => {

    fetchDocInfo()

  }, [doctors, docId])

  useEffect(() => {
    getAvailableSlots();

  }, [docInfo])

  useEffect(() => {
    console.log(docSlots)
  }, [docSlots])

  return docInfo && ( //Render only if docInfo is available
    <div>

      {/* Doctor details */}
      <div className = 'flex flex-col sm:flex-row gap-4'>

        <div>

          <img className ='bg-primary w-full sm:max-w-72 rounded-lg' src ={docInfo.image} alt ="" />
          
        </div>

        <div className ='flex-1 border border-gray-400 rounded-lg p-8 py-7 bg-white mx-2 sm:mx-0 mt-[-80px] sm:mt-0'>

          {/* DocInfo contains all details of the doctor whose id matches the id in the url */}
          <p className =' flex items-center gap-2 text-2xl font-medium text-gray-900'>{docInfo.name}
             <img className ='w-5' src = {assets.verified_icon} alt ="" /></p>

             <div className ='flex items-center gap-2 text-sm mt-1 text-gray-600'>
              
                <p>{docInfo.degree} - {docInfo.speciality}</p>
                <button className ='py-0.5 px-2 border text-xs rounded-full'>{docInfo.experience}</button>

             </div>

             {/* Doctor about */}
             <div>

              <p className ='flex items-center gap-1 text-sm font-medium text-gray-900 mt-3'> About <img src ={assets.info_icon} alt ="" /></p>
              <p className ='text-sm text-gray-500 max-w-[-700px] mt-1'>
                {docInfo.about}
                </p>

             </div>
             <p className = 'text-gray-500 font-medium mt-4'>Appointment fee: <span className ='text-gray-600'>{currencySymbol}{docInfo.fees}</span></p>

        </div>

      </div>
      {/* Booking section */}
      <div className = 'sm:ml-72 sm:pl-4 mt-4 font-medium text-gray-700'>

        <p>Booking slots</p>

        <div className ='flex gap-3 items-center w-full overflow-x-scroll mt-4'>
          {/*checking if docSlots is not empty then only map through it */}
          { 
            docSlots.length && docSlots.map((item, index)=>(

              <div onClick = {()=> setSlotIndex(index)} className ={`text-center py-6 min-w-16 rounded-full cursor-pointer ${slotIndex === index? 'bg-primary text-white' : 'border border-gray-200'}`} key={index}>

                
                <p>{item[0] && daysOfWeek[item[0].dateTime.getDay()]}</p> {/*checking if item[0] exists then only get the day from it*/}
                <p>{item[0] && item[0].dateTime.getDate()}</p>
              </div>

            ))
          }
        </div>

        <div className = 'flex items-center gap-3 w-full overflow-x-scroll mt-4'>
          {/*getting inside the selected slot index and mapping through the time slots available on that day */}
          { 
            docSlots.length && docSlots[slotIndex].map((item, index) => (

              <p onClick = {()=> setSlotTime(item.time)} className ={`text-sm font-light flex-shrink-0 px-5 py-2 rounded-full cursor-pointer ${item.time === slotTime ?'bg-primary text-white' : 'text-gray-400 border border-gray-300'}`} key ={index}>{item.time.toLowerCase()}</p>


            ))
          }
        </div>
        <button onClick = {bookAppointment} className ='bg-primary text-white text-sm font-light px-14 py-3 rounded-full my-6'> Book an appoinment</button>

      </div>

      {/* Related doctors section by passsing props*/}

      <RelatedDoctors docId={docId} speciality={docInfo.speciality} />
    </div>
  )
}

export default Appointment