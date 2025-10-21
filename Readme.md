Here is a thorough documentation draft for your GitHub README, based on the setup procedure and notes you provided.

-----

# Prescripto - Doctor Appointment Booking System

Prescripto is a full-stack web application designed to streamline the process of booking and managing doctor appointments. It provides a complete ecosystem with three distinct portals: one for patients (clients), one for doctors, and a comprehensive admin panel for site management.

The application handles everything from user registration, doctor discovery, and slot booking to online payments and profile management.

## 🔴 Live Demo

  * **Client Application:** [https://prescripto-x9ec.onrender.com](https://prescripto-x9ec.onrender.com)
  * **Backend API:** [https://prescripto-backend2-5u2g.onrender.com](https://prescripto-backend2-5u2g.onrender.com)

*(Note: The Admin and Doctor portals are separate applications, but login can be accessed through the main system's logic.)*

-----

## ✨ Features

The application is divided into three main roles:

### 👨‍⚕️ Patient (Client) Portal

  * **Authentication:** Secure user registration and login with JWT.
  * **Doctor Discovery:** Browse all doctors, filter by specialty, and view top-rated doctors.
  * **Appointment Booking:** Select a doctor, view their 7-day available slots, and book an appointment.
  * **Payment:** Integrated [Razorpay](https://razorpay.com/) gateway to pay for appointments online.
  * **Profile Management:** Users can view and update their profile information, including name, address, and profile picture.
  * **My Appointments:** A dedicated page to view all upcoming and past appointments, with the ability to **cancel** upcoming ones.

### 🩺 Doctor Portal

  * **Doctor Authentication:** Secure login for registered doctors.
  * **Dashboard:** A quick overview of statistics relevant to the doctor.
  * **Appointment Management:** View all appointments assigned to the doctor.
  * **Status Updates:** Mark appointments as "Completed" or "Cancel" them.
  * **Profile Management:** Doctors can edit their personal details, availability, and appointment fees.

### 🖥️ Admin Panel

  * **Admin Authentication:** Secure login for the site administrator.
  * **Central Dashboard:** View high-level statistics, including total doctors, total appointments, and recent bookings.
  * **Doctor Management:**
      * Add new doctors to the platform with all their details (specialty, image, etc.).
      * View a list of all doctors.
      * Toggle a doctor's booking availability (Available/Unavailable).
  * **Appointment Management:** View all appointments across the entire platform and cancel them if necessary.

-----

## 🛠️ Tech Stack

This project is a full-stack MERN application built with modern technologies.

  * **Backend:**
      * [Node.js](https://nodejs.org/)
      * [Express](https://expressjs.com/)
      * [MongoDB](https://www.mongodb.com/) (with [Mongoose](https://mongoosejs.com/))
      * [JSON Web Tokens (JWT)](https://jwt.io/) for authentication
      * [Bcrypt](https://www.npmjs.com/package/bcrypt) for password hashing
      * [Cloudinary](https://cloudinary.com/) for image storage
      * [Multer](https://www.npmjs.com/package/multer) for file-upload handling
      * [Razorpay](https://razorpay.com/) for payment integration
  * **Frontend (Client, Admin, & Doctor):**
      * [React](https://reactjs.org/) (built with [Vite](https://vitejs.dev/))
      * [React Router DOM](https://reactrouter.com/) for routing
      * [Tailwind CSS](https://tailwindcss.com/) for styling
      * [Axios](https://axios-http.com/) for API requests
      * [React Toastify](https://www.npmjs.com/package/react-toastify) for notifications
      * React Context API for state management
  * **Deployment:**
      * [Render](https://render.com/) (for backend web service and frontend static sites)

-----

## 🚀 Getting Started

To run this project locally, you'll need to set up the backend, the client, and the admin panel.

### Prerequisites

  * [Node.js](https://nodejs.org/en/download/) (v16 or later)
  * [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (or a local MongoDB instance)
  * [Cloudinary](https://cloudinary.com/) account for image storage
  * [Razorpay](https://razorpay.com/) account for payment testing

### 1\. Backend Setup

1.  Navigate to the `backend` directory:

    ```bash
    cd backend
    ```

2.  Install the required dependencies:

    ```bash
    npm install
    ```

3.  Create a `.env` file in the `backend` directory and add the following variables. Replace the placeholders with your actual keys.

    ```env
    # MongoDB
    MONGODB_URI=your_mongodb_connection_string

    # Cloudinary
    CLOUDINARY_NAME=your_cloudinary_cloud_name
    CLOUDINARY_API_KEY=your_cloudinary_api_key
    CLOUDINARY_SECRET_KEY=your_cloudinary_api_secret

    # JWT
    JWT_SECRET=your_super_secret_jwt_key

    # Admin Credentials (for initial login)
    ADMIN_EMAIL=admin@example.com
    ADMIN_PASSWORD=your_secure_admin_password

    # Razorpay
    RAZORPAY_KEY_ID=your_razorpay_key_id
    RAZORPAY_SECRET_KEY=your_razororpay_secret
    ```

4.  Start the backend server:

    ```bash
    npm start
    ```

    The server will be running on `http://localhost:4000` (or your configured port).

### 2\. Frontend (Client) Setup

1.  In a new terminal, navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install the required dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `frontend` directory:
    ```env
    VITE_BACKEND_URL=http://localhost:4000
    ```
4.  Start the frontend development server (usually on `port 5173`):
    ```bash
    npm run dev
    ```

### 3\. Admin Panel Setup

1.  In another terminal, navigate to the `admin` directory:
    ```bash
    cd admin
    ```
2.  Install the required dependencies:
    ```bash
    npm install
    ```
3.  Create a `.env` file in the `admin` directory:
    ```env
    VITE_BACKEND_URL=http://localhost:4000
    ```
4.  Start the admin panel development server (usually on `port 5174`):
    ```bash
    npm run dev
    ```

You should now have the entire application stack running locally\!

-----

## 📝 Author's Note

This project was a significant learning experience. A key takeaway during development was the importance of **consistent variable naming** between the frontend and backend. Mismatches in field names (e.g., `docInfo` vs. `doctorData`) caused several hard-to-debug issues. Maintaining a consistent data schema and naming convention is crucial for a smooth full-stack workflow.
