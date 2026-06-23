import React from 'react'
import { assets } from '../assets/assets'

const Footer = () => {
  return (
    <div className ='md:mx-10'>
      <div className = 'flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>
         {/* left side */}
         <div>
          <img className ='mb-5 w-40' src={assets.logo} alt="" />


          <p className ='w-full md:w-2/3 text-gray-600 leading-6'>Prescripto provides trustworthy, patient-centered healthcare solutions. We connect you with experienced medical professionals, simplify appointment scheduling, and deliver clear information so you can make confident health decisions. Our platform is designed to make quality care accessible and convenient for everyone.</p>

         </div>
         {/* Center Section */}
         <div>

          <p className = 'text-xl font-medium mb-5'>COMPANY</p>
          <ul className='flex flex-col gap-2 text-gray-600'>

            <li>Home</li>
            <li>About us</li>
            <li>Contact us</li>
            <li>Privacy policy</li>

          </ul>
          
         </div>
         {/* Right side */}
         <div>
          <p className = 'text-xl font-medium mb-5'>GET IN TOUCH</p>


          <ul className='flex flex-col gap-2 text-gray-600'>
            <li>+1-212-456-7890</li>
            <li>greatstackdev@gmail.com</li>

          </ul>
          
         </div>
      </div>
      {/*Copyright */}
      <div>
        <p className ='py-5 text-sm text-center'>© 2025 Prescripto. All rights reserved.</p>
      </div>
    </div>
  )
}

export default Footer