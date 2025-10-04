import React, { useState } from 'react'

const Login = () => {

  const[state, setState] = useState('Sign Up') // for login state
  const[email, setEmail] = useState('')
  const[password, setPassword] = useState('')
  const[name, setName] = useState('')


const onSubmitHandler = async(event) => {
  event.preventDefault(); //whenever we will submit the form it will not refresh the page


}
  
  return (
    <form className='min-h-[80vh] flex items-center'>
      <div className = 'flex flex-col gap-3 m-auto items-start p-8 min-w-[340px] sm:min-w-96 border rounded-xl text-zinc-600 text-sm shadow-lg'>
        <p className ='text-2xl font-semibold'> {state === 'Sign Up' ? "Create Account" : "Login"}</p>
        <p>Please {state === 'Sign Up' ? "sign up": "log in"} to book an appointment</p>
        {/*when State = signup then only display this div */}
        {

          
          state === "Sign Up" && 
          <div className ='w-full'> 

          <p>Full Name</p>

          {/* making an input field based on which state changes, This is the event handler that runs every time user types: Breaking it down e = Event object (contains info about what happened)
          e.target = The input element that triggered the event
          e.target.value = The current text inside the input field
          setName(...) = Updates the [name]Login.jsx ) state with new value*/}

          <input className ='border border-zinc-300 rounded w-full p-2 mt-1' type ="text" onChange ={(e)=>setName(e.target.value)} value ={name} />
        </div>
        }

        
        

        <div className ='w-full'>

          <p>Email</p>
          <input className ='border border-zinc-300 rounded w-full p-2 mt-1'  type ="Email" onChange ={(e)=>setEmail(e.target.value)} value ={email} />

        </div>

         <div className ='w-full'> 

          <p>Password</p>
          <input className ='border border-zinc-300 rounded w-full p-2 mt-1'  type ="password" onChange ={(e)=>setPassword(e.target.value)} value ={password} />

        </div>
        <button className ='bg-primary text-white w-full py-2 rounded-md tex-base'>{state === 'Sign Up' ? "Create Account" : "Login"}</button>
        {
          state === "Sign Up" ? <p>Already have an account? <span onClick={()=>setState('Login')} className ='text-primary underline cursor-pointer'>Login here</span></p> : <p>Create a new account? <span onClick={()=>setState('Sign Up')} className ='text-primary underline cursor-pointer'>click here</span> </p>
        }
      </div>


    </form>
  )
}

export default Login