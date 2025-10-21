Prescripto - iam mentioning the setup procedure etc, for details about code that what does a cod do how we are implementing certain functions, refer to the code file itself there i have written various comments which you can refer to get the idea



1\) IN INTEGRATED TERMINAL npm create vite@latest - add project name and framework and created frontend folder

2)npm install - installing dependencies in frontend project

3)npm install axios reaact-router-dom react-toastify

4\) clear the project file changed title etc

5\) installing tailwind through NPM INSTALL -D TAILWINDCSS@3 POSTCSS AUTOPREFIXER

6\) crating tailwind config file - npm tailwindcss init -p, editing config - // tailwind.config.js

/\*\* @type {import('tailwindcss').Config} \*/

export default {

  content: \[

    "./index.html",

    "./src/\*\*/\*.{js,ts,jsx,tsx}",

  ],

  theme: {

    extend: {},

  },

  plugins: \[],

}



7\) add this in index.css

/\* src/index.css \*/



@tailwind base;

@tailwind components;

@tailwind utilities;

8\) copied assets into assets folder for frontend, in the assets.js we imported all the images and exported it into assets object, also has speciality data object, and doctors object with doctors information



9)creating folder hierarchy inside src, created components to create components like navbar etc and reuse it again

10\) add pages for adding multiple pages, for that to happen we have to get react router dom support

 	for that go to main.jsx nd import {BrowserRouter} from 'react-router-dom' replace the strict mode with browserrouter



11)create another folder in src CONTEXT - where we will manage user login and other context data

12)Creating multiple pages - Home, doctors, about, contact, Login, Profile, Appointmets with rafce

13)open figma to see the design of pages

14)setting up our routes in app.jsx

15)Gave some amrgine using mx-4 sm:mx-\[10%]

imported routes and route , adding path to the routes by <route path='/' element ={<Home />}>

<Route path='/doctors/:speciality'  using speciality parameter here



16\) starting building componenets

navbar.jsx in componenets - displaying navbar over all pages in appjsx

writing navbar code in navbar.jsx go through it, refer figma design for dimensions

17\) see how the componenet name should be capitalized and syntax to write different types of components

18\) giving css to navbar

19\) styled navbar components using tailwind, have to learn css and tailwind to understand the commands

20\) active page used to underline effect, pasted .active hr{

    @apply block

} in index.css

21\) editing button in navbar

22)redirecting button to login page

23)creating ui for profile picture by creating two state variables  showmenu and setshowmenu in navbar

24\) completed navbar, with design and redirecting functionalities and also create account token seetings on logout and login

25\) creating header page -- two sections in header left and right with suitable hover feature and alignment

26\) creating speciality section using assets.js speciality data array by some unique code .map something

 	making scrollbar hidden through index.css

27)making TopDOctors page, diplaying doctors array data in assets in TOP DOCtors page

28)giving css to each element in topdoctors section then using grid and making custom tailwind props for grids in tailwind config

29\) making APPCONTEXT and giving context support to our main .jsx file

30)making banner component same things

31)making footer componenet and mounting in APP.jsx to make it visible in all the pages, and then homepage done, now adding custom fonts to improve the ui of our home page.



===================CREATING ALL DOCTORS PAGE===================

1\) get the parameter using useparams hook

so when we directly move to alldoctors the speciality parameter will be undefined and we will show all doctors but if we click on speciality on home page then we will show doctors with that speciality only;

2\) creating the page design and using this state const \[filterDoc, setFilterDoc] = useState(\[]); to list the doctor according to their speciality

copying the ui from topdoctors.jsx file, and then adding doctors in filterDOC array according to their speciality



making applyfilter function and useeffect

