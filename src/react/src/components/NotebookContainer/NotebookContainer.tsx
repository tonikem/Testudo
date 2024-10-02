import React, { useEffect, useState } from 'react'
import NotebookList from './subcomponents/NotebookList'
import spinner from '../../../public/spinner.png'
import './style.css'
import { BaseURL, getCookie } from '../../methods/AppMethods'


const NotebookContainer = () => {
    const [getNotebooks, setNotebooks] = useState({main: []})

    useEffect(() => {
        let cookie = getCookie("testudoAuthorization")

        fetch(`${BaseURL}/notebooks/${cookie}`)
            .then(res => res.json())
            .then(mainData => {
                if (mainData.Status === "Failure. Missing token!") {
                    // Varoitetaan tokenin puuttumisesta
                    alert("You are missing token!")
                    setNotebooks({ "main": [] })
                } else {
                    // Asetetaan koko data
                    setNotebooks(mainData)
                }
            })
      }, [])

    return <div id="notebook-container">
    <NotebookList getNotebooks={getNotebooks}
        setNotebooks={setNotebooks}/>
    <img id="spinner" src={spinner} />
</div>
}




export default NotebookContainer

