import { createContext } from "react";
import { doctors } from "../assets/assets";

export const AppContext = createContext()

const AppContextProvider = (props) => {


    const currencySymbol = '$'


    const value = {
        //whatever we add here can be accessed in any component
        doctors, currencySymbol

    }
    return (
        <AppContext.Provider value ={value}>
            {props.children}
        </AppContext.Provider>
    )
}

export default AppContextProvider