adding dynamic classname into speciality section using{} and `

creating toggle highlighting filter bar for specialities



URL DRIVES THE FILTERING





ALLL DOCTORS PAGE READY



==================--------------DESIGNING APPOINTMENT PAGE --------=======================



clicking on any doctors in homepage redirects us to the appointment/docid page



1\) making appointment page by using state variable to store docinfo from parameters of docid and displaying info of that doc and creating css of displayed info then creating context for $ sign as we are going to use that sign at various places so making

2\) currency context in appcontxt

3\) creating booking slots ui

to create this we have to get the data of 7 days from current date and time form current time, storing the data into state variables then creating the function to calculate the data ( getAVailableSlots function)



getAvailableSlots function explanation



This resets the state variable docSlots to an empty array (likely setDocSlots is a React state setter from useState).

today is a Date object representing the current date and time, using the machine’s local timezone.

Loop 7 times (i = 0,1,2,...,6). The intent is to produce slots for the next 7 days

new Date(today) makes a copy of today (important because Date is mutable).



setDate(today.getDate() + i) moves currentDate forward by i days. setDate handles month/year overflow automatically (e.g., from 31 → next month).



Creates a Date named endTime. Then sets its date to today + i and its time to 21:00 (9:00 PM).



Intent: probably meant to set the closing time (21:00) for currentDate.



This decides the starting time for the day's slots:



If currentDate is today (same date number), it tries to start from “after the current time” or at 10:00 if before 10:00.



currentDate.setHours(currentDate.getHours()>10 ? currentDate.getHours()+1 : 10) → if current hour > 10 then set hour to current hour + 1, else set hour to 10.



currentDate.setMinutes(currentDate.getMinutes()>30 ? 30 : 0) → if current minutes > 30 then set minutes to 30, otherwise set minutes to 0.



let timeSlots = \[]

Empty array that will hold the slots for this particular day.



Loop: as long as currentDate is less than or equal to endTime:



Make a human-readable time string with toLocaleTimeString. (Note: default 12/24h depends on locale; if you want 24-hour force hour12: false.)



timeSlots.push({ dateTime: new Date(currentDate), time: formattedTime }) adds an object containing a copy of the Date (important — new Date(currentDate) ensures the stored object won’t change when currentDate is changed later) and the formatted string.



currentDate.setMinutes(currentDate.getMinutes() + 30) advances the time by 30 minutes (in place).



This creates half-hourly slots from the start time to endTime.



setDocSlots(prev => (\[...prev, timeSlots]))

  }

}

After generating slots for that day, it appends that day's timeSlots array to your docSlots state using the functional updater form (safe when previous state may be stale).



This setDocSlots runs 7 times (one per loop iteration). Multiple state updates inside a loop are allowed but can be less efficient and harder to reason about than setting once with all data.



4\) creating related doctors componenet after creating time slots and book appointment button



creating relDOc state to store related doctors and destructuring the props passed to related doctors in appointment page and making useEffect function

we are taking the docID as a prop because we have to display related doctors except that doctor which is beign displayed



NOTE \_\_\_\_ SOMETIMES WHEN WEBPAGE IS NOT LOADING THAT COULD BE DUE TO FAULTY SYNTAX OF TAILWIND CSS THATS NOT BEING SHOWN AS RED ON VS CODE SO CHECK YOUR TAILWIND CSS ONCE TOO

--------------================ ABOUT PAGE-----------==========================



1\) all about creating styles



--------========CONTACT PAGE -----------==================



designing



-==============LOGIN PAGE==============

first logout then click on create account and then you will be at the login page

1))Convertible design when click on login opens login form and when clicked on create account opens create account form

2)creating state variable for storing login state and variables of input fields

3)creating onSubmit handler functions for forms which will have event parameter from the forms

4\) created the Every input field and implemented the logic to display login or create account accordingly



==============PROFILE PAGE ====================

1)when click on edit these fields become editable

2\) and click on save info to save changes

3\) to implement this editable field we will use the logic as coded



implementing profile page using various forms styling data and editable input logic etc

if clicked on edit button fields like name phone address gender dob becomes editable and vice versa for save information button



we will add the edit image functionality when doing backend

==========MY APPOINTMENT PAGE====================



Right now we dont have the appointment data so instead we will display the doctors data and when we will create the backend then we will replace it with appointments data





=======COMPLETED ALMOST ALL THE UI NOW MAKING THE WEBPAGE RESPONSIVE==============



we are not getting the menu for mobile screen

opem navbar and after the ternary operator check for changes and check for comments there that how we implemented the menu for mobile phones

adding hidden so that it remains hidden on specified screen



we have created the state variable show menu at start  now we will link this state with this image tag



when we click on any tab through mobile menu it should automatically close the menu and redirect us to that page

for that we will add onClick to navlink



the navlink has active classname by using this active classname we will provide bg color in index.css file by adding a media query



========NOW ON ALL DOCTORS PAGE WE HAVE TO CREATE A FILTER BUTTON TO DISPLAY FILTER MENU OR HIDEIT===========



creating a button and state variable for showing filter button







/////////BACKEND//////////////////////////////////



1)server.js

2)initializing backend

npm init

3\) npm install express mongoose multer bcrypt(to encrypt password) cloudinary(to store image) cors dotenv jsonwebtoken(for authentication) nodemon(restart the server whenever any changes made) validator

4\) creating a simple express app in server.js

we are using import statemenet so make the server modular in the package json file

import express from 'express'

import cors from 'cors'

import 'dotenv/config'

 created the express app for server

ran it using npm start

creating newscript that reflects changes at the time they are made



creating the folder structure for our backend project



created config for multiple configuration files like cloudinary mongodb,etc

create controllers - main logic for api here

middlewares- custom middlewares -to authenticate and other features

models- mongoose models to store the data in structured formats

routes- different routes for different apis

create .env for environment variables



now set up the database

create mondodb.js in config file

create account on mongodbatlas

create a new project then create a cluster

in create user password never use special symbol or @



in connect ->drivers -> copy this mongodb+srv://Lokasorus:<db\_password>@cluster0.tcjy85w.mongodb.net/? and in network access make sure that 0.0.0.0. ip address is added then in env files create some environment variables

such as

MONGODB\_URI = 'mongodb+srv://Lokasorus:<db\_password>@cluster0.tcjy85w.mongodb.net'



remove the password and add your password



now in mongodb.js do things



now iimport connectDB in server.js

This error occurs because Node.js ES modules require explicit file extensions when importing local files. Here's how to fix it:



Database connected



//now creating the config file for the cloudinary storage



create cloudinary.js in config file



open cloudinary on google -> dashboard -> go to api keys ->generate new api key-> copy the cloud name and API secret key



create these env variables in env files

CLOUDINARY\_NAME = 'daffbh6ph'

CLOUDINARY\_API\_KEY = '248782181415439'

CLOUDINARY\_SECRET\_KEY = 'AgYDyum8Q9e4zWxrBUifOzQCGmQ'



now in cloudinary.js

import {v2 as cloudinary} from 'cloudinary'



const connectCloudinary = async () => {



    cloudinary.config({

        cloud\_name:process.env.CLOUDINARY\_NAME,

        api\_key:process.env.CLOUDINARY\_API\_KEY,

        api\_secret:process.env.CLOUDINARY\_SECRET\_KEY

    })

}



export default connectCloudinary



now in server.js import and connect



------------------------------------------------------------MOVING TOWARDS MODELS---------------

create doctorModel.js

create userModel.js



creating api to add doctors in our database

in controller make doctor.controller.js



theres an admin panel using which an admin can add new doctors we are creating the controller for that only



admin controller.js

to pass the data from eq.body in form data we need a middleware





create multer.js

refer youtube database for better multer practices



creating adminRoute.js and doctorRoute.js

writing in admin route



now after exporting

go to sever.js to initialize the api endpoints



checking our addDoctor controller through thunderclient post->body->form->files check-> write fields

to add object in  the object stringify it "{}"



checked the api through postman, here in controller we are not returning anything thats why it keeps on loading

using this form data and doctorModel we will save our data in the database



validating things



encrypting password in admin COntroller through bcrypt



uploading the image file to cloudinary and getting the image\_url

and creating doctorDAta

check using postman and atlas- prescripto database created



///Creating the AUTHENTICATION SYSTEM SO THAT ONLY ADMIN CAN ADD THE DOCTOR TO THE SITE

go to env file and create admin variables



making loginAdmin ucn in admin controller



and updating the routes in admin ROutes

creating jwt tokens for admin login, importing jwt

to provide jwt secret uoadte .enc file



using this token we will allow the admin to login into the admin panel

we will create the middleware authentication and we will add to the doctor, whenever we will have the token then only we could add the doctor



adding callback function next to middleware auth.admin



copy the token from admin/login when logged in as admin

and paste that token in headers of admin/add-doctor with field atoken



==============CREATING ADMIN PANEL =============================



creating react project for admin panel



settting up admin similar to frontend



in vite.config folder add server port to 5173 in frontend

and add 5174 to admin



creating the folder structure for admin panel



creating the LOGIN PAGE



creating three context files admin app and doctor



AppContextProvider is a custom wrapper component that:



Acts like a "data container" for your entire app

Holds state (like doctors, currencySymbol)

Provides that data to all child components

Is basically a "smart component" that manages global state



The props parameter contains:

 // props is an object that contains all the properties

    // passed to this component when it's used

     console.log(props) // Would show: { children: <App /> }



props.children - All the components wrapped inside <AppContextProvider>

Any other props pass





// When you write this:

<AppContextProvider>

    <Navbar />

    <Home />

    <Footer />

</AppContextProvider>



// React automatically creates:

props = {

    children: \[

        <Navbar />,

        <Home />,

        <Footer />

    ]

}



// And {props.children} renders all of them



AppContextProvider = Your custom component that manages state

props = Contains children (components wrapped inside)

AppContext.Provider = React's built-in broadcasting component

value prop = The data you want to share

{props.children} = Renders all wrapped components

========================================================================================================



setting up context files in main.jsx



creating LOGIN PAGE FOR ADMIN



Switching between admin and doctor login



in Admin context creating state variable to store token there and backendURL



creating .env file in this admin folder and create backend url



in Login JSx creating SetAtoken state and backend url and using that calling API in that page



creating two state variable to store email id and password then linking it with the input field



creating the function for the login form so that when we submit that form that function will be executed (on submit property in form)



using axios package to call the API



and when we are login we getting the token in console of webpage

setting that token and storing that into local storage



notification for invalid credentials through react-toastify

import statement in app.jsx then in login.jsx



if we have the admin token we will not display the login page and rest of the pages of admin



updating app.jsx



so on refreshing our aToken also gets refreshed and we are back to admin login to resolve that in admin context we set state of atoken to localstorage





======CREATING THE DASHBOARD UI DESIGN FOR ADMIN========



creating Navbar component

making logout function when clicked on logout button



creating sidebar component and adding it in app.jsx



creating admin and doctor folder in pages and pages inside them



setup routes for our pages in app .jsx



designing Sidebar component



pasing isActive property in className of navlink



we have created the api to add the doctor so we will design the add doctor page first



The Function Part: ({isActive}) =>

isActive is a boolean (true/false) that React Router automatically gives you

isActive = true when you're currently ON this page

isActive = false when you're on a different page



hiding scroll bar in index.css



making ADD doctor page functional adding some state variables to store these data



linking the state variables with the input fields with onChange



creating one function onSUbmitHandler so that when clicked on add doctor that function will get executed and that will call our adddoctor api using toast and everything ---- using formData constructor to add the details of the doctor in this form data verified using console data and then move ahead to make api call to save the doctor details in the database



after adding one doctor we have to clear the input field so that we could add another doctor



adding all the 15 doctors in the database



=====================================================



====ALL DOCTORS PAGE WITH CHECKBOX FOR AVAILABLE AND UNAVAILABLE BOOKING===========



adminController



api controller to get all the data for all doctors list for admin panel

and update admin routes and adding the middleware authadmin



checked the al doctors function of admin controller through the postman

got 15 doctors data



using this creating DOctors-list.jsx of admin page

creating get all doctors in admin context .jsx and exporting it in value



now creating DOCTORS LIST JSX



adding custom font in index.css for admin panel



adding functionality to change the available property when clicked

adminCONTROLLER.js

and DoctorController.js

creating change availability controller in Doctor controller

'creating route in admin route



now adding this logic in DOctors list page



creating the arrow function in admin context to change the available property in Database

through api call and updating that input onChange in doctors list



======Coming to Frontend and integrating api there ============



declaring backend url in frontend .env folder

then in API context we are going to call the api and get the doctors data there



making getDoctors function to call api axios.get method

removing doctors import from assets as now we will linking all of this to database



no docs in frontend as not updated the backend yet



setting up the react toastify in frontend



in DOCTOR CONTROLLER

creating DoctorsList for frontend



update the Doctor ROute



setting up doctor route in server.js



creating the userController.js to create logic for login register book appointment display appointment, get profile, update profile, cancel appointment and payment gateway



we are adding three details now, and rest of the details can be edited from the my profile page later



create the route for Register user in USer route.js

then setting up route for user in the server.js



testing the register user api



creating the user login api and setup its routes



integrating these apis in frontend



in LoginPage

whenever we will login or signup we will get a token so in appcontext we will create a state variable where we will store the userAuthentication token

now in LoginPage destructure the backendurl token and settoken



now try catch in Onsubmithandler function to call the api



linking the onsubmit function with the form tag



///removing the token settoken in navbar that we created for our reference purpose and importing the real deal from app context



also while logout the user we created one p tag which was settoken(false)

creating a logout function and linking with that p tag of logout



now after doing login we have token in localstorage but still at the login page so solving this

in login jsx and adding useEffect function



whenever we reload the webpage our state gets recreated and in the Appcontext here we have to add the logic in token,setToken = useState(check for local storage)



======now we will get the userData from the api and display the users data in MY profile Page===



in backend userController

creating a new controller to get the userProfileData



now to change the header into user id we will be creating a middleware

setting up getprofile routes



tested api



now Making Update Controller

setting up its route



testing the apis



updated the database info



INTEGRATING THIS API IN OUR FRONTEND

creating state variable and new function in API CONTEXT

now we have to run this function whenever the user is logged in

then creating useEffect hook



now MYPROFILE JSX PAGE



at first we have this

 const \[userData, setUserData] = useState({

    name: "Edward Vincent",

    image: assets.profile\_pic,

    email: 'richardjamesswap@gmail.com',

    Phone: '+1  123 456 7890',

    Address:{

      line1: "57th Cross, Richmond",

      line2: "Circle, Church Road, London"

    },

    gender:'Male',

    dob: '2000-01-20'



  })

NOw remove this and use APP CONTEXT and import userData and setUserData

and do return Userdata \&\& then load div if userdata available



now Integrating update api



creating the logic to update the profile image in myprofile page



  <button className ='border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all' onClick ={()=>setIsEdit(false)}>Save information</button>



remove the setIsEdit and replace with updateuserProfileData



then creating the function updateuserProfileData





\*\*\*\*\*\*\*\*\*\*\*\*\*\*NOTES\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*



when i was integrating with backend due to the inconsistencies in variable names between backend and frontend i faced many issues while debugging so keep in mind to be consistent with your variable naming it will ease up your task a lot



\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*\*



now when we update the image we also have to display in nav bar too



so come in navbarjsx



and get userData from the context

 <img className = 'w-8 rounded-full' src ={assets.profile\\\_pic} alt =""/>

and add the ternary operator here







================BOOK APPOINTMENT LOGIC================================



for that coming to backend we create new Model

creating appointmentmodel



controller function to book the appointment in user controller



setting u routes for book appointment





now in the frontend section adding getDoctors data into the value of app context

and updating the appointment page to implement the book appointment function



now hiding the booked slots

in getavailable slots function after formatted time we will create some logic to hide the booked times





 let day = currentDate.getDate()

        let month = currentDate.getMonth()+1

        let year = currentDate.getUTCFullYear()



        const slotDate = day + "\_" + month + "\_" + year

        const slotTime = formattedTime



        const isSlotAvailable = docInfo.slots\_booked\[slotDate] \&\& docInfo.slots\_booked\[slotDate].includes(slotTime) ? false: true;

 

        if(isSlotAvailable){





           //add slot to array

           timeSlots.push({

             dateTime: new Date(currentDate),

            time: formattedTime

           })

        }





displaying the actual appointments in the my appointment page

create list appointment in user controller



now in myappointment page making appointment and setAppoitnment state variables and connecting it to backend



instead of item.image in Item.docData.image now, as we are taking info from the backend database now replace the item with item.docData



editing the date of myappoitment age



creating months variable in myappointments page and slotDate formatter for that purpose



creating the Cancel appointment functionality



in userController.js creating the logic to cancel the appointment



integrating this api in frontend in myappointment jsx



now not displaying the cancel appointment and payonline the buttong once the appointment is cancelled

and display the cancelled text if the appointment is cancelled



now after cancelling the appointment we should get the booked slot back for that we have to reload the webpage, so to fix that we destructure the getDoctorsData and call getDoctorsData after get user appointment





============NOW the Pay online button =================



USING RAZORPAY AS PAYMENT METHOD

installing razorpay in backend using npm install razorpay and importing in usercontroller for payment razorpay function and making the instance of razor pay with key id and secret key for that use razorpay website, get the keyed and keysecret from the test mode



now integrating payment function in myappointment jsx file



using the order property we have to initialize the razorpay payment for that we have to search razorpay web integration copy this <script src="https://checkout.razorpay.com/v1/checkout.js"></script>

add this script in index.html after the div root



by using the order creating options using the initPay function



use razorpay dummy card for the payment



after completing the payment we will have these

{razorpay\_payment\_id: 'pay\_RUyD8B3VBWcjxt', razorpay\_order\_id: 'order\_RUyBVz7ApHdoka', razorpay\_signature: '1234f0da66787c90d0b030cd95e26aeab0f12acb26a4de50abf6a9e6fc8a7924'}razorpay\_order\_id: "order\_RUyBVz7ApHdoka"razorpay\_payment\_id: "pay\_RUyD8B3VBWcjxt"razorpay\_signature: "1234f0da66787c90d0b030cd95e26aeab0f12acb26a4de50abf6a9e6fc8a7924"\[\[Prototype]]: Object

MyAppointments.jsx:34 (5) \[{…}, {…}, {…}, {…}, {…}]



now using these properties we will verify the payment in backend and mark the payment status as true



so now in backend userController creating verifyRazorpay function



make its route



and test this api endpoint using postman



orderINfo console log in backend



id: 'order\_RUyBVz7ApHdoka',

  entity: 'order',

  amount: 2200,

  amount\_paid: 2200,

  amount\_due: 0,

  currency: 'INR',

  receipt: '68f3a0ea52fba348922bdb31',

  offer\_id: null,

  status: 'paid',

  attempts: 1,

  notes: \[],

  created\_at: 1760797890,

  description: null,

  checkout: null

}



we will chek the status paid



and then we will write code in handler function of myappointment page



then creating the functionality of display



ing the paid button when payment is done



COMPLETED ALL THE FUNCTIONALITY OF CLIENTS WEBSITE



=====================Creating the functionality of ADMINS PANEL==================================





CREATINF THE APPOINTMENTS PAGE



======Creating API Controller func in admin controller to get the API of all the appointments=====



creating its route in admin route



then in admin context creating get all appointments function, and creating the state variable for the same



creating UI for all appointments page



now displaying the appointment info in table format



for calculating age using DOB we will create the calculate age func in app context



then in all appointment jsx file make the api call to get the all appointment data



in Actions tab we will add the cancel button to cancel the appointment from admin panel



creating the API to cancel appointment from the admin panel



*in backend admin controller creating the cancel appointment and then linking the api to the admin context*





*======CREATING THE DASHBOARD PAGE FOR ADMIN===============*



*Now to display the data in the dashboard we have to display the total no of appointments and doctors*

*so we will create an api to get the dashboard data for admin panel in admin controller*



*now integrating the api into the Dashboard jsx*



*now creating new state variable in admin context dashData and new function to get the data*



*now importing and creating the Dashboard UI page*

*now displaying the latest appointment*



*adcopy cancl logic from all appointments*



*===Seperate Dashboard for the Doctor===========*



*creating the Doctor Login Logic*



*creating APi for doctor logic in doctor controller*

*setting login routes*



*integrating this loin api into LOgin jsx
beore that storing required function in DOctor Context*



*now getting and customizing according to Doctor login in app.jsx*

*no sidebar we will use different sidebar for this*



*creating the doctor pages*



*creating routes for these in app jsx*



======Creating Appointment Page of DOCTOR ==========



in backend creating api and setting up its route 

create a middleware to authenticate the doctor



creating the controller function to get all the apppintments for the doctor



now Making DoctorAppointments.jsx

making logic to cancel or completed through the appointment page



Open doctor controller and add the logic there



now creating the function to mark complete and cancel in doctorcontext



Creating THE DASHOARD FOR DOCTORS







in doctor controller settting the api and then routes



integrating this api in the dashboard page



before that create state variable and function to store the dashboard data 



now creating the ui design for dashboard by copying from admin dashboard





==========DOCTOR PROFILE PAGE=============



in doctor controller creating and setting up the routes

integrating these apis into doctor profile page

in doctor context create the state and required function to do so

now in the doctor Profile jsx creating and importing function



adddint eht functionality to Edit the doctor profile data when clicked on edit button



create a state variable isEdit for that

adding checked in available input field

making appointment fee editable by adding onClick property in the button tag

making appointment fee Editable by adding ternary operator



adding logic to save the updated data into the database



nw modifying the my appointment page of frontend to connect it with cancelled and completed appointments from doctors page



fixing the doctor logout



making admin folder cancel appointment connected to doctor panel in sync 



when updating the available from doctor panel lets update it ino the home page too in TOp doctors page and do the same in related doctors and all doctors too in doctors jsx





===============PROJECT COMPLETED====================

====DEPLOYMENT=====

open account on render

push your project to GitHub repo

for backend use web services on dashboard

backend url = https://prescripto-backend2-tov9.onrender.com

provide this link in place of backend url everywhere in frontend

as nodemon could not be deployed into production so change nodemon to node in package and make start command as npm start



use render static site for frontend

frontend url = https://prescripto-frontend-7rcx.onrender.com

//now deploying admin panel



admin url = https://prescripto-admin-kyos.onrender.com





