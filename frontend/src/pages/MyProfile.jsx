import React, { useState } from 'react'
import { assets } from '../assets/assets'

const MyProfile = () => {

  const [userData, setUserData] = useState({
    name: "Edward Vincent",
    image: assets.profile_pic,
    email: 'richardjamesswap@gmail.com',
    Phone: '+1  123 456 7890',
    Address:{
      line1: "57th Cross, Richmond",
      line2: "Circle, Church Road, London"
    },
    gender:'Male',
    dob: '2000-01-20'

  }) // created the object storing the userData as a state variable, as will be changed constantly and using this we will display the information on my profiile page

  const [isEdit, setIsEdit] = useState(false) // whether user has clicked on edit button or not



  return (
    <div className ='max-w-lg flex flex-col gap-2 text-sm'>

      <img className ='w-36 rounded 'src ={userData.image} alt="" />
      {
        isEdit 
        ? 
        <input className ='bg-gray-50 text-3xl font-medium max-w-e60 mt-4' type="text" value ={userData.name} onChange={e=> setUserData(prev => ({...prev, name: e.target.value}))}/>
        : <p className ='font-medium text-3xl text-neutral-800 mt-4'>{userData.name}</p>
      }
      {/* prev = The previous/current state of [userData]MyProfile.jsx )
        It's like saying "give me the old data first"
        3. {...prev, name: e.target.value}
        This is the magic part - called the spread operator:
        // What ...prev does:
          {...prev}
          // Becomes:
          {
            name: "Edward Vincent",
            image: assets.profile_pic,
            email: 'richardjamesswap@gmail.com',
            Phone: '+1  123 456 7890',
            address: {...},
            gender: 'Male',
            dob: '2000-01-20'
          }

          // Then we override just the name:
          {...prev, name: "NEW NAME USER TYPED"}
          // Final result:
          {
            name: "NEW NAME USER TYPED",        // ← Only this changed!
            image: assets.profile_pic,          // ← These stayed the same
            email: 'richardjamesswap@gmail.com', // ← These stayed the same
            Phone: '+1  123 456 7890',          // ← These stayed the same
            address: {...},                     // ← These stayed the same
            gender: 'Male',                     // ← These stayed the same
            dob: '2000-01-20'                   // ← These stayed the same
          }

          // ❌ WRONG - This would lose all other data:
          onChange={e => setUserData({name: e.target.value})}


      */}

      <hr className='bg-zinc-400 h-[1px] border-none'/>

      <div>
        <p className ='text-neutral-500 underline mt-3'>CONTACT INFORMATION</p>
        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700'>
          <p className ='font-medium'>Email id:</p>
          <p className ='text-blue-500'>{userData.email}</p>
          <p className ='font-medium'>Phone:</p>

          {
          isEdit 
          ? 
          <input className ='bg-gray-100 max-w-52' type="text" value ={userData.Phone} onChange={e=> setUserData(prev => ({...prev, Phone: e.target.value}))}/>
          : <p className='text-blue-400'>{userData.Phone}</p>
          }

          <p className ='font-medium'>Address: </p>
          {
            isEdit
            ?
            <p>
              <input className ='bg-gray-50' onChange={e => setUserData(prev => ({...prev, Address: {...prev.Address, line1: e.target.value}}))} value ={userData.Address.line1} type="text" />
              <br />
              <input className ='bg-gray-50' onChange={e => setUserData(prev => ({...prev, Address: {...prev.Address, line2: e.target.value}}))} value ={userData.Address.line2} type="text" />
            </p>
            :
            <p className ='text-gray-500'>
              {userData.Address.line1} <br />
              {userData.Address.line2}
              
            </p>
          }
          
        </div>
      </div>
      
      <div>
        <p className ='text-neutral-500 underline mt-3'>BASIC INFORMATION</p>
        <div className='grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700'>
          <p className ='font-mdeium'>Gender:</p>

           {
          isEdit 
          ? 
          <select className='max-w-20 bg-gray-100' onChange={e => setUserData(prev => ({...prev, gender: e.target.value}))} value ={userData.gender}>
            <option value ="Male"> Male</option>
            <option value ="Female"> Female</option>
          </select>

          : <p className='text-gray-400'>{userData.gender}</p>
          }

          <p className='font-medium'>Birthday</p>

          {
            isEdit ? <input className ='max-w-26 bg-gray-100' type="date" onChange={e => setUserData(prev => ({...prev, dob: e.target.value}))} value={userData.dob} />
            :
            <p className='text-gray-400'>{userData.dob}</p>
          }
        </div>
      </div>
      <div className ='mt-10'>
        {
          isEdit ?
          <button className ='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all' onClick ={()=>setIsEdit(false)}>Save information</button>
          :
          <button className ='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all' onClick ={()=>setIsEdit(true)}>Edit</button>
        }
      </div>


    </div>
  )
}

export default MyProfile